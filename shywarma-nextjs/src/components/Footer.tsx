import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <Image src="/logo.png" alt="Shywarma Hotels" width={100} height={100} className={styles.logoImg} />
                            <div className={styles.brandText}>
                                <span className={styles.brandName}>Shywarma</span>
                                <span className={styles.brandSub}>Hotels & Resorts</span>
                            </div>
                        </Link>
                        <p>Redefining luxury hospitality with handpicked properties worldwide.</p>
                    </div>
                    <div className={styles.links}>
                        <h4>Company</h4>
                        <ul><li><Link href="#">About Us</Link></li><li><Link href="#">Careers</Link></li></ul>
                    </div>
                    <div className={styles.links}>
                        <h4>Support</h4>
                        <ul><li><Link href="#">Help Center</Link></li><li><Link href="/chat">Chat With Us</Link></li></ul>
                    </div>
                    <div className={styles.links}>
                        <h4>Legal</h4>
                        <ul><li><Link href="#">Terms</Link></li><li><Link href="#">Privacy</Link></li></ul>
                    </div>
                </div>
                <div className={styles.bottom}>
                    <p>© 2026 Shywarma Hotels & Resorts. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
