'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import HomeScreen from '@/components/layout/HomeScreen';
import SpreadScreen from '@/components/layout/SpreadScreen';
import ReadingScreen from '@/components/layout/ReadingScreen';
import HistoryScreen from '@/components/layout/HistoryScreen';
import ProfileScreen from '@/components/layout/ProfileScreen';
import CollectionScreen from '@/components/layout/CollectionScreen';
import ShopScreen from '@/components/layout/ShopScreen';
import BottomNav from '@/components/layout/BottomNav';
import LoadingScreen from '@/components/ui/LoadingScreen';
import StarField from '@/components/ui/StarField';

export default function App() {
  const { currentScreen, isLoading, setUser, setLocale, setLoading } = useAppStore();

  useEffect(() => {
    const init = async () => {
      const tg = (window as any).Telegram?.WebApp;

      if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0a0a1a');
        tg.setBackgroundColor('#0a0a1a');

        const user = tg.initDataUnsafe?.user;
        if (user) {
          try {
            const res = await fetch('/api/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                initData: tg.initData,
                telegramId: user.id,
                firstName: user.first_name,
                username: user.username,
                languageCode: user.language_code,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              setUser({
                telegramId: user.id,
                firstName: user.first_name,
                locale: data.locale || (user.language_code === 'uk' ? 'uk' : 'ru'),
                subscription: data.subscription || 'none',
                streakDays: data.streakDays || 0,
                freeReadsLeft: data.freeReadsLeft || 0,
                bonusReads: data.bonusReads || 0,
                cardCollection: data.cardCollection || [],
              });
              setLocale(data.locale || 'ru');
            } else {
              // DB not ready — set demo user from TG data
              setUser({
                telegramId: user.id,
                firstName: user.first_name,
                locale: user.language_code === 'uk' ? 'uk' : 'ru',
                subscription: 'none',
                streakDays: 0,
                freeReadsLeft: 3,
                bonusReads: 0,
                cardCollection: [],
              });
              setLocale(user.language_code === 'uk' ? 'uk' : 'ru');
            }
          } catch {
            // Fallback demo user
            setUser({
              telegramId: user.id,
              firstName: user.first_name,
              locale: 'ru',
              subscription: 'none',
              streakDays: 0,
              freeReadsLeft: 3,
              bonusReads: 0,
              cardCollection: [],
            });
          }
        }
      } else {
        // Dev mode — not inside Telegram
        setUser({
          telegramId: 0,
          firstName: 'Гость',
          locale: 'ru',
          subscription: 'none',
          streakDays: 3,
          freeReadsLeft: 3,
          bonusReads: 1,
          cardCollection: [0, 1, 2, 5, 8],
        });
      }

      // Minimum splash screen time for effect
      await new Promise((r) => setTimeout(r, 2500));
      setLoading(false);
    };

    init();
  }, [setUser, setLocale, setLoading]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col bg-mystic-bg">
      <StarField />
      <main className="flex-1 pb-20 relative z-10">
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'spread' && <SpreadScreen />}
        {currentScreen === 'reading' && <ReadingScreen />}
        {currentScreen === 'history' && <HistoryScreen />}
        {currentScreen === 'profile' && <ProfileScreen />}
        {currentScreen === 'collection' && <CollectionScreen />}
        {currentScreen === 'shop' && <ShopScreen />}
      </main>
      <BottomNav />
    </div>
  );
}
