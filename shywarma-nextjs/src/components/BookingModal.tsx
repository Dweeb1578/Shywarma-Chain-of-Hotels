"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './BookingModal.module.css';
import { useAuth } from '@/context/AuthContext';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    hotelName?: string;
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    roomType?: string;
    pricePerNight?: number;
}

export default function BookingModal({
    isOpen,
    onClose,
    hotelName = '',
    destination = '',
    checkIn = '',
    checkOut = '',
    roomType = '',
    pricePerNight = 0
}: BookingModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        hotel: hotelName,
        destination: destination,
        checkIn: checkIn || new Date().toISOString().split('T')[0],
        checkOut: checkOut || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        roomType: roomType,
        guests: 2,
        specialRequests: ''
    });
    const [submitted, setSubmitted] = useState(false);

    // Update form when props change
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            hotel: hotelName || prev.hotel,
            destination: destination || prev.destination,
            checkIn: checkIn || prev.checkIn,
            checkOut: checkOut || prev.checkOut,
            roomType: roomType || prev.roomType,
            email: user?.email || prev.email,
            name: user?.user_metadata?.full_name || prev.name
        }));
    }, [hotelName, destination, checkIn, checkOut, roomType, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const calculateTotal = () => {
        if (!formData.checkIn || !formData.checkOut || !pricePerNight) return 0;
        const nights = Math.ceil(
            (new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24)
        );
        return nights > 0 ? nights * pricePerNight : 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In production, this would send to a booking API
        console.log('Booking submitted:', formData);
        setSubmitted(true);
    };

    const handleClose = () => {
        setSubmitted(false);
        onClose();
    };

    if (!isOpen) return null;

    const content = (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose}>×</button>

                {submitted ? (
                    <div className={styles.success}>
                        <div className={styles.successIcon}>✓</div>
                        <h2>Booking Request Received!</h2>
                        <p>Thank you for your interest in <strong>{formData.hotel}</strong>.</p>
                        <p>Our concierge team will contact you within 24 hours to confirm your reservation.</p>
                        <button className={styles.primaryBtn} onClick={handleClose}>
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className={styles.header}>
                            <h2>Book Your Stay</h2>
                            {formData.hotel && <p className={styles.hotelName}>{formData.hotel}</p>}
                            {formData.destination && <p className={styles.destination}>📍 {formData.destination}</p>}
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Guests</label>
                                    <select name="guests" value={formData.guests} onChange={handleChange}>
                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                            <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Check-in *</label>
                                    <input
                                        type="date"
                                        name="checkIn"
                                        value={formData.checkIn}
                                        onChange={handleChange}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Check-out *</label>
                                    <input
                                        type="date"
                                        name="checkOut"
                                        value={formData.checkOut}
                                        onChange={handleChange}
                                        required
                                        min={formData.checkIn}
                                    />
                                </div>
                            </div>

                            {formData.roomType && (
                                <div className={styles.field}>
                                    <label>Room Type</label>
                                    <input
                                        type="text"
                                        name="roomType"
                                        value={formData.roomType}
                                        onChange={handleChange}
                                        readOnly
                                        className={styles.readonly}
                                    />
                                </div>
                            )}

                            <div className={styles.field}>
                                <label>Special Requests</label>
                                <textarea
                                    name="specialRequests"
                                    value={formData.specialRequests}
                                    onChange={handleChange}
                                    placeholder="Honeymoon setup, dietary requirements, airport transfer..."
                                    rows={3}
                                />
                            </div>

                            {pricePerNight > 0 && (
                                <div className={styles.priceBreakdown}>
                                    <div className={styles.priceRow}>
                                        <span>₹{pricePerNight.toLocaleString()} × {Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights</span>
                                        <span>₹{calculateTotal().toLocaleString()}</span>
                                    </div>
                                    <div className={styles.priceTotal}>
                                        <span>Estimated Total</span>
                                        <span>₹{calculateTotal().toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <button type="submit" className={styles.primaryBtn}>
                                Request Booking
                            </button>
                            <p className={styles.disclaimer}>
                                By submitting, you agree to be contacted by our concierge team.
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );

    if (typeof window === 'undefined') return null;
    return createPortal(content, document.body);
}
