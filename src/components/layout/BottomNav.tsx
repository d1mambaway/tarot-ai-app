'use client';

import { useAppStore } from '@/store/app-store';
import ManaIcon from '@/components/ui/ManaIcon';

const NAV_ITEMS = [
  { screen: 'home' as const, icon: '🏠', label: { ru: 'Главная', uk: 'Головна' } },
  { screen: 'history' as const, icon: '📜', label: { ru: 'История', uk: 'Історія' } },
  { screen: 'collection' as const, icon: '🃏', label: { ru: 'Колоды', uk: 'Колоди' } },
  { screen: 'shop' as const, icon: 'mana', label: { ru: 'Магазин', uk: 'Магазин' } },
  { screen: 'profile' as const, icon: '👤', label: { ru: 'Профиль', uk: 'Профіль' } },
];

export default function BottomNav() {
  const { currentScreen, locale, setScreen } = useAppStore();
  const l = locale || 'ru';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-mystic-card/95 backdrop-blur-md border-t border-mystic-accent/20 z-50">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.screen}
            onClick={() => setScreen(item.screen)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors
              ${currentScreen === item.screen ? 'text-mystic-accent' : 'text-mystic-muted'}`}
          >
            {item.icon === 'mana' ? (
              <ManaIcon size="sm" className="w-[18px] h-[18px]" />
            ) : (
              <span className="text-lg">{item.icon}</span>
            )}
            <span className="text-[10px]">{item.label[l]}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
