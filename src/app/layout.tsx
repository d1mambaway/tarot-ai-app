import type { Metadata } from 'next';
import Script from 'next/script';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Магия Карт — AI Таролог',
  description: 'AI-таролог в Telegram. Расклады, гороскопы, нумерология, совместимость.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {/* The loading screen needs these first */}
        <link rel="preload" as="image" href="/ui/splash-bg.webp" />
        <link rel="preload" as="image" href="/ui/card-back.webp" />
        <link rel="preload" as="font" type="font/woff2" href="/fonts/cormorant/cormorant-garamond-cyrillic-600-normal.woff2" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/woff2" href="/fonts/cormorant/cormorant-garamond-latin-600-normal.woff2" crossOrigin="anonymous" />
      </head>
      <body className="safe-area min-h-screen bg-mystic-bg text-mystic-text">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
