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
    const {
        messages,
        conversations,
        currentConversationId,
        addMessage,
        startNewConversation,
        switchConversation,
        deleteConversation,
        clearMessages,
        isOpen,
        toggleChat,
        suggestedQuestion,
        setSuggestedQuestion
    } = useChat();
    const [input, setInput] = useState("");
    // Removed local suggestedQuestion state
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


    // Helper to send a message programmatically immediately
    const sendQueryImmediately = (query: string) => {
        if (!query.trim() || isLoading) return;

        // 1. Set input visibly for a split second (optional UX preference, but good for context)
        setInput(query);

        // 2. Clear suggestions
        setSuggestedQuestion(null);

        // 3. Trigger send logic DIRECTLY (bypass simulation)
        // We need to pass the query explicitly to handleSend or refactor handleSend to take an arg.
        // Refactoring handleSend to accept an optional argument is cleaner.
        handleSend(query);
    };

    const [streamingText, setStreamingText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // WhatsApp Connect State
    const { syncCustomer } = useChat();
    const [showPhoneInput, setShowPhoneInput] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [verifyError, setVerifyError] = useState("");

    const handleVerifyPhone = async () => {
        if (!phoneInput.trim()) return;
        setVerifyLoading(true);
        setVerifyError("");
        try {
            const res = await fetch('/api/auth/verify-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneInput })
            });
            const data = await res.json();
            if (data.found && data.userId) {
                syncCustomer(data.userId);
                setShowPhoneInput(false);
                setPhoneInput("");
            } else {
                setVerifyError("Number not found. Please try again.");
            }
        } catch (e) {
            setVerifyError("Verification failed.");
        } finally {
            setVerifyLoading(false);
        }
    }

    const handleSend = async (manualInput?: string) => {
        // Use manualInput if provided, otherwise fall back to state input
        const textToSend = manualInput || input;

        if (!textToSend.trim() || isLoading) return;

        // Clear input state immediately
        setInput("");
        setSuggestedQuestion(null);
        setIsLoading(true);
        setStreamingText("");

        // Add user message immediately
        addMessage("user", textToSend);

        try {
            // Hybrid Approach: Check for keywords first for guaranteed UI cards
            const lowerInput = textToSend.toLowerCase();
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
                    messages: [...messages, { role: "user", content: textToSend }]
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

    // Update Quick Suggestion Handler
    const handleQuickSuggestion = (question: string) => {
        sendQueryImmediately(question);
    };

    // Update Dynamic Suggestion Handler (in JSX below)
    // We'll update the onClick in the JSX directly to call sendQueryImmediately logic or use handleSend directly.
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

                                <div className={styles.whatsappConnect}>
                                    {!showPhoneInput ? (
                                        <button className={styles.whatsappBtn} onClick={() => setShowPhoneInput(true)}>
                                            Already chatting on WhatsApp?
                                        </button>
                                    ) : (
                                        <div className={styles.phoneInputArea}>
                                            <button
                                                className={styles.closePhoneBtn}
                                                onClick={() => {
                                                    setShowPhoneInput(false);
                                                    setVerifyError("");
                                                }}
                                            >✕</button>
                                            <p className={styles.phoneDesc}>
                                                Enter your number to sync your chat history securely.
                                            </p>
                                            <div className={styles.phoneRow}>
                                                <input
                                                    type="tel"
                                                    placeholder="+1234567890"
                                                    value={phoneInput}
                                                    onChange={(e) => setPhoneInput(e.target.value)}
                                                    className={styles.phoneInput}
                                                />
                                                <button onClick={handleVerifyPhone} disabled={verifyLoading}>
                                                    {verifyLoading ? '...' : 'Go'}
                                                </button>
                                            </div>
                                            {verifyError && <span className={styles.errorText}>{verifyError}</span>}
                                        </div>
                                    )}
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
                                    handleSend(q);
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
                            placeholder={isListening ? "Listening..." : "Type a message..."}
                            className={`${styles.input} ${isListening ? styles.inputListening : ''}`}
                        />
                        <button
                            className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                            onClick={isListening ? () => { } : startListening}
                            title="Voice Input"
                        >
                            {isListening ? '🎙️' : '🎤'}
                        </button>
                        <button
                            className={styles.sendBtn}
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            data-send-btn
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
