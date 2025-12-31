
import { useEffect, useState, useRef } from "react";
import { database } from "@/lib/firebase";
import { ref, push, onValue, off, limitToLast, query } from "firebase/database";
import { User as FirebaseUser } from "firebase/auth";

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

export function useChat(user: FirebaseUser | null, friendUid: string | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    // Derived Chat ID: Always sort UIDs to ensure A->B and B->A open the same chat
    const chatId = user && friendUid
        ? [user.uid, friendUid].sort().join("_")
        : null;

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }

        setLoading(true);
        const messagesRef = ref(database, `chats/${chatId}/messages`);
        const q = query(messagesRef, limitToLast(50));

        const unsubscribe = onValue(q, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    ...val
                }));
                // Ensure sorted by timestamp just in case
                setMessages(list.sort((a, b) => a.timestamp - b.timestamp));
            } else {
                setMessages([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    const sendMessage = async (text: string) => {
        if (!chatId || !user || !text.trim()) return;

        const messagesRef = ref(database, `chats/${chatId}/messages`);
        await push(messagesRef, {
            senderId: user.uid,
            text: text.trim(),
            timestamp: Date.now()
        });
    };

    return { messages, sendMessage, loading, chatId };
}
