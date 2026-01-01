"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatContextType {
    messages: Message[];
    addMessage: (role: "user" | "assistant", content: string) => void;
    clearMessages: () => void;
    isOpen: boolean;
    toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const addMessage = (role: "user" | "assistant", content: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
    };

    const clearMessages = () => setMessages([]);
    const toggleChat = () => setIsOpen((prev) => !prev);

    return (
        <ChatContext.Provider value={{ messages, addMessage, clearMessages, isOpen, toggleChat }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within ChatProvider");
    return context;
}
