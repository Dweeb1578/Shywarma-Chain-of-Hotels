"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import styles from "./ChatWidget.module.css";
import { destinations } from "@/data/destinations";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HotelCarousel from './HotelCarousel';

import { AnimatePresence } from "framer-motion";
import ItineraryCanvas from "./ItineraryCanvas";

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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // State for Itinerary Canvas
    const [itinerary, setItinerary] = useState<any | null>(null);
    const [showItinerary, setShowItinerary] = useState(false);

    // Effect to parse itinerary JSON from the LAST message
    // Track the last message ID we've already processed for itinerary to avoid infinite loops
    const processedMsgIdRef = useRef<string | null>(null);

    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
            // If we already processed this exact message, DO NOT re-open the overlay
            if (lastMsg.id === processedMsgIdRef.current) return;

            const jsonMatch = lastMsg.content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    if (parsed.days && parsed.title) {
                        setItinerary(parsed);
                        // Auto-open DISABLED per user request
                        // setShowItinerary(true);

                        // Mark this message as processed
                        processedMsgIdRef.current = lastMsg.id;
                    }
                } catch (e) {
                    console.error("Failed to parse itinerary JSON", e);
                }
            }
        }
    }, [messages]); // Remove showItinerary from dependency to prevent loop

    // FAB tooltip after 4s
    const [showTooltip, setShowTooltip] = useState(false);

    // Speech-to-text
    const [isListening, setIsListening] = useState(false);

    // Escalation Banner (after N messages)
    const [escalationDismissed, setEscalationDismissed] = useState(false);
    const ESCALATION_THRESHOLD = 4; // Show banner after 4 messages
    const showEscalationBanner = messages.length >= ESCALATION_THRESHOLD && !escalationDismissed;

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

    // WhatsApp Connect State REMOVED
    // const { syncCustomer } = useChat(); <- Removed usage
    // const [showPhoneInput, setShowPhoneInput] = useState(false);
    // const [phoneInput, setPhoneInput] = useState("");
    // const [verifyLoading, setVerifyLoading] = useState(false);
    // const [verifyError, setVerifyError] = useState("");

    // handleVerifyPhone removed

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
            let foundSuggestion = false;

            if (botText.includes(suggestionMarker)) {
                const parts = botText.split(suggestionMarker);
                finalBotText = parts[0].trim();
                // Clean ** markdown from suggestion
                let suggestion = parts[1].trim().replace(/\*\*/g, '');
                if (suggestion) {
                    setSuggestedQuestion(suggestion);
                    foundSuggestion = true;
                }
            }

            // FALLBACK: Generate default suggestion if LLM didn't provide one
            if (!foundSuggestion) {
                const lowerInput = textToSend.toLowerCase();
                let fallbackSuggestion = "Tell me about your packages";

                if (lowerInput.includes("destination") || lowerInput.includes("where")) {
                    fallbackSuggestion = "What packages do you offer?";
                } else if (lowerInput.includes("hotel") || lowerInput.includes("stay")) {
                    fallbackSuggestion = "What are the room rates?";
                } else if (lowerInput.includes("honeymoon") || lowerInput.includes("romantic")) {
                    fallbackSuggestion = "Show me honeymoon packages";
                } else if (lowerInput.includes("package") || lowerInput.includes("deal")) {
                    fallbackSuggestion = "What's included in the package?";
                } else if (lowerInput.includes("price") || lowerInput.includes("cost")) {
                    fallbackSuggestion = "Are there any special offers?";
                }

                setSuggestedQuestion(fallbackSuggestion);
            }

            // Linkify hotel and destination names
            destinations.forEach(dest => {
                // 1. Linkify Package Names (Most specific/longest)
                dest.packages.forEach(pkg => {
                    const safePkgName = pkg.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // Match name surrounded by optional ** and/or whitespace
                    // This handles cases like "**Name**", "**Name", "Name**", or just "Name"
                    const pkgRegex = new RegExp(`(?:\\*\\*|\\s)*${safePkgName}(?:\\*\\*|\\s)*`, 'gi');

                    finalBotText = finalBotText.replace(pkgRegex, (match) => {
                        if (match.includes('](')) return match;
                        // Determine if we need leading space based on match match
                        const prefix = match.match(/^\s+/)?.[0] || '';
                        const suffix = match.match(/\s+$/)?.[0] || '';
                        return `${prefix}[${pkg.name}](/packages)${suffix}`;
                    });
                });

                // 2. Linkify Hotel Names 
                dest.hotels.forEach(hotel => {
                    const safeName = hotel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const hotelRegex = new RegExp(`(?:\\*\\*|\\s)*${safeName}(?:\\*\\*|\\s)*`, 'gi');

                    finalBotText = finalBotText.replace(hotelRegex, (match) => {
                        if (match.includes('](')) return match;
                        const prefix = match.match(/^\s+/)?.[0] || '';
                        const suffix = match.match(/\s+$/)?.[0] || '';
                        return `${prefix}[${hotel.name}](/destinations/${dest.slug}/${hotel.slug})${suffix}`;
                    });
                });

                // 3. Linkify Destination Name (Least specific)
                const safeDestName = dest.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Use word boundary \b to prevent matching "Paris" inside "Parisian"
                // But \b doesn't work well with **. 
                // We'll rely on the fact that longer matches (packages) are already done.
                // But we should still be careful.
                const destRegex = new RegExp(`(?:\\*\\*|\\s)*\\b${safeDestName}\\b(?:\\*\\*|\\s)*`, 'gi');

                finalBotText = finalBotText.replace(destRegex, (match) => {
                    if (match.includes('](') || match.includes('/destinations/')) return match;
                    const prefix = match.match(/^\s+/)?.[0] || '';
                    const suffix = match.match(/\s+$/)?.[0] || '';
                    return `${prefix}[${dest.name}](/destinations/${dest.slug})${suffix}`;
                });
            });

            // POST-PROCESS: Insert line breaks before destination links in listings
            // Match pattern: " - Description [NextDestination]"
            const destNames = destinations.map(d => d.name).join('|');
            // We match the " - Description" part and the following "[DestName]"
            // We use a lookahead or just match enough to identify the split point, 
            // but effectively we want to turn "...desc [Dest]" into "...desc\n\n[Dest]"
            const listingPattern = new RegExp(`(\\s*-\\s*[^[\\]]+?)\\s*(\\[(?:${destNames})\\])`, 'g');
            finalBotText = finalBotText.replace(listingPattern, '$1\n\n$2');

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
                                {/* Permanent Contact Links */}
                                <a
                                    href="https://wa.me/919963894342"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.headerContactBtn}
                                    title="Chat on WhatsApp"
                                >
                                    💬
                                </a>
                                <a
                                    href="tel:+919963894342"
                                    className={styles.headerContactBtn}
                                    title="Call Support"
                                >
                                    📞
                                </a>

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
                                <button
                                    className={`${styles.clearBtn} ${styles.mobileCloseBtn}`}
                                    onClick={toggleChat}
                                    title="Close Chat"
                                >
                                    ✕
                                </button>
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
                                <>
                                    {/* Split on double newlines for separate bubbles, but FIRST strip JSON blocks if they exist */
                                        msg.content
                                            .replace(/```[\s\S]*?```/g, '') // Hide AGGRESSIVELY any code block
                                            .replace(/{[\s\S]*"title":[\s\S]*"days":[\s\S]*}/, '') // Hide RAW JSON if it leaked without backticks
                                            .split(/\n\n+/)
                                            .filter(p => p.trim())
                                            .map((paragraph, pIndex) => (
                                                <div key={`${msg.id}-${pIndex}`} className={`${styles.message} ${styles.assistant}`}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{paragraph}</ReactMarkdown>
                                                </div>
                                            ))}

                                    {/* Show "View Itinerary" button if this message contains the JSON */}
                                    {(msg.content.includes("```") || msg.content.includes('"days":')) && (
                                        <div className={styles.itineraryAction}>
                                            <button
                                                onClick={() => {
                                                    // Try to match strict JSON block first
                                                    let match = msg.content.match(/```json\n([\s\S]*?)\n```/);
                                                    if (!match) match = msg.content.match(/```\n([\s\S]*?)\n```/); // Fallback generic block
                                                    if (!match) match = msg.content.match(/({[\s\S]*"title":[\s\S]*"days":[\s\S]*})/); // Fallback RAW JSON

                                                    if (match) {
                                                        try {
                                                            const parsed = JSON.parse(match[1]);
                                                            setItinerary(parsed);
                                                            setShowItinerary(true);
                                                        } catch (e) { console.error(e); }
                                                    }
                                                }}
                                                className={styles.viewItineraryBtn}
                                            >
                                                🗺️ View Custom Itinerary
                                            </button>
                                        </div>
                                    )}
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
                                    streamingText
                                        .replace(/```[\s\S]*?```/g, '') // 1. Hide complete blocks
                                        .replace(/```[\s\S]*/, '')      // 2. Hide incomplete blocks (from start of backticks to end)
                                        .replace(/{[\s\S]*"title":[\s\S]*"days":[\s\S]*/, '') // 3. Hide partial/raw JSON
                                        .split(/\n\n+/)
                                        .filter(p => p.trim())
                                        .map((paragraph, idx) => (
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

                        {/* Escalation Banner - appears after 4+ messages */}
                        {showEscalationBanner && (
                            <div className={styles.escalationBanner}>
                                <button
                                    className={styles.escalationClose}
                                    onClick={() => setEscalationDismissed(true)}
                                    title="Dismiss"
                                >✕</button>
                                <p>Need more personalized help?</p>
                                <div className={styles.escalationBannerBtns}>
                                    <a href="https://wa.me/919963894342" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
                                    <a href="tel:+919963894342">📞 Call</a>
                                </div>
                            </div>
                        )}

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
                </div >
            )
            }
            {/* Itinerary Canvas Overlay */}
            {showItinerary && itinerary && (
                <ItineraryCanvas
                    itinerary={itinerary}
                    onClose={() => setShowItinerary(false)}
                    onEdit={(instruction) => {
                        // Send edit request but keep canvas open to show loading state
                        handleSend(`Edit this itinerary: ${instruction}`);
                    }}
                    isLoading={isLoading}
                />
            )}
        </>
    );
}
