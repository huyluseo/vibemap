
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import AuthScreen from "@/components/Auth/AuthScreen";
import MapView from "@/components/Map/MapView";
import ChatWindow from "@/components/Chat/ChatWindow";
import ProfileModal from "@/components/Profile/ProfileModal";
import FriendManager from "@/components/Friends/FriendManager";
import { Loader2, Settings, Users, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const bgColor = resolvedTheme === 'light' ? 'bg-white' : 'bg-[#1E1E1E]';

  // Start tracking location if user is logged in
  const { location } = useLocation(user);
  /* Profile Modal State */
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<{ uid: string; displayName: string; photoURL?: string } | null>(null);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </main>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <main className="flex h-[100dvh] flex-col bg-background relative overflow-hidden">
      <MapView
        userLocation={location}
        onChatStart={(friend) => setActiveChat(friend)}
        onOpenFriends={() => setIsFriendsOpen(true)}
      />

      {/* Top Left Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
        {/* Profile Button */}
        <button
          onClick={() => setIsProfileOpen(true)}
          className={`${bgColor} p-3 rounded-full border border-neutral-200 dark:border-neutral-800 text-foreground/80 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-lg`}
          title={t('common.profile')}
        >
          <Settings size={24} />
        </button>

        {/* Friends Button */}
        <button
          onClick={() => setIsFriendsOpen(true)}
          className={`${bgColor} p-3 rounded-full border border-neutral-200 dark:border-neutral-800 text-foreground/80 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-lg`}
          title={t('common.friends')}
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
              className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white flex items-center gap-1"
            >
              <X size={20} /> {t('common.close')}
            </button>
            <FriendManager
              onChatStart={(friend) => {
                setActiveChat(friend);
                setIsFriendsOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Chat Window */}
      {activeChat && (
        <ChatWindow
          user={user}
          friendUid={activeChat.uid}
          friendName={activeChat.displayName}
          onClose={() => setActiveChat(null)}
        />
      )}
    </main>
  );
}
