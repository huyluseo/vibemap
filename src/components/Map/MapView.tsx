import { useState, useEffect } from "react";
import Map, { NavigationControl, Marker, GeolocateControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { User, Battery, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MapViewProps {
    userLocation: { lat: number; lng: number } | null;
}

export default function MapView({ userLocation }: MapViewProps) {
    const { user } = useAuth();
    const { friends } = useFriends(user);
    const [hasCentered, setHasCentered] = useState(false);

    const [viewState, setViewState] = useState({
        latitude: 10.7769,
        longitude: 106.7009,
        zoom: 14,
    });

    // Auto-center on user location when loaded
    useEffect(() => {
        if (userLocation && !hasCentered) {
            setViewState(prev => ({
                ...prev,
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                zoom: 15
            }));
            setHasCentered(true);
        }
    }, [userLocation, hasCentered]);

    return (
        <div className="w-full h-screen relative bg-vibe-black">
            {!MAPBOX_TOKEN ? (
                <div className="flex items-center justify-center h-full text-vibe-error">
                    Missing Mapbox Token in .env.local
                </div>
            ) : (
                <Map
                    {...viewState}
                    onMove={(evt) => setViewState(evt.viewState)}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    mapboxAccessToken={MAPBOX_TOKEN}
                >
                    <GeolocateControl position="top-right" />
                    <NavigationControl position="top-right" />

                    {/* Current User Marker */}
                    {user && userLocation && (
                        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="bottom">
                            <div className="relative group flex flex-col items-center">
                                {/* Pulse Effect for Current User */}
                                <div className="absolute -inset-4 bg-vibe-primary/20 rounded-full animate-ping pointer-events-none" />

                                {/* Avatar Circle */}
                                <div className="w-12 h-12 rounded-full border-2 border-vibe-primary bg-vibe-dark/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.6)] overflow-hidden z-10 relative">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="text-vibe-primary w-6 h-6" />
                                    )}
                                </div>

                                <div className="absolute -bottom-6 text-xs bg-vibe-primary/90 text-black font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                    You
                                </div>
                            </div>
                        </Marker>
                    )}

                    {/* Friends Markers */}
                    {friends.map((friend) => (
                        friend.location && (
                            <Marker key={friend.uid} longitude={friend.location.lng} latitude={friend.location.lat} anchor="bottom">
                                <div className="relative group flex flex-col items-center">
                                    {/* Status Indicator (Online/Offline) */}
                                    <div className={`w-3 h-3 rounded-full border-2 border-vibe-black mb-1 ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />

                                    {/* Avatar Circle */}
                                    <div className="w-10 h-10 rounded-full border-2 border-vibe-accent bg-vibe-dark/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.5)] overflow-hidden">
                                        <User className="text-white w-6 h-6" />
                                    </div>

                                    {/* Battery Indicator (Mini) */}
                                    {friend.battery !== undefined && (
                                        <div className="absolute -top-4 right-[-10px] bg-black/80 rounded px-1 flex items-center gap-0.5 border border-white/20">
                                            <span className={`text-[10px] ${friend.battery < 20 ? 'text-vibe-error' : 'text-vibe-text-primary'}`}>{friend.battery}%</span>
                                            {friend.isCharging && <Zap className="w-2 h-2 text-yellow-400 fill-yellow-400" />}
                                        </div>
                                    )}

                                    <div className="absolute -bottom-6 text-xs bg-black/80 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                        {friend.name || "Friend"}
                                    </div>
                                </div>
                            </Marker>
                        )
                    ))}
                </Map>
            )}

            {/* Bottom Overlay (Status) */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
                <div className="glass-panel px-6 py-3 rounded-full pointer-events-auto border border-white/10 bg-black/40 backdrop-blur-xl flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vibe-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-vibe-primary"></span>
                        </span>
                        <span className="text-vibe-text-primary text-sm font-medium">VibeMap Active</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/20"></div>
                    <span className="text-vibe-text-secondary text-sm">{friends.length} Friends Online</span>
                </div>
            </div>
        </div>
    );
}
