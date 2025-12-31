import { useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { database } from "@/lib/firebase";
import { ref, update, onDisconnect } from "firebase/database";

export function useLocation(user: FirebaseUser | null) {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Sync Location to Firebase
    useEffect(() => {
        if (!user) return;

        if (!("geolocation" in navigator)) {
            console.error("Geolocation not supported");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });

                // Update Firebase
                const userRef = ref(database, `users/${user.uid}`);
                update(userRef, {
                    location: {
                        lat: latitude,
                        lng: longitude
                    },
                    status: 'online',
                    lastUpdated: Date.now()
                });

                // Set offline status on disconnect
                onDisconnect(userRef).update({
                    status: 'offline'
                });
            },
            (error) => {
                console.error("Error getting location:", {
                    code: error.code,
                    message: error.message,
                    PERMISSION_DENIED: error.PERMISSION_DENIED,
                    POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
                    TIMEOUT: error.TIMEOUT
                });
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [user]);

    // Sync Battery (Bonus)
    useEffect(() => {
        if (!user) return;

        // @ts-ignore - Battery API is not standard yet
        if (navigator.getBattery) {
            // @ts-ignore
            navigator.getBattery().then(battery => {
                const updateBattery = () => {
                    const userRef = ref(database, `users/${user.uid}`);
                    update(userRef, {
                        battery: Math.round(battery.level * 100),
                        isCharging: battery.charging
                    });
                };

                updateBattery();
                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);
            });
        }
    }, [user]);

    return { location };
}
