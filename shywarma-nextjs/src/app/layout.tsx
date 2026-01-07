import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Playfair_Display } from "next/font/google";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChatProvider } from "@/context/ChatContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
    title: "Shywarma Hotels & Resorts | Extraordinary Stays",
    description: "Discover exceptional stays worldwide with Shywarma Hotels",
    icons: {
        icon: "/logo.png",
        apple: "/logo.png",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${playfair.variable}`}>
                <AuthProvider>
                    <ChatProvider>
                        <Navbar />
                        {children}
                        <Footer />
                        <Analytics />
                    </ChatProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
