import { useState, useEffect } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Sync email to DB for search
                // We do this here to ensure email is always fresh/available
                import("firebase/database").then(({ ref, update }) => {
                    const { database } = require("@/lib/firebase");
                    const userRef = ref(database, `users/${currentUser.uid}`);
                    update(userRef, {
                        email: currentUser.email,
                        lastLogin: Date.now()
                    });
                });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return { user, loading, signOut };
}
