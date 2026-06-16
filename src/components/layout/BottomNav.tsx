'use client';

import Image from 'next/image';
import { useAppStore } from '@/store/app-store';

type L = 'ru' | 'uk' | 'en';

const NAV_ITEMS = [
  { screen: 'home' as const, icon: '/ui/nav/home.png', label: { ru: 'Главная', uk: 'Головна', en: 'Home' } },
  { screen: 'history' as const, icon: '/ui/nav/history.png', label: { ru: 'История', uk: 'Історія', en: 'History' } },
  { screen: 'collection' as const, icon: '/ui/nav/collection.png', label: { ru: 'Колоды', uk: 'Колоди', en: 'Deck' } },
  { screen: 'shop' as const, icon: '/ui/nav/shop.png', label: { ru: 'Магазин', uk: 'Магазин', en: 'Shop' } },
  { screen: 'profile' as const, icon: '/ui/nav/profile.png', label: { ru: 'Профиль', uk: 'Профіль', en: 'Profile' } },
];

export default function BottomNav() {
  const { currentScreen, locale, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-mystic-card/95 backdrop-blur-md border-t border-mystic-accent/20 z-50">
      <div className="flex items-end justify-around px-1 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.screen;
          const isShop = item.screen === 'shop';

          return (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              className="flex flex-col items-center gap-[2px] min-w-[56px] px-1 py-0.5 rounded-lg transition-all"
            >
              {/* Icon — fixed 28px box for perfect alignment */}
              <span className="flex items-center justify-center w-7 h-7 relative">
                <Image
                  src={item.icon}
                  alt={item.label.en}
                  width={28}
                  height={28}
                  className={`object-contain transition-all ${
                    isActive ? 'drop-shadow-[0_0_6px_rgba(196,163,90,0.5)]' : 'opacity-60'
                  }`}
                  unoptimized
                />
              </span>

              {/* Label */}
              {isShop ? (
                <span
                  className="text-[10px] font-bold leading-tight bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #d4af37, #f0d060, #c4a35a, #f0d060, #d4af37)',
                    backgroundSize: '200% 100%',
                    animation: 'goldShimmer 3s linear infinite',
                  }}
                >
                  {item.label[l]}
                </span>
              ) : (
                <span
                  className={`text-[10px] font-semibold leading-tight ${
                    isActive
                      ? 'bg-clip-text text-transparent bg-gradient-to-r from-mystic-purple via-mystic-accent to-mystic-blue'
                      : 'text-mystic-muted'
                  }`}
                >
                  {item.label[l]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Golden shimmer keyframes */}
      <style jsx>{`
        @keyframes goldShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </nav>
  );
}
