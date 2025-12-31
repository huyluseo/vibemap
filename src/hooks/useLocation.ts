import { useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { database } from "@/lib/firebase";
import { ref, update, onDisconnect } from "firebase/database";

export function useLocation(user: FirebaseUser | null) {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [speed, setSpeed] = useState<number | null>(null);

    // Sync Location to Firebase
    useEffect(() => {
        if (!user) return;

        if (!("geolocation" in navigator)) {
            console.error("Geolocation not supported");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed: rawSpeed } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                setSpeed(rawSpeed);

                // Update Firebase
                const userRef = ref(database, `users/${user.uid}`);
                update(userRef, {
                    location: {
                        lat: latitude,
                        lng: longitude
                    },
                    speed: rawSpeed, // m/s
                    status: 'online',
                    lastUpdated: Date.now()
                });

                // Set offline status on disconnect
                onDisconnect(userRef).update({
                    status: 'offline'
                });
            },
            (error) => {
                console.error("Error getting location:", error);
                console.error("Error details:", {
                    code: error.code,
                    message: error.message
                });
            },
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
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

    return { location, speed };
}
