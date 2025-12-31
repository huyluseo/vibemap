
import { useEffect, useState } from "react";
import { database } from "@/lib/firebase";
import { ref, push, onValue, update, get, query, orderByChild, equalTo } from "firebase/database";
import { User as FirebaseUser } from "firebase/auth";

export interface FriendRequest {
    id: string;
    from: string;
    fromName: string;
    fromPhoto?: string;
    to: string;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: number;
}

export function useFriendRequests(user: FirebaseUser | null) {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(false);

    // Listen for incoming requests
    useEffect(() => {
        if (!user) return;

        const requestsRef = ref(database, "friend_requests");
        const q = query(requestsRef, orderByChild("to"), equalTo(user.uid));

        const unsubscribe = onValue(q, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: FriendRequest[] = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    ...val
                }));
                // Filter only pending requests
                setRequests(list.filter(req => req.status === 'pending'));
            } else {
                setRequests([]);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const sendRequest = async (email: string) => {
        if (!user || !email) return { success: false, error: "Invalid data" };
        setLoading(true);

        try {
            const usersRef = ref(database, "users");
            const snapshot = await get(usersRef);
            const users = snapshot.val();

            interface UserData {
                uid: string;
                email?: string;
                displayName?: string;
                photoURL?: string;
            }

            let foundUser: UserData | null = null;

            if (users) {
                // Use for...of loop for better TS control flow analysis
                for (const [uid, val] of Object.entries(users)) {
                    const uVal = val as any;
                    if (uVal.email === email) {
                        foundUser = { uid, ...uVal };
                        break; // Found, stop searching
                    }
                }
            }

            if (!foundUser) {
                setLoading(false);
                return { success: false, error: "User not found" };
            }

            // At this point foundUser is definitely UserData
            if (foundUser.uid === user.uid) {
                setLoading(false);
                return { success: false, error: "Cannot add yourself" };
            }

            // 2. Send Request
            const newReqRef = push(ref(database, "friend_requests"));
            await update(newReqRef, {
                from: user.uid,
                fromName: user.displayName || "Unknown",
                fromPhoto: user.photoURL || "",
                to: foundUser.uid, // No assertion needed now theoretically
                status: 'pending',
                timestamp: Date.now()
            });

            setLoading(false);
            return { success: true };

        } catch (error: any) {
            setLoading(false);
            return { success: false, error: error.message };
        }
    };

    const acceptRequest = async (requestId: string, fromUid: string) => {
        if (!user) return;

        try {
            // 1. Update request status
            const reqRef = ref(database, `friend_requests/${requestId}`);
            await update(reqRef, { status: 'accepted' });

            // 2. Add to my friends
            const myFriendRef = ref(database, `users/${user.uid}/friends/${fromUid}`);
            await update(ref(database, `users/${user.uid}/friends`), { [fromUid]: true });

            // 3. Add me to their friends
            const theirFriendRef = ref(database, `users/${fromUid}/friends/${user.uid}`);
            await update(ref(database, `users/${fromUid}/friends`), { [user.uid]: true });

        } catch (error) {
            console.error("Error accepting", error);
        }
    };

    const rejectRequest = async (requestId: string) => {
        const reqRef = ref(database, `friend_requests/${requestId}`);
        await update(reqRef, { status: 'rejected' });
    };

    return { requests, sendRequest, acceptRequest, rejectRequest, loading };
}
