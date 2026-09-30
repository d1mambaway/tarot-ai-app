/**
 * Image generation via Cloudflare Workers AI (FLUX.2 [klein] 4B)
 */

import { cfGenerateImage } from './cloudflare-image';

/**
 * Generate an illustration for a reading.
 * Returns a base64 data URL or null on failure.
 */
export async function generateImage(prompt: string, width = 768, height = 512, timeoutMs = 25_000): Promise<string | null> {
  const r = await cfGenerateImage(prompt, { width, height, timeoutMs });
  if (!r.ok) {
    if (r.stage !== 'no_key') console.warn('generateImage: Cloudflare failed', r.stage, r.status ?? '', JSON.stringify(r.detail ?? '').slice(0, 300));
    return null;
  }
  return `data:${r.contentType};base64,${r.base64}`;
}

/**
 * Build an image prompt for a given reading context.
 * Returns null if the spread type doesn't warrant an image.
 */
export function buildImagePrompt(params: {
  spreadId: string;
  cards?: { name: string; reversed: boolean }[];
  question?: string;
  extraContext?: string;
}): string | null {
  const { spreadId, cards, question, extraContext } = params;
  const mainCard = cards?.[0]?.name || '';

  // Matches the card deck: old-master oil painting
  const style = 'classical oil painting like an old master, rich jewel tones (deep crimson, emerald, midnight blue, warm gold), dramatic chiaroscuro, visible brushstrokes, no text, no letters';

  switch (spreadId) {
    case 'card_of_day':
      return `Tarot card "${mainCard}" brought to life as a mystical scene, ${style}`;

    case 'celtic_cross':
      return `Epic Celtic cross tarot spread layout with 10 glowing cards arranged in cross and tower formation on ancient stone altar, candles, mystical symbols, ${style}`;

    case 'dream':
      return `Dreamlike surreal scene inspired by: ${(question || 'mysterious dream').slice(0, 120)}, floating elements, ethereal fog, ${style}`;

    case 'past_lives':
      return `Ancient soul reincarnation scene, person standing between two worlds — past life and present, portal of golden light, memories swirling, ${style}`;

    case 'compatibility':
      return `Two celestial souls connected by streams of cosmic energy, yin and yang, intertwined auras of purple and gold, cosmic love, ${style}`;

    case 'numerology': {
      const digits = (extraContext || '').replace(/\D/g, '');
      let num = digits.split('').reduce((a: number, d: string) => a + parseInt(d), 0);
      while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
        num = num.toString().split('').reduce((a: number, d: string) => a + parseInt(d), 0);
      }
      const n = num || 7;
      return `Large golden number ${n} floating in cosmic space, sacred geometry patterns around it, dark purple and deep blue nebula background, glowing stars, mystical atmosphere, ${style}`;
    }

    case 'runes':
      return `Ancient Norse rune stones glowing with magical energy on a wooden table, Viking mystical atmosphere, northern lights above, ${style}`;

    case 'horoscope':
      return `Zodiac wheel spinning among stars, celestial observatory with planets aligned, astrology mystical scene, cosmic, ${style}`;

    case 'relationship':
    case 'what_they_think':
      return `Two silhouettes facing each other with tarot cards floating between them, emotional energy, ${style}`;

    case 'natal_chart':
      return `Magnificent natal birth chart wheel floating in deep cosmic space, zodiac signs glowing around the circle, planetary symbols connected by golden aspect lines, nebula and stars in background, sacred geometry, celestial map of destiny, ${style}`;

    case 'love_future':
      return `A lone figure at a candlelit window at dusk, a distant silhouette approaching along a road through blossoming trees, a red thread of fate glowing between them, romantic longing, ${style}`;

    case 'ex_return':
      return `Two figures on opposite banks of a misty river at twilight, a half-broken stone bridge between them, a single lantern glowing on the bridge, bittersweet memories, ${style}`;

    case 'two_paths':
      return `A traveller at a crossroads in an ancient forest, one path lit by warm golden sunset, the other by cool silver moonlight, a stone signpost with blank arms, ${style}`;

    case 'card_advice':
      return `A wise old hand holding a single tarot card face down above a candle on a wooden table, an open book and dried herbs, quiet counsel, ${style}`;

    case 'year_ahead':
      return `A great wheel of the year with twelve seasonal scenes from snowy winter to golden autumn arranged in a circle around a glowing sun, allegorical Renaissance fresco, ${style}`;

    case 'new_moon':
      return `A dark new moon sky, a woman planting a glowing seed in black earth by candlelight, a thin silver crescent just appearing on the horizon, quiet ritual, ${style}`;

    case 'full_moon':
      return `An enormous luminous full moon over a still lake, a figure on the shore releasing a paper lantern into the night, silver light on the water, ${style}`;

    default:
      return null;
  }
}
