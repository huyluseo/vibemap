
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { useFriends } from "@/hooks/useFriends";
import { User, Search, UserPlus, Check, X, Loader2, MessageCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";

interface FriendManagerProps {
    onChatStart?: (friend: { uid: string; displayName: string; photoURL?: string }) => void;
}

export default function FriendManager({ onChatStart }: FriendManagerProps) {
    const { user } = useAuth();
    const { requests, sendRequest, acceptRequest, rejectRequest, loading: reqLoading } = useFriendRequests(user);
    const { resolvedTheme } = useTheme();
    const { friends } = useFriends(user);
    const { t } = useLanguage();
    // Force background based on theme to ensure no transparency
    const bgColor = resolvedTheme === 'light' ? 'bg-white' : 'bg-[#1E1E1E]';

    const [email, setEmail] = useState("");
    const [searchStatus, setSearchStatus] = useState<null | { success: boolean; msg: string }>(null);

    const handleSend = async () => {
        if (!email.trim()) return;
        setSearchStatus(null);

        const res = await sendRequest(email.trim());
        if (res.success) {
            setSearchStatus({ success: true, msg: t('friends.request_sent') });
            setEmail("");
        } else {
            setSearchStatus({ success: false, msg: res.error || t('friends.failed') });
        }
    };

    return (
        <div className={`${bgColor} w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] pb-[env(safe-area-inset-bottom)]`}>
            <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">{t('friends.title')}</h2>
            </div>

            <div className="p-4 overflow-y-auto space-y-6 custom-scrollbar">

                {/* 1. Add Friend */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase">{t('friends.add_by_email')}</h3>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('friends.email_placeholder')}
                                className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                            />
                            <Search className="absolute left-3 top-2.5 text-muted-foreground w-4 h-4" />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={reqLoading || !email}
                            className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {reqLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        </button>
                    </div>
                    {searchStatus && (
                        <p className={`text-xs ${searchStatus.success ? "text-green-500" : "text-destructive"}`}>
                            {searchStatus.msg}
                        </p>
                    )}
                </div>

                {/* 2. Friend Requests */}
                {requests.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-primary uppercase">{t('friends.pending_requests')} ({requests.length})</h3>
                        <div className="space-y-2">
                            {requests.map(req => (
                                <div key={req.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border">
                                            {req.fromPhoto ? <img src={req.fromPhoto} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-muted-foreground" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{req.fromName}</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(req.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => acceptRequest(req.id, req.from)} className="p-1.5 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => rejectRequest(req.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. My Friends List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase">{t('friends.my_friends')} ({friends.length})</h3>
                    {friends.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">{t('friends.no_friends')}</p>
                    ) : (
                        <div className="space-y-2">
                            {friends.map(friend => (
                                <div key={friend.uid} className="flex items-center justify-between bg-muted/30 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border relative">
                                            {friend.status === 'online' && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-background" />}
                                            {friend.photoURL ? (
                                                <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{friend.name || "Unknown"}</p>
                                            <p className="text-[10px] text-muted-foreground">{friend.status || 'offline'}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChatStart?.({
                                                uid: friend.uid,
                                                displayName: friend.name || "Friend",
                                                photoURL: friend.photoURL
                                            });
                                        }}
                                        className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors text-muted-foreground"
                                        title={t('common.chat')}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
