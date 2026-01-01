"use client";
import { useState } from "react";
import { useChat } from "@/context/ChatContext";
import styles from "./ChatWidget.module.css";

export default function ChatWidget() {
    const { messages, addMessage, isOpen, toggleChat } = useChat();
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        addMessage("user", input);
        setInput("");
        // Simulate bot response
        setTimeout(() => {
            addMessage("assistant", "Thanks for your message! How can I help you book your perfect stay at Shywarma Hotels?");
        }, 1000);
    };

    return (
        <>
            <button className={styles.fab} onClick={toggleChat}>
                {isOpen ? "✕" : "💬"}
            </button>
            {isOpen && (
                <div className={styles.chatBox}>
                    <div className={styles.header}>
                        <h4>Shywarma Assistant</h4>
                        <span>Online</span>
                    </div>
                    <div className={styles.messages}>
                        {messages.length === 0 && (
                            <p className={styles.empty}>Hi! How can I help you today?</p>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                                {msg.content}
                            </div>
                        ))}
                    </div>
                    <div className={styles.inputArea}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Type a message..."
                        />
                        <button onClick={handleSend}>Send</button>
                    </div>
                </div>
            )}
        </>
    );
}
