"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./BookingWidget.module.css";

const destinations = [
    { slug: "maldives", name: "Maldives" },
    { slug: "santorini", name: "Santorini" },
    { slug: "dubai", name: "Dubai" },
    { slug: "bali", name: "Bali" },
    { slug: "paris", name: "Paris" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDate(date: Date | null): string {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

interface DatePickerProps {
    value: Date | null;
    onChange: (date: Date) => void;
    minDate?: Date;
    onClose: () => void;
}

function DatePicker({ value, onChange, minDate, onClose }: DatePickerProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(value?.getFullYear() || today.getFullYear());
    const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const handleDayClick = (day: number) => {
        const selected = new Date(viewYear, viewMonth, day);
        if (minDate && selected < minDate) return;
        onChange(selected);
        onClose();
    };

    const isPastDate = (day: number): boolean => {
        const date = new Date(viewYear, viewMonth, day);
        const min = minDate || today;
        min.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date < min;
    };

    const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

    return (
        <div ref={ref} className={styles.datePicker}>
            <div className={styles.datePickerHeader}>
                <button
                    type="button"
                    className={styles.datePickerNav}
                    onClick={goToPrevMonth}
                    disabled={!canGoPrev}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
                <span className={styles.datePickerTitle}>{MONTHS[viewMonth]} {viewYear}</span>
                <button type="button" className={styles.datePickerNav} onClick={goToNextMonth}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>
            </div>
            <div className={styles.datePickerDays}>
                {DAYS.map(d => <span key={d} className={styles.dayLabel}>{d}</span>)}
            </div>
            <div className={styles.datePickerGrid}>
                {days.map((day, i) => (
                    <button
                        key={i}
                        type="button"
                        className={`${styles.dayBtn} ${day === null ? styles.empty : ""} ${day && value && isSameDay(new Date(viewYear, viewMonth, day), value) ? styles.selected : ""} ${day && isPastDate(day) ? styles.disabled : ""}`}
                        onClick={() => day && !isPastDate(day) && handleDayClick(day)}
                        disabled={day === null || (day !== null && isPastDate(day))}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function BookingWidget() {
    const router = useRouter();
    const [destination, setDestination] = useState("");
    const [checkIn, setCheckIn] = useState<Date | null>(null);
    const [checkOut, setCheckOut] = useState<Date | null>(null);
    const [guests, setGuests] = useState(2);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showCheckInPicker, setShowCheckInPicker] = useState(false);
    const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

    const handleSearch = () => {
        if (destination) {
            const params = new URLSearchParams();
            if (checkIn) params.set("checkin", checkIn.toISOString().split("T")[0]);
            if (checkOut) params.set("checkout", checkOut.toISOString().split("T")[0]);
            if (guests) params.set("guests", guests.toString());

            const queryString = params.toString();
            router.push(`/destinations/${destination}${queryString ? `?${queryString}` : ""}`);
        } else {
            const destSection = document.getElementById("destinations");
            if (destSection) {
                destSection.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    const selectedDestName = destinations.find(d => d.slug === destination)?.name || "";
    const today = new Date();

    return (
        <div className={styles.bookingWidget}>
            {/* Destination Dropdown */}
            <div className={styles.bookingField} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <label>Destination</label>
                <div className={styles.dropdownWrapper}>
                    <button
                        type="button"
                        className={`${styles.dropdownTrigger} ${selectedDestName ? styles.hasValue : ""}`}
                    >
                        {selectedDestName || "Where are you going?"}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                    {isDropdownOpen && (
                        <div className={styles.dropdown}>
                            {destinations.map((dest) => (
                                <button
                                    key={dest.slug}
                                    type="button"
                                    className={`${styles.dropdownItem} ${destination === dest.slug ? styles.active : ""}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDestination(dest.slug);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    {dest.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.bookingDivider}></div>

            {/* Check In Date */}
            <div className={styles.bookingField} onClick={() => { setShowCheckInPicker(true); setShowCheckOutPicker(false); }}>
                <label>Check In</label>
                <span className={`${styles.inputDisplay} ${checkIn ? styles.hasValue : ""}`}>
                    {checkIn ? formatDate(checkIn) : "Add date"}
                </span>
                {showCheckInPicker && (
                    <DatePicker
                        value={checkIn}
                        onChange={(d) => { setCheckIn(d); if (!checkOut || checkOut <= d) setCheckOut(null); }}
                        minDate={today}
                        onClose={() => setShowCheckInPicker(false)}
                    />
                )}
            </div>

            <div className={styles.bookingDivider}></div>

            {/* Check Out Date */}
            <div className={styles.bookingField} onClick={() => { setShowCheckOutPicker(true); setShowCheckInPicker(false); }}>
                <label>Check Out</label>
                <span className={`${styles.inputDisplay} ${checkOut ? styles.hasValue : ""}`}>
                    {checkOut ? formatDate(checkOut) : "Add date"}
                </span>
                {showCheckOutPicker && (
                    <DatePicker
                        value={checkOut}
                        onChange={setCheckOut}
                        minDate={checkIn ? new Date(checkIn.getTime() + 86400000) : today}
                        onClose={() => setShowCheckOutPicker(false)}
                    />
                )}
            </div>

            <div className={styles.bookingDivider}></div>

            {/* Guests */}
            <div className={styles.bookingField}>
                <label>Guests</label>
                <div className={styles.guestsWrapper}>
                    <button
                        type="button"
                        className={styles.guestBtn}
                        onClick={(e) => { e.stopPropagation(); setGuests(Math.max(1, guests - 1)); }}
                        disabled={guests <= 1}
                    >
                        −
                    </button>
                    <span className={styles.guestCount}>{guests} {guests === 1 ? "Guest" : "Guests"}</span>
                    <button
                        type="button"
                        className={styles.guestBtn}
                        onClick={(e) => { e.stopPropagation(); setGuests(Math.min(10, guests + 1)); }}
                        disabled={guests >= 10}
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Search Button */}
            <button className={styles.searchBtn} onClick={handleSearch}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                Search
            </button>
        </div>
    );
}
