import { useEffect } from "react";
import { User } from "firebase/auth";
import { messaging, database } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { ref, update } from "firebase/database";

export function useNotifications(user: User | null) {
    useEffect(() => {
        if (!user) return;

        const requestPermission = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    const msg = await messaging();
                    if (!msg) return;

                    // Get Token
                    // VAPID key is usually optional for Firebase unless explicit, 
                    // but good practice to generate one in console if needed. 
                    // For now using default config.
                    const currentToken = await getToken(msg, {
                        // vapidKey: "YOUR_VAPID_KEY_FROM_CONSOLE" 
                        // If missing, it might use default if configured in firebase.json
                    });

                    if (currentToken) {
                        // Save token to database
                        const updates: any = {};
                        updates[`/users/${user.uid}/fcmToken`] = currentToken;
                        await update(ref(database), updates);
                        // console.log("FCM Token updated");
                    } else {
                        console.log("No registration token available. Request permission to generate one.");
                    }

                    // Listen for foreground messages
                    onMessage(msg, (payload) => {
                        console.log("Message received. ", payload);
                        // Customize how to show foreground notification (e.g. Toast)
                        // Or just let the browser handle it if focus is elsewhere
                        new Notification(payload.notification?.title || "VibeMap", {
                            body: payload.notification?.body,
                            icon: "/icon-192x192.png",
                        });
                    });
                }
            } catch (error) {
                console.error("An error occurred while retrieving token. ", error);
            }
        };

        requestPermission();
    }, [user]);
}
