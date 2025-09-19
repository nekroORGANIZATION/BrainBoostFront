// app/layout.tsx
import './globals.css';
import { Afacad, Mulish } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import Navbar from '@/components/Navbar';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const afacad = Afacad({ subsets: ['latin', 'cyrillic-ext'], weight: ['600','700'], variable: '--font-afacad' });
const mulish = Mulish({ subsets: ['latin','cyrillic','cyrillic-ext'], weight: ['400','500','600','700','800'], variable: '--font-mulish' });

export const metadata = { title: 'BrainBoost', description: 'Навчальна платформа' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${afacad.variable} ${mulish.variable} font-mulish antialiased min-h-screen w-full`} style={{color:'black'}}>
        <AccessibilityProvider>
          <AuthProvider>
            <Navbar hideOn={['/login','/register']} />
            {children}
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
