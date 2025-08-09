'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// якщо хочеш залишити metadata, перенеси в page.tsx
// export const metadata: Metadata = { ... }

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const hideNavbarRoutes = ['/login', '/register'];
    const showNavbar = !hideNavbarRoutes.includes(pathname);

    return (
        <html lang="ua">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={{ color: 'black' }}>
                <AuthProvider>
                    {showNavbar && <Navbar />}
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
