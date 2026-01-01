"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 80);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <Image
                        src="/logo.png"
                        alt="Shywarma Hotels"
                        width={55}
                        height={55}
                        className={styles.logoImg}
                    />
                    <div className={styles.brandText}>
                        <span className={styles.brandName}>Shywarma</span>
                        <span className={styles.brandSub}>Hotels & Resorts</span>
                    </div>
                </Link>
                <ul className={styles.navLinks}>
                    <li><Link href="/#destinations">Destinations</Link></li>
                    <li><Link href="/#rooms">Rooms</Link></li>
                    <li><Link href="/#offers">Offers</Link></li>
                    <li><Link href="/chat">Chat</Link></li>
                </ul>
                <div className={styles.actions}>
                    <button className={styles.btnGhost}>Sign In</button>
                    <button className={styles.btnPrimary}>Book Now</button>
                </div>
                <button className={styles.mobileMenuBtn}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
}
