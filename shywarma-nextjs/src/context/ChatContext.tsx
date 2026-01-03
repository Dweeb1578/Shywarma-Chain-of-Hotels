"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Attachment {
    type: 'hotel-card';
    data: {
        name: string;
        image: string;
        slug: string;
        destinationSlug: string;
        price?: number;
    };
}

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    attachments?: Attachment[];
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    suggestedQuestion?: string | null;
    createdAt: Date;
}

interface ChatContextType {
    messages: Message[];
    conversations: Conversation[];
    currentConversationId: string | null;
    suggestedQuestion: string | null;
    setSuggestedQuestion: (question: string | null) => void;
    addMessage: (role: "user" | "assistant", content: string, attachments?: Attachment[]) => void;
    clearMessages: () => void;
    startNewConversation: () => void;
    switchConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
    isOpen: boolean;
    toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = 'shywarma_conversations';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function ChatProvider({ children }: { children: ReactNode }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Load conversations from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed: Conversation[] = JSON.parse(saved);
                    const hydrated = parsed.map(c => ({
                        ...c,
                        createdAt: new Date(c.createdAt),
                        messages: c.messages.map(m => ({
                            ...m,
                            timestamp: new Date(m.timestamp)
                        }))
                    }));
                    setConversations(hydrated);
                    if (hydrated.length > 0) {
                        setCurrentConversationId(hydrated[0].id);
                    }
                } catch (e) {
                    console.error("Failed to parse conversations", e);
                }
            }
        }
    }, []);

    // Save to localStorage
    const saveConversations = (convos: Conversation[]) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
        }
    };

    // Get current conversation's data
    const currentConversation = conversations.find(c => c.id === currentConversationId);
    const messages = currentConversation?.messages || [];
    const suggestedQuestion = currentConversation?.suggestedQuestion || null;

    const setSuggestedQuestion = (question: string | null) => {
        if (!currentConversationId) return;
        setConversations(prev => {
            const updated = prev.map(c =>
                c.id === currentConversationId ? { ...c, suggestedQuestion: question } : c
            );
            saveConversations(updated);
            return updated;
        });
    };

    const addMessage = (role: "user" | "assistant", content: string, attachments?: Attachment[]) => {
        const newMessage: Message = {
            id: generateId(),
            role,
            content,
            timestamp: new Date(),
            attachments
        };

        setConversations(prev => {
            let updated: Conversation[];

            if (!currentConversationId || prev.length === 0) {
                // Create new conversation if none exists
                const newConvo: Conversation = {
                    id: generateId(),
                    title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                    messages: [newMessage],
                    createdAt: new Date(),
                    suggestedQuestion: null
                };
                updated = [newConvo, ...prev];
                setCurrentConversationId(newConvo.id);
            } else {
                updated = prev.map(c => {
                    if (c.id === currentConversationId) {
                        const newMessages = [...c.messages, newMessage];
                        // Update title from first user message if not set
                        const title = c.messages.length === 0 && role === 'user'
                            ? content.substring(0, 30) + (content.length > 30 ? '...' : '')
                            : c.title;
                        return { ...c, messages: newMessages, title };
                    }
                    return c;
                });
            }

            saveConversations(updated);
            return updated;
        });
    };

    const clearMessages = () => {
        if (!currentConversationId) return;
        setConversations(prev => {
            const updated = prev.map(c =>
                c.id === currentConversationId ? { ...c, messages: [], suggestedQuestion: null } : c
            );
            saveConversations(updated);
            return updated;
        });
    };

    const startNewConversation = () => {
        const newConvo: Conversation = {
            id: generateId(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            suggestedQuestion: null
        };
        setConversations(prev => {
            const updated = [newConvo, ...prev];
            saveConversations(updated);
            return updated;
        });
        setCurrentConversationId(newConvo.id);
    };

    const switchConversation = (id: string) => {
        setCurrentConversationId(id);
    };

    const deleteConversation = (id: string) => {
        setConversations(prev => {
            const updated = prev.filter(c => c.id !== id);
            saveConversations(updated);
            // Switch to another conversation if current was deleted
            if (currentConversationId === id) {
                setCurrentConversationId(updated.length > 0 ? updated[0].id : null);
            }
            return updated;
        });
    };

    const toggleChat = () => setIsOpen((prev) => !prev);

    return (
        <ChatContext.Provider value={{
            messages,
            conversations,
            currentConversationId,
            suggestedQuestion,
            setSuggestedQuestion,
            addMessage,
            clearMessages,
            startNewConversation,
            switchConversation,
            deleteConversation,
            isOpen,
            toggleChat
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within ChatProvider");
    return context;
}
