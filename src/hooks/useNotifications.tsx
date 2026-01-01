import { useEffect } from "react";
import { User } from "firebase/auth";
import { messaging, database } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { ref, update } from "firebase/database";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Toast } from "@capacitor/toast";

export function useNotifications(user: User | null) {
    useEffect(() => {
        if (!user) return;

        const setupNotifications = async () => {
            if (Capacitor.isNativePlatform()) {
                // --- NATIVE (Android/iOS) ---
                try {
                    let permStatus = await PushNotifications.checkPermissions();

                    if (permStatus.receive === 'prompt') {
                        permStatus = await PushNotifications.requestPermissions();
                    }

                    if (permStatus.receive !== 'granted') {
                        console.log("User denied permissions!");
                        return;
                    }

                    // Create Channel (Required for Android 8+)
                    await PushNotifications.createChannel({
                        id: 'vibemap_default',
                        name: 'VibeMap Notifications',
                        description: 'General notifications',
                        importance: 5,
                        visibility: 1
                    });

                    await PushNotifications.register();

                    // Listeners
                    PushNotifications.addListener('registration', async (token) => {
                        console.log('Push registration success, token: ' + token.value);
                        await Toast.show({
                            text: 'Push Registered! Token: ' + token.value.substring(0, 5) + '...',
                            duration: 'long'
                        });
                        // Update Firebase
                        const updates: any = {};
                        updates[`/users/${user.uid}/fcmToken`] = token.value;
                        await update(ref(database), updates);
                    });

                    PushNotifications.addListener('registrationError', (error) => {
                        console.error('Error on registration: ' + JSON.stringify(error));
                        Toast.show({
                            text: 'Push Error: ' + JSON.stringify(error),
                            duration: 'long'
                        });
                    });

                    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                        console.log('Push received: ', notification);
                        await Toast.show({
                            text: 'Push Received: ' + (notification.title || "No Title"),
                            duration: 'short'
                        });

                        // Show local notification
                        await LocalNotifications.schedule({
                            notifications: [{
                                title: notification.title || "VibeMap",
                                body: notification.body || "",
                                id: new Date().getTime(),
                                schedule: { at: new Date(Date.now() + 100) },
                                extra: notification.data,
                                channelId: 'vibemap_default' // Use the created channel
                            }]
                        });
                    });

                    // Action performed
                    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                        // Remove alert, just log
                        console.log('Push action performed: ' + JSON.stringify(notification));
                    });

                } catch (e) {
                    console.error("Native push setup failed", e);
                    Toast.show({
                        text: 'Native Setup Failed: ' + JSON.stringify(e),
                        duration: 'long'
                    });
                }

            } else {
                // --- WEB ---
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        const msg = await messaging();
                        if (!msg) return;

                        const currentToken = await getToken(msg, {
                            // vapidKey: "YOUR_VAPID_KEY_FROM_CONSOLE" 
                        });

                        if (currentToken) {
                            const updates: any = {};
                            updates[`/users/${user.uid}/fcmToken`] = currentToken;
                            await update(ref(database), updates);
                        } else {
                            console.log("No registration token available.");
                        }

                        onMessage(msg, (payload) => {
                            console.log("Message received. ", payload);
                            new Notification(payload.notification?.title || "VibeMap", {
                                body: payload.notification?.body,
                                icon: "/icon-192x192.png",
                            });
                        });
                    }
                } catch (error) {
                    console.error("An error occurred while retrieving token. ", error);
                }
            }
        };

        setupNotifications();

        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, [user]);
}
