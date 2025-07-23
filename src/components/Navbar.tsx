'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const { isAuthenticated, logout } = useAuth();

    return (
        <nav className="p-4 bg-gray-100 shadow flex gap-6">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/courses" className="hover:underline">Courses</Link>

            {isAuthenticated ? (
                <>
                    <Link href="/profile" className="hover:underline">Profile</Link>
                    <button onClick={logout} className="hover:underline">Logout</button>
                </>
            ) : (
                <>
                    <Link href="/register" className="hover:underline">Register</Link>
                    <Link href="/login" className="hover:underline">Login</Link>
                    <Link href="/teacher_register" className="hover:underline">Teacher Register</Link>
                </>
            )}
        </nav>
    );
}
