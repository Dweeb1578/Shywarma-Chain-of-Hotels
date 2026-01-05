"use client";
import { useState, useEffect } from 'react'; // Ensure useEffect is imported
import { createPortal } from 'react-dom';
import styles from './ItineraryCanvas.module.css';

// ... (interfaces remain same)
interface ItineraryActivity {
    time: string;
    description: string;
    distance?: string;
}

interface ItineraryDay {
    day: number;
    date?: string;
    title: string;
    activities: ItineraryActivity[];
}

interface Itinerary {
    title: string;
    days: ItineraryDay[];
}

interface ItineraryCanvasProps {
    itinerary: Itinerary;
    onClose: () => void;
    onEdit: (instruction: string) => void;
    isLoading?: boolean;
}

export default function ItineraryCanvas({ itinerary, onClose, onEdit, isLoading = false }: ItineraryCanvasProps) {
    const [editInstruction, setEditInstruction] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleExport = () => {
        // Simple clipboard export for now
        // Update export to handle new object structure
        const text = `${itinerary.title}\n\n` + itinerary.days.map(d =>
            `Day ${d.day} (${d.date || 'TBD'}): ${d.title}\n${d.activities.map(a => `- [${a.time}] ${a.description}`).join('\n')}`
        ).join('\n\n');

        navigator.clipboard.writeText(text);
        alert("Itinerary copied to clipboard!");
    };

    const handlePrint = () => {
        window.print();
    };

    const submitEdit = () => {
        if (editInstruction.trim()) {
            onEdit(editInstruction);
            setEditInstruction("");
            setIsEditing(false);
        }
    };

    const content = (
        <div className={styles.overlay}>
            {/* ... (rest of the JSX remains same) */}
            <div className={styles.canvasContainer}>
                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner}></div>
                        <p>Updating Itinerary...</p>
                    </div>
                )}
                {/* Header */}
                <div className={styles.header}>
                    <h2>{itinerary.title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>×</button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <div className={styles.heroImage}>
                        {/* Placeholder for destination image - could be dynamic later */}
                        <img src="/images/destinations/maldives.png" alt="Destination" onError={(e) => e.currentTarget.src = "/images/destinations/paris.png"} />
                        <div className={styles.heroOverlay}>
                            <h3>Your Custom Trip</h3>
                        </div>
                    </div>

                    <div className={styles.daysGrid}>
                        {itinerary.days.map((day) => (
                            <div key={day.day} className={styles.dayCard}>
                                <div className={styles.dayHeader}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className={styles.dayNumber}>Day {day.day}</span>
                                        {day.date && <span style={{ fontSize: '0.75rem', color: '#666' }}>{day.date}</span>}
                                    </div>
                                    <span className={styles.dayTitle}>{day.title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}</span>
                                </div>
                                <ul className={styles.activityList}>
                                    {day.activities.map((act, i) => (
                                        <li key={i} className={styles.activityItem}>
                                            <div className={styles.timeCol}>
                                                <span className={styles.actTime}>{act.time}</span>
                                                {act.distance && <span className={styles.actDist}>{act.distance}</span>}
                                            </div>
                                            <div className={styles.actContent}>
                                                <p>{act.description}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className={styles.footer}>
                    <div className={styles.actionButtons}>
                        <button onClick={handlePrint} className={styles.secondaryBtn}>🖨️ Print / PDF</button>
                        <button onClick={handleExport} className={styles.secondaryBtn}>📋 Copy</button>
                    </div>

                    <div className={styles.editSection}>
                        {isEditing ? (
                            <div className={styles.editInput}>
                                <input
                                    type="text"
                                    placeholder="e.g. 'Make day 2 more relaxing'..."
                                    value={editInstruction}
                                    onChange={(e) => setEditInstruction(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                                />
                                <button onClick={submitEdit} className={styles.primaryBtn}>Update</button>
                                <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancel</button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className={styles.primaryBtn}>✨ AI Edit Itinerary</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!mounted) return null;
    return createPortal(content, document.body);
}
