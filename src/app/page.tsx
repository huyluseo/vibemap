"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import AuthScreen from "@/components/Auth/AuthScreen";
import MapView from "@/components/Map/MapView";
import ProfileModal from "@/components/Profile/ProfileModal";
import FriendManager from "@/components/Friends/FriendManager";
import { Loader2, Settings, Users } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  // Start tracking location if user is logged in
  const { location } = useLocation(user);
  /* Profile Modal State */
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-vibe-black text-vibe-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </main>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <main className="flex min-h-screen flex-col bg-vibe-black relative">
      <MapView userLocation={location} />

      {/* Top Left Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
        {/* Profile Button */}
        <button
          onClick={() => setIsProfileOpen(true)}
          className="bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all shadow-lg"
          title="Profile"
        >
          <Settings size={24} />
        </button>

        {/* Friends Button */}
        <button
          onClick={() => setIsFriendsOpen(true)}
          className="bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all shadow-lg"
          title="Friends"
        >
          <Users size={24} />
        </button>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Friend Manager Modal */}
      {isFriendsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setIsFriendsOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white"
            >
              Close
            </button>
            <FriendManager />
          </div>
        </div>
      )}
    </main>
  );
}
