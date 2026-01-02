import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { destinations } from "@/data/destinations";

export const metadata = {
    title: "Exclusive Travel Packages | Shywarma Hotels",
    description: "Discover our curated travel experiences across the world's most beautiful destinations.",
};

export default function PackagesPage() {
    // Flatten all packages into a single array with destination context
    const allPackages = destinations.flatMap(dest =>
        dest.packages.map(pkg => ({
            ...pkg,
            destinationSlug: dest.slug,
            destinationName: dest.name
        }))
    );

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>Curated Journeys</h1>
                    <p>More than just a stay. Experience the essence of our destinations with our exclusive travel packages.</p>
                </div>
            </section>

            <div className={styles.container}>
                {/* Optional: Filter by destination could go here */}

                <div className={styles.grid}>
                    {allPackages.map((pkg, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={pkg.image}
                                    alt={pkg.name}
                                    fill
                                    className={styles.cardImg}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                            <div className={styles.content}>
                                <span className={styles.destinationTag}>{pkg.destinationName}</span>
                                <h3>{pkg.name}</h3>
                                <div className={styles.duration}>
                                    <span>🕒 {pkg.duration}</span>
                                </div>
                                <p className={styles.desc}>{pkg.description}</p>

                                <ul className={styles.inclusions}>
                                    {pkg.inclusions.slice(0, 3).map((inc, i) => (
                                        <li key={i}>{inc}</li>
                                    ))}
                                    {pkg.inclusions.length > 3 && <li>+{pkg.inclusions.length - 3} more</li>}
                                </ul>

                                <div className={styles.footer}>
                                    <span className={styles.price}>
                                        {pkg.price.toLocaleString('en-IN', {
                                            style: 'currency',
                                            currency: 'INR',
                                            maximumFractionDigits: 0
                                        })}
                                    </span>
                                    <Link
                                        href={`/destinations/${pkg.destinationSlug}`}
                                        className={styles.bookBtn}
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
