'use client';

import { useEffect } from 'react';
import { useAppStore, isFirstLaunch, markLaunched, loadMana, saveMana, isChannelBonusClaimed } from '@/store/app-store';
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
import ManaModal from '@/components/ui/ManaModal';

const FIRST_LAUNCH_MANA = 200;

function detectLocale(langCode?: string): 'ru' | 'uk' | 'en' {
  if (langCode === 'uk') return 'uk';
  if (langCode === 'ru' || langCode === 'be') return 'ru';
  return 'en';
}

export default function App() {
  const { currentScreen, isLoading, setUser, setLocale, setLoading } = useAppStore();

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
                streakDays: data.streakDays || 0,
                freeReadsLeft: data.freeReadsLeft || 0,
                bonusReads: data.bonusReads || 0,
                referralCount: data.referralCount || 0,
                cardCollection: data.cardCollection || [],
                mana: data.mana ?? mana,
                channelSubscribed: data.channelSubBonus || channelSubscribed,
              });
              setLocale(detectedLocale);
            } else {
              const detectedLocale = detectLocale(tgUser.language_code);
              setUser({
                telegramId: tgUser.id,
                firstName: tgUser.first_name,
                locale: detectedLocale,
                subscription: 'none',
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
          } catch {
            setUser({
              telegramId: tgUser.id,
              firstName: tgUser.first_name,
              locale: 'ru',
              subscription: 'none',
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
          streakDays: 3,
          freeReadsLeft: 3,
          bonusReads: 1,
          referralCount: 0,
          cardCollection: [0, 1, 2, 5, 8],
          mana,
          channelSubscribed,
        });
      }

      // Minimum splash screen time
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
      <ManaModal />
    </div>
  );
}
