/**
 * Image generation via Pollinations AI (FLUX model)
 */

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

/**
 * Generate an image via Pollinations AI.
 * Returns base64 data URL or null on failure.
 */
export async function generateImage(prompt: string, width = 768, height = 512): Promise<string | null> {
  if (!POLLINATIONS_API_KEY) return null;

  try {
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${POLLINATIONS_API_KEY}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
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

  const style = 'mystical dark fantasy art, purple and gold ethereal lighting, detailed digital painting, magical atmosphere, no text, no letters, no words';

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
      return `Large golden number ${n} floating in cosmic space, sacred geometry patterns around it, dark purple and deep blue nebula background, glowing stars, mystical atmosphere, digital art, ${style}`;
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

    default:
      return null;
  }
}
