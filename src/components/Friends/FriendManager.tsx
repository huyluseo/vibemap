
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { useFriends } from "@/hooks/useFriends";
import { User, Search, UserPlus, Check, X, Loader2, MessageCircle } from "lucide-react";

interface FriendManagerProps {
    onChatStart?: (friend: { uid: string; displayName: string; photoURL?: string }) => void;
}

export default function FriendManager({ onChatStart }: FriendManagerProps) {
    const { user } = useAuth();
    const { requests, sendRequest, acceptRequest, rejectRequest, loading: reqLoading } = useFriendRequests(user);
    const { friends } = useFriends(user);
    const [email, setEmail] = useState("");
    const [searchStatus, setSearchStatus] = useState<null | { success: boolean; msg: string }>(null);

    const handleSend = async () => {
        if (!email.trim()) return;
        setSearchStatus(null);

        const res = await sendRequest(email.trim());
        if (res.success) {
            setSearchStatus({ success: true, msg: "Request sent!" });
            setEmail("");
        } else {
            setSearchStatus({ success: false, msg: res.error || "Failed" });
        }
    };

    return (
        <div className="bg-[#1A1A1A] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] pb-[env(safe-area-inset-bottom)]">
            <div className="p-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white">Friends</h2>
            </div>

            <div className="p-4 overflow-y-auto space-y-6 custom-scrollbar">

                {/* 1. Add Friend */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-vibe-text-secondary uppercase">Add Friend by Email</h3>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="friend@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-vibe-primary transition-colors"
                            />
                            <Search className="absolute left-3 top-2.5 text-white/30 w-4 h-4" />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={reqLoading || !email}
                            className="bg-vibe-primary text-black px-3 py-2 rounded-lg font-medium text-sm hover:bg-vibe-primary/90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {reqLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        </button>
                    </div>
                    {searchStatus && (
                        <p className={`text-xs ${searchStatus.success ? "text-green-400" : "text-red-400"}`}>
                            {searchStatus.msg}
                        </p>
                    )}
                </div>

                {/* 2. Friend Requests */}
                {requests.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-vibe-primary uppercase">Pending Requests ({requests.length})</h3>
                        <div className="space-y-2">
                            {requests.map(req => (
                                <div key={req.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-vibe-dark/50 overflow-hidden flex items-center justify-center border border-white/20">
                                            {req.fromPhoto ? <img src={req.fromPhoto} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-white/50" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{req.fromName}</p>
                                            <p className="text-[10px] text-white/50">{new Date(req.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => acceptRequest(req.id, req.from)} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => rejectRequest(req.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. My Friends List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-vibe-text-secondary uppercase">My Friends ({friends.length})</h3>
                    {friends.length === 0 ? (
                        <p className="text-sm text-white/30 italic">No friends yet. Add someone!</p>
                    ) : (
                        <div className="space-y-2">
                            {friends.map(friend => (
                                <div key={friend.uid} className="flex items-center justify-between bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-vibe-dark/50 overflow-hidden flex items-center justify-center border border-white/20 relative">
                                            {friend.status === 'online' && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-black" />}
                                            {friend.photoURL ? (
                                                <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4 text-white/50" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-vibe-primary transition-colors">{friend.name || "Unknown"}</p>
                                            <p className="text-[10px] text-white/50">{friend.status || 'offline'}</p>
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
                                        className="p-2 bg-white/5 hover:bg-vibe-primary/20 hover:text-vibe-primary rounded-full transition-colors text-white/50"
                                        title="Message"
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
