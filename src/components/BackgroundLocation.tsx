'use client';

import { useEffect, useRef } from 'react';
import { registerPlugin } from '@capacitor/core';
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { LocalNotifications } from '@capacitor/local-notifications';

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
                        backgroundMessage: "Cancel to prevent battery drain.",
                        backgroundTitle: "Tracking You",
                        requestPermissions: true,
                        stale: false,
                        distanceFilter: 10
                    },
                    (location, error) => {
                        if (error) {
                            if (error.code === "NOT_AUTHORIZED") {
                                if (window.confirm(
                                    "This app needs your location to track you in the background.\n\n" +
                                    "Open settings now?"
                                )) {
                                    BackgroundGeolocation.openSettings();
                                }
                            }
                            return console.error(error);
                        }

                        console.log("Location:", location);
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
