/**
 * Global app state (Zustand)
 * Manages user, locale, navigation, reading state
 */

import { create } from 'zustand';
import type { SpreadConfig } from '@/data/spreads';

type Locale = 'ru' | 'uk';

interface UserState {
  telegramId: number | null;
  firstName: string;
  locale: Locale;
  subscription: 'none' | 'BASIC' | 'PREMIUM' | 'VIP';
  streakDays: number;
  freeReadsLeft: number;
  bonusReads: number;
  cardCollection: number[];
}

interface ReadingCard {
  id: number;
  name: string;
  reversed: boolean;
  image: string;
  keywords: string[];
}

interface ReadingResult {
  id?: string;
  spreadId: string;
  cards: ReadingCard[];
  interpretation: string;
  createdAt: string;
  question?: string;
}

type Screen = 'home' | 'spread' | 'reading' | 'history' | 'profile' | 'collection' | 'shop';

interface AppState {
  // Core
  user: UserState | null;
  locale: Locale;
  isLoading: boolean;
  currentScreen: Screen;
  previousScreen: Screen;

  // Reading flow
  selectedSpread: SpreadConfig | null;
  currentReading: ReadingResult | null;
  isGenerating: boolean;
  readingHistory: ReadingResult[];

  // Actions
  setUser: (user: UserState) => void;
  setLocale: (locale: Locale) => void;
  setLoading: (loading: boolean) => void;
  setScreen: (screen: Screen) => void;
  goBack: () => void;
  selectSpread: (spread: SpreadConfig) => void;
  setCurrentReading: (reading: ReadingResult | null) => void;
  setGenerating: (g: boolean) => void;
  addToHistory: (reading: ReadingResult) => void;
  setHistory: (readings: ReadingResult[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  locale: 'ru',
  isLoading: true,
  currentScreen: 'home',
  previousScreen: 'home',
  selectedSpread: null,
  currentReading: null,
  isGenerating: false,
  readingHistory: [],

  setUser: (user) => set({ user }),
  setLocale: (locale) => set({ locale }),
  setLoading: (isLoading) => set({ isLoading }),
  setScreen: (screen) => set((s) => ({ currentScreen: screen, previousScreen: s.currentScreen })),
  goBack: () => set((s) => ({ currentScreen: s.previousScreen, previousScreen: 'home' })),
  selectSpread: (spread) => set({ selectedSpread: spread, currentScreen: 'spread' }),
  setCurrentReading: (reading) => set({ currentReading: reading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  addToHistory: (reading) => set((s) => ({ readingHistory: [reading, ...s.readingHistory] })),
  setHistory: (readingHistory) => set({ readingHistory }),
}));
