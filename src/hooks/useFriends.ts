import { useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export interface VibeUser {
    uid: string;
    location?: { lat: number; lng: number };
    status?: string;
    battery?: number;
    isCharging?: boolean;
    name?: string; // If you save name in DB
    photoURL?: string;
}

export function useFriends(currentUser: FirebaseUser | null) {
    const [friends, setFriends] = useState<VibeUser[]>([]);

    useEffect(() => {
        if (!currentUser) return;

        // 1. Listen to my friends list
        const myFriendsRef = ref(database, `users/${currentUser.uid}/friends`);
        let myFriendsMap: Record<string, boolean> = {};

        const unsubscribeFriends = onValue(myFriendsRef, (snapshot) => {
            myFriendsMap = snapshot.val() || {};
            // Trigger users filtering whenever friends list changes
            // But we need the users data first. 
            // We'll let the users listener handle the merging.
        });

        // 2. Listen to all users (for real-time location updates of everyone... wait, we only want friends)
        // Optimization: In a real app we'd use GeoFire or selective listeners. 
        // For MVP, listening to 'users' is fine.
        const usersRef = ref(database, "users");
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data && myFriendsMap) {
                const usersList: VibeUser[] = Object.entries(data)
                    .filter(([uid]) => myFriendsMap[uid] === true) // Filter: Must be in friends map
                    .map(([uid, val]: [string, any]) => ({
                        uid,
                        ...val,
                    }));

                setFriends(usersList);
            } else {
                setFriends([]);
            }
        });

        return () => {
            unsubscribeFriends();
            unsubscribeUsers();
        };
    }, [currentUser]);

    return { friends };
}
