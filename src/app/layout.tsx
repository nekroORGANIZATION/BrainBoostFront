'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

// додаємо шрифти з next/font
import { Afacad, Mulish } from 'next/font/google';

const afacad = Afacad({
  subsets: ['latin', 'cyrillic-ext'],
  weight: ['600', '700', '700'],
  variable: '--font-afacad',
});

const mulish = Mulish({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-mulish',
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbarRoutes = ['/login', '/register'];
  const showNavbar = !hideNavbarRoutes.includes(pathname);

  return (
    <html lang="uk"> {/* краще uk замість ua */}
      <body
        className={`${afacad.variable} ${mulish.variable} font-mulish antialiased`}
        style={{ color: 'black' }}
      >
        <AuthProvider>
          {showNavbar && <Navbar />}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
