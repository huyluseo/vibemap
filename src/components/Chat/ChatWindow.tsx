
import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { User as FirebaseUser } from "firebase/auth";
import { Send, X, Loader2 } from "lucide-react";

interface ChatWindowProps {
    user: FirebaseUser;
    friendUid: string;
    friendName: string;
    friendPhoto?: string; // Optional if we want to show avatar header
    onClose: () => void;
}

export default function ChatWindow({ user, friendUid, friendName, onClose }: ChatWindowProps) {
    const { messages, sendMessage, loading } = useChat(user, friendUid);
    const [text, setText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim()) return;

        const tempText = text;
        setText(""); // Optimistic clear
        await sendMessage(tempText);
    };

    // Define colors dynamically
    // My messages: Primary Color
    // Friend messages: Gray/Dark

    return (
        <div className="fixed bottom-0 right-0 md:bottom-20 md:right-8 w-full md:w-80 h-[60dvh] md:h-96 flex flex-col bg-[#121212] md:rounded-2xl border-t md:border border-white/10 shadow-2xl z-50 overflow-hidden pb-[env(safe-area-inset-bottom)]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-semibold text-white">{friendName}</span>
                </div>
                <button onClick={onClose} className="p-1 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar scroll-smooth">
                {loading && messages.length === 0 && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-vibe-primary" />
                    </div>
                )}

                {messages.length === 0 && !loading && (
                    <div className="text-center text-white/20 text-xs mt-10">
                        Start a conversation with {friendName}!
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words ${isMe
                                    ? "bg-[#6C63FF] text-white rounded-tr-none font-medium"
                                    : "bg-white/10 text-white rounded-tl-none"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/20 flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-vibe-primary/50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="p-2 bg-vibe-primary text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vibe-primary/90 transition-transform active:scale-95"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
