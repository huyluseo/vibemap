'use client';

import { useEffect, useRef } from 'react';
import { registerPlugin } from '@capacitor/core';
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { LocalNotifications } from '@capacitor/local-notifications';
import { ref, update } from "firebase/database";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

export function BackgroundLocation() {
    const watcherIdRef = useRef<string | null>(null);

    useEffect(() => {
        const initBackgroundLocation = async () => {
            try {
                // 1. Request Notification Permission (Required for Android 13+ Foreground Service)
                const notifs = await LocalNotifications.requestPermissions();
                if (notifs.display !== 'granted') {
                    console.warn("Notification permission NOT granted.");
                    alert("Notification permission is required for background tracking.");
                    return;
                }

                // 2. Add Watcher (This triggers Location Permission requests)
                // Using 'requestPermissions: true' often handles it, but explicit checks are safer.

                // Prevent duplicate watchers
                if (watcherIdRef.current) {
                    return;
                }

                const watcherId = await BackgroundGeolocation.addWatcher(
                    {
                        backgroundMessage: "Tracking active to share location with friends.",
                        backgroundTitle: "VibeMap is running",
                        requestPermissions: true,
                        stale: false,
                        distanceFilter: 50 // Battery Saver: Only update every 50 meters
                    },
                    (location, error) => {
                        if (error) {
                            if (error.code === "NOT_AUTHORIZED") {
                                if (window.confirm(
                                    "Allow VibeMap to access location in background?"
                                )) {
                                    BackgroundGeolocation.openSettings();
                                }
                            }
                            return console.error(error);
                        }

                        console.log("Bg Location:", location);

                        // Sync to Firebase (Optimized)
                        // We need to import 'auth' and 'database' dynamically or use a helper
                        // equivalent to what useLocation does.
                        // Since this is inside a component, we can use the imported firebase libs.

                        import("@/lib/firebase").then(({ auth, database }) => {
                            const user = auth.currentUser;
                            if (user && location) {
                                const { latitude, longitude, speed } = location; // Plugin structure might differ, checking...
                                // Plugin returns: { latitude, longitude, accuracy, altitude, speed, bearing, time, ... }

                                const userRef = ref(database, `users/${user.uid}`);
                                update(userRef, {
                                    location: {
                                        lat: latitude,
                                        lng: longitude
                                    },
                                    speed: speed || 0,
                                    status: 'online', // Keep status online while tracking
                                    lastUpdated: Date.now()
                                });
                            }
                        });
                    }
                );

                watcherIdRef.current = watcherId;
                console.log("Background Geolocation started with ID:", watcherId);

            } catch (err) {
                console.error("Error initializing background location:", err);
            }
        };

        if (typeof window !== 'undefined') {
            initBackgroundLocation();
        }

        // Cleanup function
        return () => {
            if (watcherIdRef.current) {
                BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
                watcherIdRef.current = null;
            }
        };
    }, []);

    return null;
}
