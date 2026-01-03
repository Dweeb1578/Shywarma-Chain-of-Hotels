import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHotelBySlug, getAllHotelPaths } from "@/data/destinations";
import styles from "./page.module.css";
import ChatWidget from "@/components/ChatWidget";

export async function generateStaticParams() {
    return getAllHotelPaths().map((path) => ({
        slug: path.destinationSlug,
        hotelSlug: path.hotelSlug,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string, hotelSlug: string }> }) {
    const { slug, hotelSlug } = await params;
    const hotel = getHotelBySlug(slug, hotelSlug);
    if (!hotel) return { title: "Hotel Not Found" };
    return {
        title: `${hotel.name} | Shywarma Hotels & Resorts`,
        description: hotel.description,
    };
}

export default async function HotelPage({ params }: { params: Promise<{ slug: string, hotelSlug: string }> }) {
    const { slug, hotelSlug } = await params;
    const hotel = getHotelBySlug(slug, hotelSlug);

    if (!hotel) {
        notFound();
    }

    return (
        <>
            {/* Hero Section */}
            <header className={styles.hero}>
                <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className={styles.heroImage}
                    priority
                />
                <div className={styles.heroOverlay}>
                    <Link href={`/destinations/${slug}`} className={styles.backLink}>
                        ← Back to {slug.charAt(0).toUpperCase() + slug.slice(1)}
                    </Link>
                    <h1>{hotel.name}</h1>
                    <div className={styles.hotelMeta}>
                        <span className={styles.hotelTag}>LUXURY COLLECTION</span>
                        <span className={styles.stars}>{"★".repeat(hotel.stars)}</span>
                    </div>
                    <p>{hotel.description}</p>
                </div>
            </header>

            {/* Overview / About Section could go here, but merging with Rooms for conciseness as per request */}

            {/* Rooms Section */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>ACCOMMODATIONS</span>
                        <h2>Rooms & Suites</h2>
                    </div>
                    <div className={styles.roomsGrid}>
                        {hotel.rooms.map((room) => (
                            <div key={room.name} className={styles.roomCard}>
                                <div className={styles.roomImageWrapper}>
                                    <Image
                                        src={room.image}
                                        alt={room.name}
                                        fill
                                        className={styles.roomImage}
                                    />
                                </div>
                                <div className={styles.roomContent}>
                                    <h3>{room.name}</h3>
                                    <p className={styles.price}>
                                        {room.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}<span> / night</span>
                                    </p>
                                    <ul className={styles.features}>
                                        {room.features.map((f) => (
                                            <li key={f}>✓ {f}</li>
                                        ))}
                                    </ul>
                                    <button className={styles.btn}>Book This Room</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Amenities Section */}
            <section className={styles.section} style={{ background: "white" }}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>AMENITIES</span>
                        <h2>World-Class Facilities</h2>
                    </div>
                    <div className={styles.amenitiesGrid}>
                        {hotel.amenities.map((amenity) => (
                            <div key={amenity} className={styles.amenityCard}>
                                <span className={styles.amenityIcon}>✦</span>
                                <span>{amenity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reviews Section */}
            <section className={styles.section} style={{ background: "#1C1917" }}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader} style={{ color: "white" }}>
                        <span className={styles.sectionTag}>GUEST DIARIES</span>
                        <h2 style={{ color: "white" }}>What People Say</h2>
                    </div>
                    <div className={styles.reviewsGrid}>
                        {hotel.reviews.map((review, index) => (
                            <div key={index} className={styles.reviewCard}>
                                <div className={styles.reviewStars}>
                                    {"★".repeat(review.rating)}
                                </div>
                                <p className={styles.reviewText}>"{review.text}"</p>
                                <div className={styles.reviewAuthor}>
                                    <div className={styles.avatar}>
                                        {review.name.charAt(0)}
                                    </div>
                                    <div>
                                        <strong>{review.name}</strong>
                                        <span>{review.city} • {review.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <ChatWidget />
        </>
    );
}
