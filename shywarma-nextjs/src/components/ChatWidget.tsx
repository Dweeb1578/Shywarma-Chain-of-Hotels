"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import styles from "./ChatWidget.module.css";
import { destinations } from "@/data/destinations";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HotelCarousel from './HotelCarousel';

export default function ChatWidget() {
    const { messages, conversations, currentConversationId, addMessage, startNewConversation, switchConversation, deleteConversation, clearMessages, isOpen, toggleChat } = useChat();
    const [input, setInput] = useState("");
    const [suggestedQuestion, setSuggestedQuestion] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // FAB tooltip after 4s
    const [showTooltip, setShowTooltip] = useState(false);

    // Speech-to-text
    const [isListening, setIsListening] = useState(false);

    // Quick suggestions for empty state
    const quickSuggestions = [
        "What destinations do you have?",
        "Best hotel for a honeymoon?",
        "Tell me about Dubai packages",
        "What's included in your deals?"
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) {
                setShowTooltip(true);
            }
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isOpen) setShowTooltip(false);
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, suggestedQuestion]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab' && suggestedQuestion) {
            e.preventDefault();
            setInput(suggestedQuestion);
            setSuggestedQuestion(null);
        } else if (e.key === 'Enter') {
            handleSend();
        }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser.');
            return;
        }
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        recognition.onerror = () => setIsListening(false);

        recognition.start();
    };

    const handleQuickSuggestion = (question: string) => {
        setInput(question);
        // Auto-send after a short delay
        setTimeout(() => {
            const fakeEvent = { key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>;
            handleKeyDown(fakeEvent);
        }, 100);
    };

    const [streamingText, setStreamingText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput("");
        setSuggestedQuestion(null);
        setIsLoading(true);
        setStreamingText("");

        // Add user message immediately
        addMessage("user", userText);

        try {
            // Hybrid Approach: Check for keywords first for guaranteed UI cards
            const lowerInput = userText.toLowerCase();
            let attachments: any[] = [];

            // Check for destination matches
            for (const dest of destinations) {
                if (lowerInput.includes(dest.name.toLowerCase()) || lowerInput.includes(dest.slug)) {
                    attachments = dest.hotels.map(hotel => ({
                        type: 'hotel-card',
                        data: {
                            name: hotel.name,
                            image: hotel.image,
                            slug: hotel.slug,
                            destinationSlug: dest.slug,
                            price: hotel.rooms[0]?.price
                        }
                    }));
                    break;
                }

                // Check for specific hotel name matches
                for (const hotel of dest.hotels) {
                    if (lowerInput.includes(hotel.name.toLowerCase()) || lowerInput.includes(hotel.slug.replace(/-/g, ' '))) {
                        attachments = [{
                            type: 'hotel-card',
                            data: {
                                name: hotel.name,
                                image: hotel.image,
                                slug: hotel.slug,
                                destinationSlug: dest.slug,
                                price: hotel.rooms[0]?.price
                            }
                        }];
                        break;
                    }
                }
                if (attachments.length > 0) break;
            }

            // Call RAG API for the text response
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, { role: "user", content: userText }]
                }),
            });

            if (!response.ok) throw new Error("Network response was not ok");
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botText = "";

            // Stream the response - update UI in real-time with typing effect
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // Process chunk character by character for smooth typing
                for (let i = 0; i < chunk.length; i++) {
                    botText += chunk[i];
                    const displayText = botText.split("SUGGESTED_QUESTION:")[0];
                    setStreamingText(displayText);
                    // Tiny delay for typing effect (3ms) - fast but smooth
                    await new Promise(resolve => setTimeout(resolve, 3));
                }
            }

            // Extract suggested question if present
            let finalBotText = botText;
            const suggestionMarker = "SUGGESTED_QUESTION:";
            if (botText.includes(suggestionMarker)) {
                const parts = botText.split(suggestionMarker);
                finalBotText = parts[0].trim();
                // Clean ** markdown from suggestion
                let suggestion = parts[1].trim().replace(/\*\*/g, '');
                if (suggestion) {
                    setSuggestedQuestion(suggestion);
                }
            }

            // Linkify hotel and destination names
            destinations.forEach(dest => {
                // Linkify Hotel Names (Longer matches first)
                dest.hotels.forEach(hotel => {
                    // Escape special characters in name for regex
                    const safeName = hotel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // Match with or without bold markers, case insensitive
                    const hotelRegex = new RegExp(`(\\*\\*)?${safeName}(\\*\\*)?`, 'gi');

                    finalBotText = finalBotText.replace(hotelRegex, (match) => {
                        // Avoid replacing inside existing links [Name](url)
                        // This simple check prevents replacing the text part of an already generated link
                        if (match.includes('](')) return match;
                        return `[${hotel.name}](/destinations/${dest.slug}/${hotel.slug})`;
                    });
                });

                // Linkify Destination Name
                const safeDestName = dest.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const destRegex = new RegExp(`(\\*\\*)?${safeDestName}(\\*\\*)?`, 'gi');

                finalBotText = finalBotText.replace(destRegex, (match) => {
                    if (match.includes('](') || match.includes('/destinations/')) return match;
                    return `[${dest.name}](/destinations/${dest.slug})`;
                });
            });

            // Add final full message
            setStreamingText(null);
            addMessage("assistant", finalBotText, attachments);

        } catch (error) {
            console.error("Chat error:", error);
            setStreamingText(null);
            addMessage("assistant", "I'm having trouble connecting right now. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* FAB Tooltip */}
            {showTooltip && !isOpen && (
                <div className={styles.fabTooltip} onClick={toggleChat}>
                    👋 Need help planning your trip?
                </div>
            )}
            <button className={`${styles.fab} ${showTooltip ? styles.fabBounce : ''}`} onClick={toggleChat}>
                {isOpen ? "✕" : "💬"}
            </button>
            {isOpen && (
                <div className={styles.chatBox}>
                    <div className={styles.header}>
                        <div className={styles.headerTop}>
                            <div className={styles.headerTitle}>
                                <img src="/shyla-avatar.png" alt="Shyla" className={styles.avatar} />
                                <h4>Shyla</h4>
                            </div>
                            <div className={styles.headerActions}>
                                <button
                                    className={styles.newChatBtn}
                                    onClick={startNewConversation}
                                    title="New Chat"
                                >
                                    ✚
                                </button>
                                {messages.length > 0 && (
                                    <button
                                        className={styles.clearBtn}
                                        onClick={clearMessages}
                                        title="Clear Chat"
                                    >
                                        🧹
                                    </button>
                                )}
                                {currentConversationId && conversations.length > 0 && (
                                    <button
                                        className={styles.clearBtn}
                                        onClick={() => deleteConversation(currentConversationId)}
                                        title="Delete Chat"
                                    >
                                        🗑
                                    </button>
                                )}
                            </div>
                        </div>
                        {conversations.length > 1 && (
                            <select
                                className={styles.conversationSelect}
                                value={currentConversationId || ''}
                                onChange={(e) => switchConversation(e.target.value)}
                            >
                                {conversations.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.title || 'New Chat'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className={styles.messages}>
                        {messages.length === 0 && !isLoading && (
                            <div className={styles.emptyState}>
                                <p className={styles.empty}>Hi! I'm Shyla, your personal travel concierge. 🌴</p>
                                <p className={styles.emptySubtitle}>Try asking:</p>
                                <div className={styles.quickSuggestions}>
                                    {quickSuggestions.map((q, i) => (
                                        <button key={i} className={styles.quickBtn} onClick={() => handleQuickSuggestion(q)}>
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((msg, msgIndex) => (
                            msg.role === 'assistant' ? (
                                // Split assistant messages into multiple bubbles
                                <>
                                    {msg.content.split(/\n\n+/).filter(p => p.trim()).map((paragraph, pIndex) => (
                                        <div key={`${msg.id}-${pIndex}`} className={`${styles.message} ${styles.assistant}`}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{paragraph}</ReactMarkdown>
                                        </div>
                                    ))}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className={`${styles.message} ${styles.assistant}`}>
                                            <HotelCarousel hotels={msg.attachments.map(a => a.data)} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div key={msg.id} className={`${styles.message} ${styles.user}`}>
                                    {msg.content}
                                </div>
                            )
                        ))}
                        {/* Live streaming response */}
                        {streamingText !== null && (
                            <>
                                {streamingText ? (
                                    streamingText.split(/\n\n+/).filter(p => p.trim()).map((paragraph, idx) => (
                                        <div key={`streaming-${idx}`} className={`${styles.message} ${styles.assistant}`}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{paragraph + (idx === streamingText.split(/\n\n+/).length - 1 ? ' ' : '')}</ReactMarkdown>
                                        </div>
                                    ))
                                ) : (
                                    <div className={`${styles.message} ${styles.assistant}`}>
                                        <div className={styles.typingIndicator}>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                        {suggestedQuestion && (
                            <button
                                className={styles.suggestionChip}
                                onClick={() => {
                                    const q = suggestedQuestion;
                                    setSuggestedQuestion(null);
                                    // Set input and trigger send
                                    setInput(q || '');
                                    // Use a ref to trigger handleSend after state update
                                    setTimeout(() => {
                                        const sendBtn = document.querySelector('[data-send-btn]') as HTMLButtonElement;
                                        if (sendBtn) sendBtn.click();
                                    }, 100);
                                }}
                            >
                                <span className={styles.suggestionIcon}>💡</span>
                                {suggestedQuestion}
                            </button>
                        )}
                    </div>
                    <div className={styles.inputArea}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type or speak..."
                        />
                        <button
                            className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                            onClick={startListening}
                            title="Voice input"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15a.998.998 0 00-.98-.85c-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                            </svg>
                        </button>
                        <button onClick={handleSend} data-send-btn>Send</button>
                    </div>
                </div>
            )}
        </>
    );
}
