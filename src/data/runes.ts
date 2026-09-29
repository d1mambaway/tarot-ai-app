/**
 * Elder Futhark — 24 runes for the «Руны» spread.
 *
 * Before, the runes spread silently drew three TAROT cards and asked the model
 * to read them as runes. Now it draws real runes. Nine runes are symmetric and
 * have no reversed (merkstave) position, so they are never drawn reversed.
 */

import { randomInt, shuffle } from './tarot-cards';

type L3 = { ru: string; uk: string; en: string };

export interface Rune {
  id: string;
  glyph: string;
  name: L3;
  meaning: L3;
  /** Symmetric runes cannot be reversed */
  reversible: boolean;
}

export const RUNES: Rune[] = [
  { id: 'fehu', glyph: 'ᚠ', name: { ru: 'Феху', uk: 'Феху', en: 'Fehu' }, meaning: { ru: 'богатство, ресурсы, заработанное', uk: 'багатство, ресурси, зароблене', en: 'wealth, resources, earnings' }, reversible: true },
  { id: 'uruz', glyph: 'ᚢ', name: { ru: 'Уруз', uk: 'Уруз', en: 'Uruz' }, meaning: { ru: 'сила, здоровье, выносливость', uk: 'сила, здоров’я, витривалість', en: 'strength, health, endurance' }, reversible: true },
  { id: 'thurisaz', glyph: 'ᚦ', name: { ru: 'Турисаз', uk: 'Турисаз', en: 'Thurisaz' }, meaning: { ru: 'препятствие, защита, конфликт', uk: 'перешкода, захист, конфлікт', en: 'obstacle, defence, conflict' }, reversible: true },
  { id: 'ansuz', glyph: 'ᚨ', name: { ru: 'Ансуз', uk: 'Ансуз', en: 'Ansuz' }, meaning: { ru: 'слово, послание, мудрость', uk: 'слово, послання, мудрість', en: 'word, message, wisdom' }, reversible: true },
  { id: 'raidho', glyph: 'ᚱ', name: { ru: 'Райдо', uk: 'Райдо', en: 'Raidho' }, meaning: { ru: 'путь, движение, правильный ритм', uk: 'шлях, рух, правильний ритм', en: 'journey, movement, right rhythm' }, reversible: true },
  { id: 'kenaz', glyph: 'ᚲ', name: { ru: 'Кеназ', uk: 'Кеназ', en: 'Kenaz' }, meaning: { ru: 'огонь, ясность, творчество', uk: 'вогонь, ясність, творчість', en: 'torch, clarity, creativity' }, reversible: true },
  { id: 'gebo', glyph: 'ᚷ', name: { ru: 'Гебо', uk: 'Гебо', en: 'Gebo' }, meaning: { ru: 'дар, обмен, партнёрство', uk: 'дар, обмін, партнерство', en: 'gift, exchange, partnership' }, reversible: false },
  { id: 'wunjo', glyph: 'ᚹ', name: { ru: 'Вуньо', uk: 'Вуньо', en: 'Wunjo' }, meaning: { ru: 'радость, гармония, успех', uk: 'радість, гармонія, успіх', en: 'joy, harmony, success' }, reversible: true },
  { id: 'hagalaz', glyph: 'ᚺ', name: { ru: 'Хагалаз', uk: 'Хагалаз', en: 'Hagalaz' }, meaning: { ru: 'разрушение старого, испытание', uk: 'руйнування старого, випробування', en: 'disruption, trial, clearing' }, reversible: false },
  { id: 'nauthiz', glyph: 'ᚾ', name: { ru: 'Наутиз', uk: 'Наутіз', en: 'Nauthiz' }, meaning: { ru: 'нужда, ограничение, терпение', uk: 'потреба, обмеження, терпіння', en: 'need, constraint, patience' }, reversible: false },
  { id: 'isa', glyph: 'ᛁ', name: { ru: 'Иса', uk: 'Іса', en: 'Isa' }, meaning: { ru: 'лёд, остановка, пауза', uk: 'лід, зупинка, пауза', en: 'ice, standstill, pause' }, reversible: false },
  { id: 'jera', glyph: 'ᛃ', name: { ru: 'Йера', uk: 'Йера', en: 'Jera' }, meaning: { ru: 'урожай, цикл, награда за труд', uk: 'врожай, цикл, нагорода за працю', en: 'harvest, cycle, reward for effort' }, reversible: false },
  { id: 'eihwaz', glyph: 'ᛇ', name: { ru: 'Эйваз', uk: 'Ейваз', en: 'Eihwaz' }, meaning: { ru: 'стойкость, переход, защита', uk: 'стійкість, перехід, захист', en: 'resilience, transition, protection' }, reversible: false },
  { id: 'perthro', glyph: 'ᛈ', name: { ru: 'Перт', uk: 'Перт', en: 'Perthro' }, meaning: { ru: 'тайна, судьба, скрытое', uk: 'таємниця, доля, приховане', en: 'mystery, fate, the hidden' }, reversible: true },
  { id: 'algiz', glyph: 'ᛉ', name: { ru: 'Альгиз', uk: 'Альгіз', en: 'Algiz' }, meaning: { ru: 'защита, покровительство, чутьё', uk: 'захист, заступництво, чуття', en: 'protection, guardianship, instinct' }, reversible: true },
  { id: 'sowilo', glyph: 'ᛊ', name: { ru: 'Соулу', uk: 'Соулу', en: 'Sowilo' }, meaning: { ru: 'солнце, победа, жизненная сила', uk: 'сонце, перемога, життєва сила', en: 'sun, victory, vitality' }, reversible: false },
  { id: 'tiwaz', glyph: 'ᛏ', name: { ru: 'Тейваз', uk: 'Тейваз', en: 'Tiwaz' }, meaning: { ru: 'воин, справедливость, решимость', uk: 'воїн, справедливість, рішучість', en: 'warrior, justice, resolve' }, reversible: true },
  { id: 'berkano', glyph: 'ᛒ', name: { ru: 'Беркана', uk: 'Беркана', en: 'Berkano' }, meaning: { ru: 'рост, забота, новое начало', uk: 'зростання, турбота, новий початок', en: 'growth, nurture, new beginning' }, reversible: true },
  { id: 'ehwaz', glyph: 'ᛖ', name: { ru: 'Эваз', uk: 'Еваз', en: 'Ehwaz' }, meaning: { ru: 'движение вперёд, доверие, союз', uk: 'рух уперед, довіра, союз', en: 'progress, trust, alliance' }, reversible: true },
  { id: 'mannaz', glyph: 'ᛗ', name: { ru: 'Манназ', uk: 'Манназ', en: 'Mannaz' }, meaning: { ru: 'человек, окружение, самосознание', uk: 'людина, оточення, самосвідомість', en: 'self, community, awareness' }, reversible: true },
  { id: 'laguz', glyph: 'ᛚ', name: { ru: 'Лагуз', uk: 'Лагуз', en: 'Laguz' }, meaning: { ru: 'вода, интуиция, поток', uk: 'вода, інтуїція, потік', en: 'water, intuition, flow' }, reversible: true },
  { id: 'ingwaz', glyph: 'ᛜ', name: { ru: 'Ингуз', uk: 'Інгуз', en: 'Ingwaz' }, meaning: { ru: 'завершение, плодородие, внутренний рост', uk: 'завершення, родючість, внутрішнє зростання', en: 'completion, fertility, inner growth' }, reversible: false },
  { id: 'dagaz', glyph: 'ᛞ', name: { ru: 'Дагаз', uk: 'Дагаз', en: 'Dagaz' }, meaning: { ru: 'рассвет, прорыв, перемена', uk: 'світанок, прорив, зміна', en: 'dawn, breakthrough, change' }, reversible: false },
  { id: 'othala', glyph: 'ᛟ', name: { ru: 'Одал', uk: 'Одал', en: 'Othala' }, meaning: { ru: 'наследие, дом, род', uk: 'спадщина, дім, рід', en: 'heritage, home, lineage' }, reversible: true },
];

export type DrawnRune = Rune & { reversed: boolean };

/** Draw unique runes; only reversible runes can come out reversed (~35%) */
export function drawRunes(count: number): DrawnRune[] {
  return shuffle(RUNES).slice(0, count).map((r) => ({
    ...r,
    reversed: r.reversible && randomInt(100) < 35,
  }));
}
