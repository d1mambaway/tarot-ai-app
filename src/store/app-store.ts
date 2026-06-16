/**
 * Global app state (Zustand)
 * Manages user, locale, navigation, reading state, mana economy
 */

import { create } from 'zustand';
import type { SpreadConfig } from '@/data/spreads';

type Locale = 'ru' | 'uk' | 'en';

interface UserState {
  telegramId: number | null;
  firstName: string;
  locale: Locale;
  subscription: 'none' | 'BASIC' | 'PREMIUM' | 'VIP';
  streakDays: number;
  freeReadsLeft: number;
  bonusReads: number;
  cardCollection: number[];
  mana: number;
  channelSubscribed: boolean;
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

  // Mana modal
  showManaModal: boolean;
  manaNeeded: number;

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

  // Mana
  spendMana: (amount: number) => boolean;
  addMana: (amount: number) => void;
  setManaModal: (show: boolean, needed?: number) => void;
  setChannelSubscribed: (serverMana?: number) => void;
}

// ─── LocalStorage helpers for mana persistence ───────────────────────────────

function loadMana(): number {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem('mk_mana');
  return val ? parseInt(val, 10) : 0;
}

function saveMana(mana: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mk_mana', String(mana));
  }
}

function isFirstLaunch(): boolean {
  if (typeof window === 'undefined') return true;
  return !localStorage.getItem('mk_launched');
}

function markLaunched() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mk_launched', '1');
  }
}

function isChannelBonusClaimed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('mk_channel_bonus') === '1';
}

function markChannelBonusClaimed() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mk_channel_bonus', '1');
  }
}

export { isFirstLaunch, markLaunched, loadMana, saveMana, isChannelBonusClaimed, markChannelBonusClaimed };

// ─── Store ───────────────────────────────────────────────────────────────────

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
  showManaModal: false,
  manaNeeded: 0,

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

  // Mana
  spendMana: (amount) => {
    const { user } = get();
    if (!user || user.mana < amount) return false;
    const newMana = user.mana - amount;
    saveMana(newMana);
    set({ user: { ...user, mana: newMana } });
    return true;
  },

  addMana: (amount) => {
    const { user } = get();
    if (!user) return;
    const newMana = user.mana + amount;
    saveMana(newMana);
    set({ user: { ...user, mana: newMana } });
  },

  setManaModal: (show, needed = 0) => set({ showManaModal: show, manaNeeded: needed }),

  setChannelSubscribed: (serverMana?: number) => {
    const { user } = get();
    if (!user) return;
    markChannelBonusClaimed();
    // Use server mana if available (source of truth), otherwise fallback to client +1000
    const newMana = serverMana ?? user.mana + 1000;
    saveMana(newMana);
    set({ user: { ...user, channelSubscribed: true, mana: newMana } });
  },
}));
