"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ChatWidget.module.css";

interface HotelCardData {
    name: string;
    image: string;
    slug: string;
    destinationSlug: string;
    price?: number;
}

interface Props {
    hotels: HotelCardData[];
    onBook?: (hotelName: string, destination: string, price?: number) => void;
}

export default function HotelCarousel({ hotels, onBook }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const router = useRouter();

    if (!hotels || hotels.length === 0) return null;

    const current = hotels[currentIndex];
    const hasMultiple = hotels.length > 1;

    const goNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % hotels.length);
    };

    const goPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + hotels.length) % hotels.length);
    };

    const handleBook = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onBook) {
            // Convert slug to readable destination name
            const destName = current.destinationSlug
                .split('-')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            onBook(current.name, destName, current.price);
        }
    };

    return (
        <div className={styles.carouselContainer}>
            <div
                className={styles.hotelCard}
                onClick={() => router.push(`/destinations/${current.destinationSlug}/${current.slug}`)}
            >
                <img src={current.image} alt={current.name} className={styles.hotelImage} />
                <div className={styles.hotelInfo}>
                    <h5 className={styles.hotelName}>{current.name}</h5>
                    {current.price && (
                        <div className={styles.hotelPrice}>from ₹{current.price.toLocaleString()}</div>
                    )}
                    {onBook && (
                        <button
                            onClick={handleBook}
                            className={styles.hotelBookBtn}
                        >
                            Book Now
                        </button>
                    )}
                </div>
            </div>
            {hasMultiple && (
                <div className={styles.carouselNav}>
                    <button onClick={goPrev} className={styles.carouselBtn}>←</button>
                    <span className={styles.carouselCounter}>{currentIndex + 1} / {hotels.length}</span>
                    <button onClick={goNext} className={styles.carouselBtn}>→</button>
                </div>
            )}
        </div>
    );
}
