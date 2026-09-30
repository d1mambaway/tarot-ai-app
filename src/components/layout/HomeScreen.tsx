'use client';

import { useState, useEffect } from 'react';
import { useAppStore, isProfilePromptPending, clearProfilePrompt } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaBalance from '@/components/ui/ManaBalance';
import CardOfDaySection from '@/components/ui/CardOfDaySection';
import MoonPhaseWidget from '@/components/ui/MoonPhaseWidget';
import QuoteCard from '@/components/ui/QuoteCard';
import HomePromo from '@/components/ui/HomePromo';
import { daysLabel } from '@/lib/plural';
import SupportModal from '@/components/ui/SupportModal';
import ProfileSetupModal from '@/components/ui/ProfileSetupModal';

type L = 'ru' | 'uk' | 'en';

// ─── Translations ──────────────────────────────────────────────────────────

const T = {
  greeting: { ru: 'Привет', uk: 'Вітаю', en: 'Hello' },
  profileHint: {
    ru: 'Укажите имя и пол — расклад станет персональным',
    uk: 'Вкажіть ім\u2019я та стать — розклад стане персональним',
    en: 'Add your name and gender for personalized readings',
  },
};

// ─── Main HomeScreen ───────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user, locale, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;
  const [showSupport, setShowSupport] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Gender is what makes the oracle address the user in the right grammatical
  // form, so "profile filled in" means gender is set. Once it is, the badge and
  // the popup disappear for good.
  const needsProfile = !!user && !user.gender;

  // Lets the loading screen know it can fade out now
  useEffect(() => {
    const t = requestAnimationFrame(() => window.dispatchEvent(new Event('mk:home-ready')));
    return () => cancelAnimationFrame(t);
  }, []);

  // New users get the popup once, right after the first launch.
  // Existing users are never interrupted — they only see the "!" badge.
  useEffect(() => {
    if (needsProfile && isProfilePromptPending()) {
      clearProfilePrompt();
      setShowProfileSetup(true);
    }
  }, [needsProfile]);

  return (
    <div className="px-4 pt-2 pb-3 relative z-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
        <div className="flex items-center justify-between">
          {user && (
            <p className="text-[19px] leading-tight text-mystic-muted">
              {T.greeting[l]},{' '}
              {user.isPremium ? (
                <span className="premium-name">{user.displayName || user.firstName} 👑</span>
              ) : (
                user.displayName || user.firstName
              )}
              {user.streakDays > 0 && (
                <span className="ml-2 text-mystic-accent whitespace-nowrap">🔥 {daysLabel(user.streakDays, l)}</span>
              )}
            </p>
          )}
          <div className="flex items-center gap-2">
            {needsProfile && (
              <button
                onClick={() => setShowProfileSetup(true)}
                className="w-9 h-9 rounded-xl bg-mystic-card/80 border border-mystic-gold/40 flex items-center justify-center text-lg text-mystic-gold font-bold hover:border-mystic-gold/70 transition-colors animate-badge-pulse"
                aria-label={T.profileHint[l]}
                title={T.profileHint[l]}
              >
                !
              </button>
            )}
            <button
              onClick={() => setShowSupport(true)}
              className="w-9 h-9 rounded-xl bg-mystic-card/80 border border-mystic-accent/20 flex items-center justify-center text-lg hover:border-mystic-accent/40 transition-colors aura-mystic"
              aria-label="Support"
            >
              💬
            </button>
            {!user?.isPremium && (
              <button
                onClick={() => setScreen('shop')}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-mystic-gold/20 to-mystic-accent/20 border border-mystic-gold/30 flex items-center justify-center text-lg hover:border-mystic-gold/50 transition-colors animate-badge-pulse"
                aria-label="Get Premium"
              >
                👑
              </button>
            )}
            <ManaBalance onClick={() => setScreen('shop')} />
          </div>
        </div>
      </motion.div>

      {/* Moon Phase */}
      <MoonPhaseWidget locale={l} />

      {/* Card of the Day — shared component */}
      <CardOfDaySection />

      {/* Quote of the launch */}
      <QuoteCard locale={l} />

      {/* Starter offer / premium pitch / premium status */}
      <HomePromo />
      <SupportModal open={showSupport} onClose={() => setShowSupport(false)} />
      <ProfileSetupModal open={showProfileSetup} onClose={() => setShowProfileSetup(false)} />
    </div>
  );
}
