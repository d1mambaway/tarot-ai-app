'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore, loadSavedLocale, isFirstLaunch, markLaunched, loadMana, saveMana, isChannelBonusClaimed, markProfilePromptPending } from '@/store/app-store';
import BottomNav from '@/components/layout/BottomNav';
import LoadingScreen from '@/components/ui/LoadingScreen';
import StarField from '@/components/ui/StarField';
import SolarSystem from '@/components/ui/SolarSystem';
import ManaModal from '@/components/ui/ManaModal';

// Only one screen is ever visible at a time (currentScreen switches between
// them), so each is code-split — the first paint only pulls in Home's chunk
// instead of all 8 screens (incl. Reading, which already lazy-loads its own
// natal/matrix chart components). Same ssr:false pattern already used in
// ReadingScreen.tsx for its heavy children.
const HomeScreen = dynamic(() => import('@/components/layout/HomeScreen'), { ssr: false });
const SpreadScreen = dynamic(() => import('@/components/layout/SpreadScreen'), { ssr: false });
const ReadingScreen = dynamic(() => import('@/components/layout/ReadingScreen'), { ssr: false });
const HistoryScreen = dynamic(() => import('@/components/layout/HistoryScreen'), { ssr: false });
const ProfileScreen = dynamic(() => import('@/components/layout/ProfileScreen'), { ssr: false });
const CollectionScreen = dynamic(() => import('@/components/layout/CollectionScreen'), { ssr: false });
const ShopScreen = dynamic(() => import('@/components/layout/ShopScreen'), { ssr: false });
const SpreadListScreen = dynamic(() => import('@/components/layout/SpreadListScreen'), { ssr: false });

const FIRST_LAUNCH_MANA = 200;

function detectLocale(langCode?: string): 'ru' | 'uk' | 'en' {
  if (langCode === 'uk') return 'uk';
  if (langCode === 'ru' || langCode === 'be') return 'ru';
  return 'en';
}

export default function App() {
  const { currentScreen, isLoading, setUser, setLocale, setLoading, setHistory, user } = useAppStore();
  const isPremium = user?.isPremium ?? false;
  // Real loading progress for the splash (0..1) and whether it is still on screen
  const [progress, setProgress] = useState(0.08);
  const [splash, setSplash] = useState(true);
  const hideSplash = useCallback(() => setSplash(false), []);
  // The splash leaves only once the home screen has actually painted
  // (its code is split into a separate chunk), with a safety timeout
  const [homeReady, setHomeReady] = useState(false);
  useEffect(() => {
    const on = () => setHomeReady(true);
    window.addEventListener('mk:home-ready', on);
    return () => window.removeEventListener('mk:home-ready', on);
  }, []);
  useEffect(() => {
    if (isLoading) return;
    const t = setTimeout(() => setHomeReady(true), 1200);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Scroll to top on every screen change
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

  // Telegram's native Back button: without it the Android back gesture closes
  // the whole Mini App instead of going to the previous screen.
  const isGenerating = useAppStore((s) => s.isGenerating);
  useEffect(() => {
    const bb = (window as any).Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const onBack = () => {
      const { screenHistory, goBack, navigateTab, isGenerating: busy } = useAppStore.getState();
      if (busy) return; // don't leave a reading that is being generated
      if (screenHistory.length > 0) goBack();
      else navigateTab('home');
    };
    if (currentScreen === 'home') bb.hide();
    else bb.show();
    bb.onClick(onBack);
    return () => bb.offClick(onBack);
  }, [currentScreen]);

  // Ask before closing while a paid reading is being generated
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.enableClosingConfirmation) return;
    if (isGenerating) tg.enableClosingConfirmation();
    else tg.disableClosingConfirmation();
  }, [isGenerating]);

  useEffect(() => {
    const init = async () => {
      const tg = (window as any).Telegram?.WebApp;
      const startedAt = Date.now();
      // Fetch the home screen code while the splash is showing,
      // and do the moon math now so the home screen paints instantly
      const homeChunk = import('@/components/layout/HomeScreen').catch(() => undefined);
      const moonWarm = import('@/lib/moon').then((m) => m.warmMoonInfo()).catch(() => undefined);

      // Determine first launch and initial mana
      let mana = loadMana();
      const firstTime = isFirstLaunch();
      if (firstTime) {
        mana = FIRST_LAUNCH_MANA;
        saveMana(mana);
        markLaunched();
        // Ask for name + gender right after the first launch
        markProfilePromptPending();
      }

      const channelSubscribed = isChannelBonusClaimed();

      if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0a0a1a');
        tg.setBackgroundColor('#0a0a1a');
        // Without this, any mostly-vertical drag anywhere in the app (a
        // scroll, a swipe gesture) can get picked up by Telegram's own
        // swipe-to-minimize instead of our own UI — most noticeable on the
        // grimoire's page-turn swipe, which is never perfectly horizontal
        // in practice. Bot API 7.7+; guarded for older clients.
        if (typeof tg.disableVerticalSwipes === 'function') {
          tg.disableVerticalSwipes();
        }

        const tgUser = tg.initDataUnsafe?.user;
        setProgress(0.25);
        if (tgUser) {
          try {
            // A slow network must not keep the splash forever
            const ctrl = new AbortController();
            const abortTimer = setTimeout(() => ctrl.abort(), 9000);
            const res = await fetch('/api/user', {
              signal: ctrl.signal,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                initData: tg.initData,
                telegramId: tgUser.id,
                firstName: tgUser.first_name,
                username: tgUser.username,
                languageCode: tgUser.language_code,
              }),
            }).finally(() => clearTimeout(abortTimer));

            setProgress(0.6);
            if (res.ok) {
              const data = await res.json();
              const detectedLocale = data.locale || detectLocale(tgUser.language_code);
              setUser({
                telegramId: tgUser.id,
                firstName: tgUser.first_name,
                displayName: data.displayName || null,
                gender: data.gender || null,
                birthDate: data.birthDate || null,
                zodiacSign: data.zodiacSign || null,
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
                firstReadingFree: !!data.firstReadingFree,
                premiumSaved: data.premiumSaved || 0,
                premiumBigReportAvailable: !!data.premiumBigReportAvailable,
                starterOfferEndsAt: data.starterOfferEndsAt || null,
                achievementsClaimed: data.achievementsClaimed || [],
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
              setProgress(0.8);
            } else {
              const detectedLocale = loadSavedLocale() ?? detectLocale(tgUser.language_code);
              setUser({
                telegramId: tgUser.id,
                firstName: tgUser.first_name,
                displayName: null,
                gender: null,
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
            const fallbackLocale = loadSavedLocale() ?? detectLocale(tgUser.language_code);
            setLocale(fallbackLocale);
            setUser({
              telegramId: tgUser.id,
              firstName: tgUser.first_name,
              displayName: null,
              gender: null,
              locale: fallbackLocale,
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
        // Dev mode — not inside Telegram (browser preview): keep the last language used here
        const devLocale = loadSavedLocale() ?? 'ru';
        setLocale(devLocale);
        // Browser preview only: ?demo=premium | ?demo=new to see those states
        const demo = new URLSearchParams(window.location.search).get('demo');
        setUser({
          telegramId: 0,
          firstName: 'Гость',
          displayName: null,
          gender: null,
          locale: devLocale,
          subscription: demo === 'premium' ? 'PREMIUM' : 'none',
          isPremium: demo === 'premium',
          premiumExpiresAt: null,
          premiumDaysLeft: demo === 'premium' ? 23 : 0,
          premiumSaved: demo === 'premium' ? 2340 : 0,
          premiumBigReportAvailable: demo === 'premium',
          firstReadingFree: demo === 'new',
          starterOfferEndsAt: demo === 'new' ? new Date(Date.now() + 31 * 3600_000).toISOString() : null,
          streakDays: 3,
          freeReadsLeft: 3,
          bonusReads: 1,
          referralCount: 0,
          cardCollection: [0, 1, 2, 5, 8],
          mana,
          channelSubscribed,
        });
      }

      // Browser preview only: ?demo=reading opens a sample reading
      if (!tg && new URLSearchParams(window.location.search).get('demo') === 'reading') {
        const { DEMO_READING } = await import('@/lib/demo-reading');
        const st = useAppStore.getState();
        st.setCurrentReading(DEMO_READING as any);
        st.setScreen('reading');
      }

      // Preload critical images so nothing flickers after loading screen
      const preloadImages = [
        '/ui/card-of-day-header.webp',
        '/ui/card-of-day.webp',
        '/ui/nav/home.webp',
        '/ui/nav/tarot.webp',
        '/ui/nav/esoteric.webp',
        '/ui/nav/collection.webp',
        '/ui/nav/shop.webp',
        '/ui/nav/profile.webp',
        '/ui/moon.webp',
      ];

      setProgress((p) => Math.max(p, 0.8));
      await Promise.all([
        // Short minimum so the intro animation can breathe (was a flat 3.5 s)
        new Promise((r) => setTimeout(r, Math.max(0, 1900 - (Date.now() - startedAt)))),
        homeChunk,
        moonWarm,
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

      setProgress(1);
      setLoading(false);
    };

    // Whatever happens during init, the app must open
    init()
      .catch((e) => console.warn('init failed', e))
      .finally(() => {
        setProgress(1);
        setLoading(false);
      });
  }, [setUser, setLocale, setLoading]);

  // Kept at the same place in the tree while the app mounts underneath,
  // so the splash can cross-fade out instead of vanishing
  const splashLayer = splash ? (
    <LoadingScreen
      progress={progress}
      leaving={!isLoading && (homeReady || currentScreen !== 'home')}
      onExited={hideSplash}
    />
  ) : null;

  return (
    <>
      {splashLayer}
      {!isLoading && (
        <div className={`flex min-h-screen flex-col bg-mystic-bg relative ${isPremium ? 'premium-mode' : ''}`}>
          {/* Premium gold mode: thin gold frame around the whole app */}
          {isPremium && (
            <div
              aria-hidden
              className="fixed inset-0 pointer-events-none z-50"
              style={{
                boxShadow: 'inset 0 0 0 1px rgba(212,175,55,0.28), inset 0 0 40px rgba(212,175,55,0.07)',
              }}
            />
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
      )}
    </>
  );
}
