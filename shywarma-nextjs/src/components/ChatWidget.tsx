"use client";
import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import styles from "./ChatWidget.module.css";
import { destinations } from "@/data/destinations";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HotelCarousel from './HotelCarousel';

import { AnimatePresence } from "framer-motion";
import ItineraryCanvas from "./ItineraryCanvas";
import { useAuth } from "@/context/AuthContext";
import BookingModal from "./BookingModal";
import { loadPreferences, savePreferences, updateFromQuery, UserPreferences } from "@/lib/userPreferences";

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
    const { user } = useAuth();
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // State for Itinerary Canvas
    const [itinerary, setItinerary] = useState<any | null>(null);
    const [showItinerary, setShowItinerary] = useState(false);

    // State for Booking Modal
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState<{
        hotelName?: string;
        destination?: string;
        pricePerNight?: number;
    }>({});

    // User preferences state
    const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);

    // LocalStorage key for persisting itinerary
    const ITINERARY_STORAGE_KEY = 'shywarma_last_itinerary';

    // Load saved itinerary and preferences on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Load itinerary
            const saved = localStorage.getItem(ITINERARY_STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.title && parsed.days) {
                        setItinerary(parsed);
                    }
                } catch (e) {
                    console.error("Failed to load saved itinerary", e);
                }
            }

            // Load user preferences
            const prefs = loadPreferences();
            setUserPrefs(prefs);
        }
    }, []);

    // Save itinerary to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined' && itinerary) {
            localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(itinerary));
        }
    }, [itinerary]);

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

    // Helper to open booking modal with hotel data
    const openBooking = (hotelName: string, destination: string, pricePerNight?: number) => {
        setBookingData({ hotelName, destination, pricePerNight });
        setShowBookingModal(true);
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

    const handleSend = async (manualInput?: string, displayOverride?: string) => {
        // Use manualInput if provided, otherwise fall back to state input
        const textToSend = manualInput || input;

        if (!textToSend.trim() || isLoading) return;

        // Clear input state immediately
        setInput("");
        setSuggestedQuestion(null);
        setIsLoading(true);
        setStreamingText("");

        // Add user message immediately (use display override if provided)
        addMessage("user", displayOverride || textToSend);

        // Update user preferences based on query
        if (userPrefs) {
            const updatedPrefs = updateFromQuery(textToSend, userPrefs);
            setUserPrefs(updatedPrefs);
            savePreferences(updatedPrefs);
        }

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
                    messages: [...messages, { role: "user", content: textToSend }],
                    userId: user?.email || user?.id || null
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

            // EXTRACT AND SAVE ITINERARY from the response BEFORE the message is saved (and stripped)
            const itineraryXmlMatch = botText.match(/<ITINERARY_DATA>([\s\S]*?)<\/ITINERARY_DATA>/);
            if (itineraryXmlMatch) {
                try {
                    let jsonStr = itineraryXmlMatch[1].trim();
                    let parsed;
                    try {
                        parsed = JSON.parse(jsonStr);
                    } catch {
                        // Clean up the JSON if initial parse fails
                        jsonStr = jsonStr.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
                        parsed = JSON.parse(jsonStr);
                    }
                    if (parsed.title && parsed.days) {
                        setItinerary(parsed);
                        // Also save to localStorage immediately
                        localStorage.setItem('shywarma_last_itinerary', JSON.stringify(parsed));
                    }
                } catch (e) {
                    console.error("Failed to extract itinerary from response:", e);
                }
            }

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

                                {messages.length > 0 && (
                                    <button
                                        className={styles.clearBtn}
                                        onClick={clearMessages}
                                        title="Clear Chat"
                                    >
                                        🧹
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
                                <React.Fragment key={msg.id || `msg-${msgIndex}`}>
                                    {/* Process and render visible content only */}
                                    {(() => {
                                        // Clean the content completely
                                        const cleanedContent = msg.content
                                            .replace(/<ITINERARY_DATA>[\s\S]*?<\/ITINERARY_DATA>/g, '')
                                            .replace(/<ITINERARY_DATA>[\s\S]*/g, '') // Catch incomplete opening tags
                                            .replace(/<\/?ITINERARY_DATA[^>]*>/g, '') // Catch any remaining tag fragments
                                            .replace(/```[\s\S]*?```/g, '')
                                            .replace(/```[\s\S]*/g, '') // Catch incomplete code blocks
                                            .replace(/\{[\s\S]*"title"[\s\S]*"days"[\s\S]*\}/g, '')
                                            .replace(/\{\s*"time"\s*:[\s\S]*/g, '') // Catch partial itinerary JSON objects
                                            .replace(/,\s*\{\s*"time"\s*:/g, '') // Catch trailing activity objects
                                            .replace(/SUGGESTED_QUESTION:.*$/gm, '')
                                            .trim();

                                        // Split into paragraphs
                                        const paragraphs = cleanedContent
                                            .split(/\n\n+/)
                                            .map(p => p.trim())
                                            .filter(p => {
                                                // Must have actual visible text content
                                                if (!p) return false;
                                                if (p === 'SUGGESTED_QUESTION:') return false;
                                                // Check if it's just whitespace or special chars
                                                if (!/[a-zA-Z0-9]/.test(p)) return false;
                                                return true;
                                            });

                                        // If no visible paragraphs, render nothing
                                        if (paragraphs.length === 0) return null;

                                        return paragraphs.map((paragraph, pIndex) => (
                                            <div key={`${msg.id}-p-${pIndex}`} className={`${styles.message} ${styles.assistant}`}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{paragraph}</ReactMarkdown>
                                            </div>
                                        ));
                                    })()}

                                    {/* Show "View Itinerary" button if this message contains valid itinerary JSON */}
                                    {(() => {
                                        // Helper to check if message has itinerary
                                        const hasItinerary = () => {
                                            // Check for XML tags first
                                            if (msg.content.includes('<ITINERARY_DATA>') && msg.content.includes('</ITINERARY_DATA>')) {
                                                return true;
                                            }
                                            // Check for JSON with required itinerary structure
                                            if (msg.content.includes('"title"') && msg.content.includes('"days"') && msg.content.includes('"activities"')) {
                                                return true;
                                            }
                                            return false;
                                        };

                                        if (!hasItinerary()) return null;

                                        return (
                                            <div className={styles.itineraryAction}>
                                                <button
                                                    onClick={() => {
                                                        // If we already have an itinerary in state, just show it
                                                        if (itinerary && itinerary.title && itinerary.days) {
                                                            setShowItinerary(true);
                                                            return;
                                                        }

                                                        // Otherwise try to extract from message content
                                                        let jsonStr = null;

                                                        // 1. Try XML tags
                                                        const xmlMatch = msg.content.match(/<ITINERARY_DATA>([\s\S]*?)<\/ITINERARY_DATA>/);
                                                        if (xmlMatch) jsonStr = xmlMatch[1];

                                                        // 2. Try code blocks
                                                        if (!jsonStr) {
                                                            const codeMatch = msg.content.match(/```(?:json)?\s*([\s\S]*?)```/);
                                                            if (codeMatch) jsonStr = codeMatch[1];
                                                        }

                                                        // 3. Try raw JSON object
                                                        if (!jsonStr) {
                                                            const rawMatch = msg.content.match(/(\{[\s\S]*"title"[\s\S]*"days"[\s\S]*\})/);
                                                            if (rawMatch) jsonStr = rawMatch[1];
                                                        }

                                                        if (jsonStr) {
                                                            try {
                                                                let cleaned = jsonStr.trim();
                                                                let parsed;
                                                                try {
                                                                    parsed = JSON.parse(cleaned);
                                                                } catch {
                                                                    cleaned = cleaned
                                                                        .replace(/[\r\n]+/g, ' ')
                                                                        .replace(/\s+/g, ' ');
                                                                    parsed = JSON.parse(cleaned);
                                                                }

                                                                if (parsed.title && parsed.days) {
                                                                    setItinerary(parsed);
                                                                    setShowItinerary(true);
                                                                }
                                                            } catch (e) {
                                                                console.error("JSON Parse Error:", e, jsonStr?.substring(0, 200));
                                                            }
                                                        } else {
                                                            // If no JSON found, check localStorage for saved itinerary
                                                            const saved = localStorage.getItem('shywarma_last_itinerary');
                                                            if (saved) {
                                                                try {
                                                                    const parsed = JSON.parse(saved);
                                                                    if (parsed.title && parsed.days) {
                                                                        setItinerary(parsed);
                                                                        setShowItinerary(true);
                                                                    }
                                                                } catch (e) {
                                                                    console.error("Failed to load saved itinerary", e);
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className={styles.viewItineraryBtn}
                                                >
                                                    🗺️ View Custom Itinerary
                                                </button>
                                            </div>
                                        );
                                    })()}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className={`${styles.message} ${styles.assistant}`}>
                                            <HotelCarousel
                                                hotels={msg.attachments.map(a => a.data)}
                                                onBook={openBooking}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
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
                                    (() => {
                                        // Check if itinerary is being generated
                                        const isGeneratingItinerary =
                                            streamingText.includes('<ITINERARY_DATA>') ||
                                            streamingText.includes('```json') ||
                                            streamingText.includes('"days":') ||
                                            streamingText.includes('"activities":');

                                        const cleanedParagraphs = streamingText
                                            .replace(/<ITINERARY_DATA>[\s\S]*?<\/ITINERARY_DATA>/g, '')
                                            .replace(/<ITINERARY_DATA>[\s\S]*/g, '')
                                            .replace(/<\/?ITINERARY_DATA[^>]*>/g, '') // Catch any remaining tag fragments
                                            .replace(/```[\s\S]*?```/g, '')
                                            .replace(/```[\s\S]*/g, '')
                                            .replace(/\{[\s\S]*"title"[\s\S]*"days"[\s\S]*/g, '')
                                            .replace(/\{\s*"time"\s*:[\s\S]*/g, '') // Catch partial activity objects
                                            .replace(/,\s*\{\s*"time"\s*:/g, '') // Catch trailing activity objects
                                            .replace(/,\s*\{\s*"day"\s*:/g, '') // Catch partial day objects
                                            .replace(/"activities"\s*:\s*\[[\s\S]*/g, '') // Catch activities array start
                                            .replace(/"description"\s*:\s*"[^"]*$/g, '') // Catch incomplete description strings
                                            .replace(/SUGGESTED_QUESTION:.*$/gm, '')
                                            .split(/\n\n+/)
                                            .filter(p => {
                                                const cleaned = p.trim();
                                                if (!cleaned) return false;
                                                if (cleaned.startsWith('SUGGESTED_QUESTION')) return false;
                                                return true;
                                            });

                                        // Show itinerary loading state
                                        if (isGeneratingItinerary && cleanedParagraphs.length === 0) {
                                            return (
                                                <div className={`${styles.message} ${styles.assistant} ${styles.itineraryLoading}`}>
                                                    <div className={styles.itineraryLoadingContent}>
                                                        <span className={styles.itineraryLoadingIcon}>🗺️</span>
                                                        <span>Creating your personalized itinerary...</span>
                                                        <div className={styles.typingIndicator}>
                                                            <span></span>
                                                            <span></span>
                                                            <span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (cleanedParagraphs.length === 0) {
                                            return (
                                                <div className={`${styles.message} ${styles.assistant}`}>
                                                    <div className={styles.typingIndicator}>
                                                        <span></span>
                                                        <span></span>
                                                        <span></span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Show regular content + itinerary loading if both exist
                                        return (
                                            <>
                                                {cleanedParagraphs.map((paragraph, idx) => (
                                                    <div key={`streaming-${idx}`} className={`${styles.message} ${styles.assistant}`}>
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{paragraph}</ReactMarkdown>
                                                    </div>
                                                ))}
                                                {isGeneratingItinerary && (
                                                    <div className={`${styles.message} ${styles.assistant} ${styles.itineraryLoading}`}>
                                                        <div className={styles.itineraryLoadingContent}>
                                                            <span className={styles.itineraryLoadingIcon}>🗺️</span>
                                                            <span>Creating your personalized itinerary...</span>
                                                            <div className={styles.typingIndicator}>
                                                                <span></span>
                                                                <span></span>
                                                                <span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()
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
                        // Send edit request with current itinerary context
                        const itineraryContext = JSON.stringify(itinerary);
                        handleSend(
                            `Edit this itinerary based on my instruction: "${instruction}"\n\nCurrent itinerary to modify:\n<ITINERARY_DATA>${itineraryContext}</ITINERARY_DATA>`,
                            `Edit itinerary: "${instruction}"`
                        );
                    }}
                    isLoading={isLoading}
                />
            )}
            {/* Booking Modal */}
            <BookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                hotelName={bookingData.hotelName}
                destination={bookingData.destination}
                pricePerNight={bookingData.pricePerNight}
            />
        </>
    );
}
