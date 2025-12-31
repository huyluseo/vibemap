
import { useState, useEffect } from "react";
import Map, { NavigationControl, Marker, GeolocateControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { User, Battery, Zap, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MapViewProps {
    userLocation: { lat: number; lng: number } | null;
    onChatStart?: (friend: { uid: string; displayName: string; photoURL?: string }) => void;
    onOpenFriends?: () => void;
}

export default function MapView({ userLocation, onChatStart, onOpenFriends }: MapViewProps) {
    const { user } = useAuth();
    const { friends } = useFriends(user);
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [hasCentered, setHasCentered] = useState(false);

    const [viewState, setViewState] = useState({
        latitude: 10.7769,
        longitude: 106.7009,
        zoom: 14,
    });

    // Auto-center
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

    // Handle Map Style based on Theme
    const { resolvedTheme } = useTheme();
    const mapStyle = resolvedTheme === 'light'
        ? "mapbox://styles/mapbox/streets-v12"
        : "mapbox://styles/mapbox/dark-v11";

    return (
        <div className="w-full h-full relative bg-background">
            {!MAPBOX_TOKEN ? (
                <div className="flex items-center justify-center h-full text-destructive">
                    Missing Mapbox Token in .env.local
                </div>
            ) : (
                <Map
                    {...viewState}
                    onMove={(evt) => setViewState(evt.viewState)}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle={mapStyle}
                    mapboxAccessToken={MAPBOX_TOKEN}
                >
                    <GeolocateControl position="top-right" />
                    <NavigationControl position="top-right" />

                    {/* Current User Marker */}
                    {user && userLocation && (
                        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="bottom">
                            <div className="relative group flex flex-col items-center">
                                {/* Pulse Effect */}
                                <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping pointer-events-none" />

                                {/* Avatar Circle */}
                                <div className="w-12 h-12 rounded-full border-2 border-primary bg-card/90 backdrop-blur-md flex items-center justify-center shadow-lg overflow-hidden z-10 relative">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="text-primary w-6 h-6" />
                                    )}
                                </div>

                                <div className="absolute -bottom-6 text-xs bg-primary/90 text-primary-foreground font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                    {t('map.you')}
                                </div>
                            </div>
                        </Marker>
                    )}

                    {/* Friends Markers */}
                    {friends.map((friend) => (
                        friend.location && (
                            <Marker
                                key={friend.uid}
                                longitude={friend.location.lng}
                                latitude={friend.location.lat}
                                anchor="bottom"
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    onChatStart?.({
                                        uid: friend.uid,
                                        displayName: friend.name || "Friend",
                                        photoURL: friend.photoURL
                                    });
                                }}
                            >
                                <div className="relative group flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
                                    {/* Status */}
                                    <div className={`w-3 h-3 rounded-full border-2 border-background mb-1 ${friend.status === 'online' ? 'bg-green-500' : 'bg-muted-foreground'}`} />

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full border-2 border-primary/50 bg-card/80 backdrop-blur-md flex items-center justify-center shadow-lg overflow-hidden">
                                        {friend.photoURL ? (
                                            <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-foreground w-6 h-6" />
                                        )}
                                    </div>

                                    {/* Chat Badge */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/60 rounded-full p-2 z-20 backdrop-blur-sm">
                                        <MessageCircle className="w-5 h-5 text-primary" />
                                    </div>

                                    {/* Battery */}
                                    {friend.battery !== undefined && (
                                        <div className="absolute -top-4 right-[-10px] bg-background/80 rounded px-1 flex items-center gap-0.5 border border-border">
                                            <span className={`text-[10px] ${friend.battery < 20 ? 'text-destructive' : 'text-foreground'}`}>{friend.battery}%</span>
                                            {friend.isCharging && <Zap className="w-2 h-2 text-yellow-400 fill-yellow-400" />}
                                        </div>
                                    )}

                                    <div className="absolute -bottom-6 text-xs bg-background/80 text-foreground px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                        {friend.name || "Friend"}
                                    </div>
                                </div>
                            </Marker>
                        )
                    ))}
                </Map>
            )}

            {/* Bottom Overlay */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
                <div
                    onClick={onOpenFriends}
                    className="glass-panel px-6 py-3 rounded-full pointer-events-auto border border-border bg-card/40 backdrop-blur-xl flex items-center gap-3 cursor-pointer hover:bg-card/60 transition-colors active:scale-95 shadow-lg"
                >
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        <span className="text-foreground text-sm font-medium">{t('map.active')}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-border"></div>
                    <span className="text-muted-foreground text-sm">{friends.length} {t('map.friends_online')}</span>
                </div>
            </div>
        </div>
    );
}
