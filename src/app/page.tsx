'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useAppStore, isFirstLaunch, markLaunched, loadMana, saveMana, isChannelBonusClaimed } from '@/store/app-store';
import HomeScreen from '@/components/layout/HomeScreen';
import SpreadScreen from '@/components/layout/SpreadScreen';
import ReadingScreen from '@/components/layout/ReadingScreen';
import HistoryScreen from '@/components/layout/HistoryScreen';
import ProfileScreen from '@/components/layout/ProfileScreen';
import CollectionScreen from '@/components/layout/CollectionScreen';
import ShopScreen from '@/components/layout/ShopScreen';
import SpreadListScreen from '@/components/layout/SpreadListScreen';
import BottomNav from '@/components/layout/BottomNav';
import LoadingScreen from '@/components/ui/LoadingScreen';
import StarField from '@/components/ui/StarField';
import SolarSystem from '@/components/ui/SolarSystem';
import ManaModal from '@/components/ui/ManaModal';

const FIRST_LAUNCH_MANA = 200;

function detectLocale(langCode?: string): 'ru' | 'uk' | 'en' {
  if (langCode === 'uk') return 'uk';
  if (langCode === 'ru' || langCode === 'be') return 'ru';
  return 'en';
}

export default function App() {
  const { currentScreen, isLoading, setUser, setLocale, setLoading, setHistory, user } = useAppStore();
  const isPremium = user?.isPremium ?? false;

  // Scroll to top on every screen change
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

  useEffect(() => {
    const init = async () => {
      const tg = (window as any).Telegram?.WebApp;

      // Determine first launch and initial mana
      let mana = loadMana();
      const firstTime = isFirstLaunch();
      if (firstTime) {
        mana = FIRST_LAUNCH_MANA;
        saveMana(mana);
        markLaunched();
      }

      const channelSubscribed = isChannelBonusClaimed();

      if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0a0a1a');
        tg.setBackgroundColor('#0a0a1a');

        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          try {
            const res = await fetch('/api/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                initData: tg.initData,
                telegramId: tgUser.id,
                firstName: tgUser.first_name,
                username: tgUser.username,
                languageCode: tgUser.language_code,
                startParam: tg.initDataUnsafe?.start_param || '',
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const detectedLocale = data.locale || detectLocale(tgUser.language_code);
              setUser({
                telegramId: tgUser.id,
                firstName: tgUser.first_name,
                locale: detectedLocale,
                subscription: data.subscription || 'none',
                isPremium: data.isPremium || false,
                premiumExpiresAt: data.premiumExpiresAt || null,
                premiumDaysLeft: data.premiumDaysLeft || 0,
                streakDays: data.streakDays || 0,
                freeReadsLeft: data.freeReadsLeft || 0,
                bonusReads: data.bonusReads || 0,
                referralCount: data.referralCount || 0,
                cardCollection: data.cardCollection || [],
                mana: data.mana ?? mana,
                channelSubscribed: data.channelSubBonus || channelSubscribed,
              });
              setLocale(detectedLocale);

              // Fetch reading history from DB
              try {
                const histRes = await fetch(`/api/reading?initData=${encodeURIComponent(tg.initData)}`);
                if (histRes.ok) {
                  const histData = await histRes.json();
                  if (histData.readings) setHistory(histData.readings);
                }
              } catch { /* history fetch failed, non-critical */ }
            } else {
              const detectedLocale = detectLocale(tgUser.language_code);
              setUser({
                telegramId: tgUser.id,
                firstName: tgUser.first_name,
                locale: detectedLocale,
                subscription: 'none',
                isPremium: false,
                premiumExpiresAt: null,
                premiumDaysLeft: 0,
                streakDays: 0,
                freeReadsLeft: 3,
                bonusReads: 0,
                referralCount: 0,
                cardCollection: [],
                mana,
                channelSubscribed,
              });
              setLocale(detectedLocale);
            }
          } catch (err) {
            console.warn('Init fetch failed, using fallback:', err);
            setUser({
              telegramId: tgUser.id,
              firstName: tgUser.first_name,
              locale: 'ru',
              subscription: 'none',
              isPremium: false,
              premiumExpiresAt: null,
              premiumDaysLeft: 0,
              streakDays: 0,
              freeReadsLeft: 3,
              bonusReads: 0,
              referralCount: 0,
              cardCollection: [],
              mana,
              channelSubscribed,
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
          isPremium: false,
          premiumExpiresAt: null,
          premiumDaysLeft: 0,
          streakDays: 3,
          freeReadsLeft: 3,
          bonusReads: 1,
          referralCount: 0,
          cardCollection: [0, 1, 2, 5, 8],
          mana,
          channelSubscribed,
        });
      }

      // Preload critical images so nothing flickers after loading screen
      const preloadImages = [
        '/ui/card-of-day-header.webp',
        '/ui/card-of-day.png',
        '/ui/nav/home.png',
        '/ui/nav/tarot.png',
        '/ui/nav/esoteric.png',
        '/ui/nav/collection.png',
        '/ui/nav/shop.png',
        '/ui/nav/profile.png',
      ];

      await Promise.all([
        // Minimum splash screen time
        new Promise((r) => setTimeout(r, 3500)),
        // Preload all critical images
        ...preloadImages.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new window.Image();
              img.onload = () => resolve();
              img.onerror = () => resolve(); // don't block on error
              img.src = src;
            }),
        ),
      ]);

      setLoading(false);
    };

    init();
  }, [setUser, setLocale, setLoading]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col bg-mystic-bg relative">
      {/* Premium mystical frame overlay */}
      {isPremium && (
        <>
          <div className="fixed inset-0 pointer-events-none z-50"
            style={{
              boxShadow: 'inset 0 0 50px rgba(123,45,142,0.06), inset 0 0 100px rgba(30,58,95,0.05), inset 0 0 150px rgba(196,163,90,0.03)',
              border: '1.5px solid rgba(123,45,142,0.12)',
              borderRadius: '0',
            }}
          />
          <div className="fixed top-0 left-0 right-0 h-16 pointer-events-none z-50 bg-gradient-to-b from-mystic-purple/5 to-transparent" />
          <div className="fixed bottom-0 left-0 right-0 h-16 pointer-events-none z-50 bg-gradient-to-t from-mystic-purple/4 to-transparent" />
          <div className="fixed top-0 bottom-0 left-0 w-2 pointer-events-none z-50 bg-gradient-to-r from-mystic-purple/5 to-transparent" />
          <div className="fixed top-0 bottom-0 right-0 w-2 pointer-events-none z-50 bg-gradient-to-l from-mystic-purple/5 to-transparent" />
        </>
      )}
      <StarField />
      <SolarSystem />
      <main className="flex-1 pb-20 relative z-10">
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'tarot' && <SpreadListScreen category="tarot" />}
        {currentScreen === 'esoteric' && <SpreadListScreen category="esoteric" />}
        {currentScreen === 'spread' && <SpreadScreen />}
        {currentScreen === 'reading' && <ReadingScreen />}
        {currentScreen === 'history' && <HistoryScreen />}
        {currentScreen === 'profile' && <ProfileScreen />}
        {currentScreen === 'collection' && <CollectionScreen />}
        {currentScreen === 'shop' && <ShopScreen />}
      </main>
      <BottomNav />
      <ManaModal />
    </div>
  );
}
