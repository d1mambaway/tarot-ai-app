/**
 * Global app state (Zustand)
 * Manages user, locale, current reading, UI state
 */

import { create } from 'zustand';

type Locale = 'ru' | 'uk';

interface UserState {
  telegramId: number | null;
  firstName: string;
  locale: Locale;
  subscription: 'none' | 'BASIC' | 'PREMIUM' | 'VIP';
  streakDays: number;
  freeReadsLeft: number;
  bonusReads: number;
  cardCollection: number[]; // card IDs
}

interface AppState {
  user: UserState | null;
  locale: Locale;
  isLoading: boolean;
  currentScreen: 'home' | 'spread' | 'reading' | 'history' | 'profile' | 'collection' | 'shop';

  // Actions
  setUser: (user: UserState) => void;
  setLocale: (locale: Locale) => void;
  setLoading: (loading: boolean) => void;
  setScreen: (screen: AppState['currentScreen']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  locale: 'ru',
  isLoading: true,
  currentScreen: 'home',

  setUser: (user) => set({ user }),
  setLocale: (locale) => set({ locale }),
  setLoading: (isLoading) => set({ isLoading }),
  setScreen: (currentScreen) => set({ currentScreen }),
}));
