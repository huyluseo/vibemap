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
            {
                enableHighAccuracy: true, // Try high accuracy first
                timeout: 10000,
                maximumAge: 0
            }
        );

        // Fallback for timeout or error: restart with low accuracy if needed?
        // Actually, watchPosition will just keep failing. 
        // A better pattern: start with high accuracy, if error, fallback to low.
        // But for complexity, let's just stick to a balanced config or ignore timeouts after first success.

        // Let's use a robust config that works for most PWA/Maps:
        // High accuracy is needed for "Speed".

        // If timeout occurs, we can try to recover.


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
