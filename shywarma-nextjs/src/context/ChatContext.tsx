"use client";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

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
    syncCustomer: (uid: string) => void;
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

    // Ref to track currentConversationId synchronously for async operations
    const currentIdRef = useRef<string | null>(null);

    // Sync ref with state
    useEffect(() => {
        currentIdRef.current = currentConversationId;
    }, [currentConversationId]);

    // Update both state and ref
    const updateCurrentId = (id: string | null) => {
        currentIdRef.current = id;
        setCurrentConversationId(id);
    };

    // Load conversations & Check for Context on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // 1. Check URL for ?uid=
            const params = new URLSearchParams(window.location.search);
            const uidParam = params.get('uid');

            let finalUid = uidParam;

            if (uidParam) {
                // Save new UID
                localStorage.setItem('shywarma_customer_uid', uidParam);
            } else {
                // Check storage
                finalUid = localStorage.getItem('shywarma_customer_uid');
            }

            if (finalUid) {
                fetchContextGreeting(finalUid);
            }

            // 2. Load Saved Conversations
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
                        updateCurrentId(hydrated[0].id);
                    }
                } catch (e) {
                    console.error("Failed to parse conversations", e);
                }
            }
        }
    }, []);

    // Helper: Fetch Context Aware Greeting
    const fetchContextGreeting = async (uid: string) => {
        try {
            const res = await fetch('/api/chat/context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid })
            });
            const data = await res.json();

            if (data.greeting) {
                // If we get a special greeting, open the chat automatically to show it!
                // But only if no chat is currently open/active with messages
                // We access the ref directly or state (conversations here is closure stale, so we trust generic mounting state)
                // For simplicity, we just trigger startNewConversationWithGreeting if we want to force it.
                // NOTE: We need to see if we already have this conversation.

                // For this MVP, we Just Create it.
                startNewConversationWithGreeting(data.greeting, data.suggestions);
                setIsOpen(true);
            }
        } catch (error) {
            console.error("Failed to fetch context greeting", error);
        }
    };

    const startNewConversationWithGreeting = (greeting: string, suggestions: string[]) => {
        const newConvo: Conversation = {
            id: generateId(),
            title: 'Welcome Back',
            messages: [{
                id: generateId(),
                role: 'assistant',
                content: greeting,
                timestamp: new Date()
            }],
            createdAt: new Date(),
            suggestedQuestion: null
        };
        // TODO: Pass suggestions to UI through Context if needed

        setConversations(prev => {
            const updated = [newConvo, ...prev];
            saveConversations(updated);
            return updated;
        });
        updateCurrentId(newConvo.id);
    };

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

            // Critical Fix: Ensure we are targeting a valid conversation
            let activeId = currentIdRef.current;
            const targetExists = activeId && prev.some(c => c.id === activeId);

            if (!activeId || !targetExists) {
                // If ID is missing OR not found in current state (Zombie ID), create NEW
                // console.log("Creating NEW conversation (Reason: " + (!activeId ? "No ID" : "Zombie ID") + ")");

                const newConvo: Conversation = {
                    id: generateId(),
                    title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                    messages: [newMessage],
                    createdAt: new Date(),
                    suggestedQuestion: null
                };
                updated = [newConvo, ...prev];

                // Force update Ref immediately to correct any drift
                activeId = newConvo.id;
                updateCurrentId(newConvo.id);
            } else {
                // Happy Path: Append to existing
                // console.log("Appending to conversation:", activeId);
                updated = prev.map(c => {
                    if (c.id === activeId) {
                        const newMessages = [...c.messages, newMessage];

                        // Update title if it was "New Chat" or empty
                        const title = (c.messages.length === 0 || c.title === 'New Chat') && role === 'user'
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
        updateCurrentId(newConvo.id);
    };

    const switchConversation = (id: string) => {
        updateCurrentId(id);
    };

    const deleteConversation = (id: string) => {
        setConversations(prev => {
            const updated = prev.filter(c => c.id !== id);
            saveConversations(updated);
            // Switch to another conversation if current was deleted
            if (currentConversationId === id) {
                updateCurrentId(updated.length > 0 ? updated[0].id : null);
            }
            return updated;
        });
    };

    const toggleChat = () => setIsOpen((prev) => !prev);

    // Expose this for manual login via Phone
    const syncCustomer = (uid: string) => {
        // We probably don't need a local state for 'customerId' inside context 
        // unless we want to track it, but localStorage is the source of truth for now.
        // If we added customerId state earlier, set it here.
        localStorage.setItem('shywarma_customer_uid', uid);
        fetchContextGreeting(uid);
    };

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
            toggleChat,
            syncCustomer
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
