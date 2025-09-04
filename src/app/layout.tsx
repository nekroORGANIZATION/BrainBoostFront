// app/layout.tsx  (SERVER component)
import './globals.css';
import { Afacad, Mulish } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import Navbar from '@/components/Navbar';

const afacad = Afacad({
  subsets: ['latin', 'cyrillic-ext'],
  weight: ['600', '700'],
  variable: '--font-afacad',
});

const mulish = Mulish({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-mulish',
});

export const metadata = {
  title: 'BrainBoost',
  description: 'Навчальна платформа',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning — чтобы класс/атрибуты, которые навешивает провайдер
    // (dark/hc/data-motion/шрифты), не давали гидратационных ворнингов
    <html lang="uk" suppressHydrationWarning>
      <body
        className={`${afacad.variable} ${mulish.variable} font-mulish antialiased`}
        style={{ color: 'black' }}
      >
        {/* Глобальные пользовательские настройки отображения */}
        <AccessibilityProvider>
          {/* Аутентификация + твой Navbar */}
          <AuthProvider>
            <Navbar hideOn={['/login', '/register']} />
            {children}
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
