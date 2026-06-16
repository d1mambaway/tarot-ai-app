import type { Metadata } from 'next';
import Script from 'next/script';
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
      </head>
      <body className="safe-area min-h-screen bg-mystic-bg text-mystic-text">
        {children}
      </body>
    </html>
  );
}
