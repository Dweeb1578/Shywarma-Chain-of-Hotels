import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDestinationBySlug, getAllDestinationSlugs } from "@/data/destinations";
import styles from "./page.module.css";
import ChatWidget from "@/components/ChatWidget";

export async function generateStaticParams() {
    return getAllDestinationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const destination = getDestinationBySlug(slug);
    if (!destination) return { title: "Destination Not Found" };
    return {
        title: `${destination.name} | Shywarma Hotels & Resorts`,
        description: destination.description,
    };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const destination = getDestinationBySlug(slug);

    if (!destination) {
        notFound();
    }

    return (
        <>
            {/* Hero Section */}
            <header className={styles.hero}>
                <Image
                    src={destination.heroImage}
                    alt={destination.name}
                    fill
                    className={styles.heroImage}
                    priority
                />
                <div className={styles.heroOverlay}>
                    <Link href="/" className={styles.backLink}>← Back to Destinations</Link>
                    <span className={styles.tagline}>{destination.tagline}</span>
                    <h1>{destination.name}</h1>
                    <p>{destination.description}</p>
                </div>
            </header>

            {/* Hotels Section */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>OUR PROPERTIES</span>
                        <h2>Featured Hotels in {destination.name}</h2>
                    </div>
                    <div className={styles.hotelsGrid}>
                        {destination.hotels.map((hotel) => (
                            <div key={hotel.name} className={styles.hotelCard}>
                                <div className={styles.hotelImageWrapper}>
                                    <Image
                                        src={hotel.image}
                                        alt={hotel.name}
                                        fill
                                        className={styles.hotelImage}
                                    />
                                </div>
                                <div className={styles.hotelContent}>
                                    <div className={styles.stars}>
                                        {"★".repeat(hotel.stars)}
                                    </div>
                                    <h3>{hotel.name}</h3>
                                    <p>{hotel.description}</p>
                                    <Link href={`/destinations/${slug}/${hotel.slug}`} className={styles.btn}>
                                        View Rooms
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Rooms Section */}
            <section className={styles.section} style={{ background: "white" }}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>ACCOMMODATIONS</span>
                        <h2>Rooms & Suites</h2>
                    </div>
                    <div className={styles.roomsGrid}>
                        {destination.rooms.map((room) => (
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
                                    <button className={styles.btn}>Book Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Travel Packages Section */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>CURATED EXPERIENCES</span>
                        <h2>Exclusive Travel Packages</h2>
                    </div>
                    <div className={styles.packagesGrid}>
                        {destination.packages.map((pkg) => (
                            <div key={pkg.name} className={styles.packageCard}>
                                <div className={styles.packageImageWrapper}>
                                    <Image
                                        src={pkg.image}
                                        alt={pkg.name}
                                        fill
                                        className={styles.packageImage}
                                    />
                                    <div className={styles.packageOverlay}>
                                        <span className={styles.duration}>{pkg.duration}</span>
                                    </div>
                                </div>
                                <div className={styles.packageContent}>
                                    <h3>{pkg.name}</h3>
                                    <p className={styles.packageDesc}>{pkg.description}</p>
                                    <div className={styles.inclusions}>
                                        <h4>Includes:</h4>
                                        <ul>
                                            {pkg.inclusions.slice(0, 4).map((inc) => (
                                                <li key={inc}>• {inc}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className={styles.packageFooter}>
                                        <div className={styles.packagePrice}>
                                            <span>From</span>
                                            <strong>{pkg.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</strong>
                                            <span>/ person</span>
                                        </div>
                                        <button className={styles.btnOutline}>View Details</button>
                                    </div>
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
                        <span className={styles.sectionTag}>WORLD-CLASS</span>
                        <h2>Amenities & Experiences</h2>
                    </div>
                    <div className={styles.amenitiesGrid}>
                        {destination.amenities.map((amenity) => (
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
                        <span className={styles.sectionTag}>GUEST EXPERIENCES</span>
                        <h2 style={{ color: "white" }}>What Our Guests Say</h2>
                    </div>
                    <div className={styles.reviewsGrid}>
                        {destination.reviews.map((review) => (
                            <div key={review.name} className={styles.reviewCard}>
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
