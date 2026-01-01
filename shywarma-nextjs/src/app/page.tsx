import styles from "./page.module.css";
import Image from "next/image";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
    return (
        <>
            <header className={styles.hero}>
                <div className={styles.heroBg}></div>
                <div className={styles.heroContent}>
                    <Image
                        src="/hero-logo.png"
                        alt="Shywarma Hotels & Resorts"
                        width={220}
                        height={220}
                        className={styles.heroLogo}
                        priority
                    />
                    <h1>Where Luxury Meets <span className={styles.accent}>Unforgettable</span> Moments</h1>
                    <p>Discover handpicked hotels and resorts that redefine comfort. Your perfect getaway is just a click away.</p>

                    <div className={styles.bookingWidget}>
                        <div className={styles.bookingField}>
                            <label>Destination</label>
                            <input type="text" placeholder="Where are you going?" />
                        </div>
                        <div className={styles.bookingDivider}></div>
                        <div className={styles.bookingField}>
                            <label>Check In</label>
                            <input type="text" placeholder="Add date" />
                        </div>
                        <div className={styles.bookingDivider}></div>
                        <div className={styles.bookingField}>
                            <label>Check Out</label>
                            <input type="text" placeholder="Add date" />
                        </div>
                        <div className={styles.bookingDivider}></div>
                        <div className={styles.bookingField}>
                            <label>Guests</label>
                            <input type="text" placeholder="Add guests" />
                        </div>
                        <button className={styles.searchBtn}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Search
                        </button>
                    </div>
                </div>
            </header>

            <section className={styles.stats}>
                <div className={styles.statItem}><span>500+</span><p>Luxury Properties</p></div>
                <div className={styles.statItem}><span>120</span><p>Countries Worldwide</p></div>
                <div className={styles.statItem}><span>2M+</span><p>Happy Guests</p></div>
                <div className={styles.statItem}><span>4.9</span><p>Average Rating</p></div>
            </section>

            <section id="destinations" className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>POPULAR DESTINATIONS</span>
                        <h2>Explore Our Finest Locations</h2>
                    </div>
                    <div className={styles.destinationsGrid}>
                        {[
                            { name: "Maldives", image: "/images/destinations/maldives.png", desc: "Crystal waters & overwater villas" },
                            { name: "Santorini", image: "/images/destinations/santorini.png", desc: "Sunset views & white architecture" },
                            { name: "Dubai", image: "/images/destinations/dubai.png", desc: "Opulence & modern luxury" },
                            { name: "Bali", image: "/images/destinations/bali.png", desc: "Tropical serenity & culture" },
                            { name: "Paris", image: "/images/destinations/paris.png", desc: "Romance & timeless elegance" },
                        ].map((dest) => (
                            <div key={dest.name} className={styles.destCard}>
                                <Image
                                    src={dest.image}
                                    alt={dest.name}
                                    fill
                                    className={styles.destImg}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div className={styles.destOverlay}>
                                    <h3>{dest.name}</h3>
                                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>{dest.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="rooms" className={styles.section} style={{ background: "white" }}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>FEATURED ACCOMMODATIONS</span>
                        <h2>Rooms Crafted for Excellence</h2>
                    </div>
                    <div className={styles.roomsGrid}>
                        {[
                            { name: "Ocean View Suite", price: "$589", image: "/images/rooms/ocean-suite.png" },
                            { name: "Presidential Penthouse", price: "$1,299", image: "/images/rooms/penthouse.png" },
                            { name: "Garden Villa Retreat", price: "$349", image: "/images/rooms/garden-villa.png" },
                        ].map((room) => (
                            <div key={room.name} className={styles.roomCard}>
                                <div className={styles.roomCardImage}>
                                    <Image
                                        src={room.image}
                                        alt={room.name}
                                        fill
                                        className={styles.roomImg}
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                </div>
                                <div className={styles.roomCardContent}>
                                    <h3>{room.name}</h3>
                                    <p>{room.price}<span style={{ fontSize: '0.85rem', color: '#5C4033' }}> / night</span></p>
                                    <button>Book Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="offers" className={styles.offers}>
                <div className={styles.container}>
                    <span className={styles.sectionTag}>LIMITED TIME OFFERS</span>
                    <h2>Exclusive Member Benefits</h2>
                    <p>Join Shywarma Elite and unlock unprecedented savings on your next extraordinary getaway.</p>
                    <button className={styles.ctaBtn}>Become a Member</button>
                </div>
            </section>

            <ChatWidget />
        </>
    );
}
