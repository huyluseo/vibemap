
import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { User as FirebaseUser } from "firebase/auth";
import { Send, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";

interface ChatWindowProps {
    user: FirebaseUser;
    friendUid: string;
    friendName: string;
    friendPhoto?: string;
    onClose: () => void;
}

export default function ChatWindow({ user, friendUid, friendName, onClose }: ChatWindowProps) {
    const { messages, sendMessage, loading } = useChat(user, friendUid);
    const { t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const [text, setText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const bgColor = resolvedTheme === 'light' ? 'bg-white' : 'bg-[#1E1E1E]';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim()) return;

        const tempText = text;
        setText("");
        await sendMessage(tempText);
    };

    return (
        <div className={`fixed bottom-0 right-0 md:bottom-20 md:right-8 w-full md:w-80 h-[60dvh] md:h-96 flex flex-col ${bgColor} md:rounded-2xl border-t md:border border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 overflow-hidden pb-[env(safe-area-inset-bottom)]`}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-semibold text-foreground">{friendName}</span>
                </div>
                <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar scroll-smooth bg-background">
                {loading && messages.length === 0 && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-primary" />
                    </div>
                )}

                {messages.length === 0 && !loading && (
                    <div className="text-center text-muted-foreground text-xs mt-10">
                        {t('common.chat')} {friendName}!
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words ${isMe
                                    ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                                    : "bg-muted text-foreground rounded-tl-none border border-border"
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
            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('chat.placeholder')}
                    className="flex-1 bg-input border border-border rounded-full px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-transform active:scale-95"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
