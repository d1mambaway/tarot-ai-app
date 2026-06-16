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

export default function App() {
  const { currentScreen, isLoading, setUser, setLocale, setLoading } = useAppStore();

  useEffect(() => {
    // Initialize Telegram Mini App
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0a0a1a');
      tg.setBackgroundColor('#0a0a1a');

      // Get user data
      const user = tg.initDataUnsafe?.user;
      if (user) {
        // Register/login user via API
        fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: tg.initData,
            telegramId: user.id,
            firstName: user.first_name,
            username: user.username,
            languageCode: user.language_code,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
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
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      // Development mode (not in Telegram)
      setLoading(false);
    }
  }, [setUser, setLocale, setLoading]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">
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
