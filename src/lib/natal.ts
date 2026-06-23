/**
 * Natal chart calculation utility.
 * Uses circular-natal-horoscope-js for astronomical calculations
 * and Nominatim (OpenStreetMap) for geocoding.
 */

// @ts-expect-error — no built-in types for the default export
import { Origin, Horoscope } from 'circular-natal-horoscope-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NatalInput {
  /** Date of birth as YYYY-MM-DD */
  birthDate: string;
  /** Time of birth as HH:MM (24h) */
  birthTime: string;
  /** City name for geocoding */
  birthCity: string;
}

interface PlanetInfo {
  name: string;
  sign: string;
  house: number;
  isRetrograde: boolean;
}

interface AspectInfo {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
}

interface PointInfo {
  name: string;
  sign: string;
  house: number;
}

export interface NatalChartData {
  /** Sun sign */
  sunSign: string;
  /** Moon sign */
  moonSign: string;
  /** Ascendant (rising) sign */
  ascendant: string;
  /** Midheaven (MC) sign */
  midheaven: string;
  /** All planet placements */
  planets: PlanetInfo[];
  /** Houses and their signs */
  houses: { id: number; sign: string }[];
  /** Major aspects */
  aspects: AspectInfo[];
  /** Special points: North Node, South Node, Lilith */
  points: PointInfo[];
  /** Element balance */
  elements: { fire: number; earth: number; air: number; water: number };
  /** Retrograde planets */
  retrogrades: string[];
  /** Original input */
  input: { date: string; time: string; city: string; lat: number; lng: number };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SIGN_RU: Record<string, string> = {
  Aries: 'Овен', Taurus: 'Телец', Gemini: 'Близнецы', Cancer: 'Рак',
  Leo: 'Лев', Virgo: 'Дева', Libra: 'Весы', Scorpio: 'Скорпион',
  Sagittarius: 'Стрелец', Capricorn: 'Козерог', Aquarius: 'Водолей', Pisces: 'Рыбы',
};

const PLANET_RU: Record<string, string> = {
  sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера',
  mars: 'Марс', jupiter: 'Юпитер', saturn: 'Сатурн',
  uranus: 'Уран', neptune: 'Нептун', pluto: 'Плутон', chiron: 'Хирон',
};

const ASPECT_RU: Record<string, string> = {
  conjunction: 'Соединение', opposition: 'Оппозиция', trine: 'Тригон',
  square: 'Квадратура', sextile: 'Секстиль', quincunx: 'Квинконс',
};

const ELEMENT_MAP: Record<string, 'fire' | 'earth' | 'air' | 'water'> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
};

// ─── Geocoding ───────────────────────────────────────────────────────────────

async function geocodeCity(city: string): Promise<{ lat: number; lng: number }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'TarotAI/1.0' },
  });
  const data = await res.json();
  if (!data || data.length === 0) {
    throw new Error(`City not found: ${city}`);
  }
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// ─── Main calculation ────────────────────────────────────────────────────────

export async function calculateNatalChart(input: NatalInput): Promise<NatalChartData> {
  // Parse date/time
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour, minute] = input.birthTime.split(':').map(Number);

  // Geocode city
  const { lat, lng } = await geocodeCity(input.birthCity);

  // Create origin (month is 0-indexed in the library)
  const origin = new Origin({
    year, month: month - 1, date: day,
    hour, minute, second: 0,
    latitude: lat, longitude: lng,
  });

  // Calculate horoscope
  const horoscope = new Horoscope({
    origin,
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: ['bodies', 'points', 'angles'],
    aspectWithPoints: ['bodies', 'points', 'angles'],
    aspectTypes: ['major'],
    language: 'en',
  });

  // Extract planets
  const planets: PlanetInfo[] = [];
  const retrogrades: string[] = [];
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const body of horoscope.CelestialBodies.all as any[]) {
    if (body.key === 'sirius') continue; // skip fixed star
    const signEn = body.Sign?.label || 'Unknown';
    const planet: PlanetInfo = {
      name: PLANET_RU[body.key] || body.label || body.key,
      sign: SIGN_RU[signEn] || signEn,
      house: body.House?.id || 0,
      isRetrograde: !!body.isRetrograde,
    };
    planets.push(planet);
    if (body.isRetrograde) retrogrades.push(planet.name);
    if (ELEMENT_MAP[signEn]) elements[ELEMENT_MAP[signEn]]++;
  }

  // Moon sign
  const moonBody = horoscope.CelestialBodies.all.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b: any) => b.key === 'moon',
  );
  const moonSignEn = moonBody?.Sign?.label || 'Unknown';

  // Houses
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const houses = horoscope.Houses.map((h: any) => ({
    id: h.id as number,
    sign: SIGN_RU[h.Sign?.label] || h.Sign?.label || 'Unknown',
  }));

  // Major aspects (filter to most important, max ~15)
  const majorTypes = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aspects: AspectInfo[] = (horoscope.Aspects.all as any[])
    .filter((a) => majorTypes.includes(a.aspectKey) && a.orb <= 8)
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 15)
    .map((a) => ({
      planet1: PLANET_RU[a.point1Key] || a.point1Label || a.point1Key,
      planet2: PLANET_RU[a.point2Key] || a.point2Label || a.point2Key,
      type: ASPECT_RU[a.aspectKey] || a.label || a.aspectKey,
      orb: Math.round(a.orb * 100) / 100,
    }));

  // Celestial points
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const points: PointInfo[] = (horoscope.CelestialPoints.all as any[]).map((p) => ({
    name: p.key === 'northnode' ? 'Сев. Узел (Раху)'
      : p.key === 'southnode' ? 'Юж. Узел (Кету)'
        : p.key === 'lilith' ? 'Лилит (Чёрная Луна)'
          : p.label || p.key,
    sign: SIGN_RU[p.Sign?.label] || p.Sign?.label || 'Unknown',
    house: p.House?.id || 0,
  }));

  const ascSignEn = horoscope.Ascendant.Sign?.label || 'Unknown';
  const mcSignEn = horoscope.Midheaven.Sign?.label || 'Unknown';
  const sunSignEn = horoscope.SunSign?.label || 'Unknown';

  return {
    sunSign: SIGN_RU[sunSignEn] || sunSignEn,
    moonSign: SIGN_RU[moonSignEn] || moonSignEn,
    ascendant: SIGN_RU[ascSignEn] || ascSignEn,
    midheaven: SIGN_RU[mcSignEn] || mcSignEn,
    planets,
    houses,
    aspects,
    points,
    elements,
    retrogrades,
    input: {
      date: input.birthDate,
      time: input.birthTime,
      city: input.birthCity,
      lat, lng,
    },
  };
}

// ─── Format for prompt ───────────────────────────────────────────────────────

export function formatNatalDataForPrompt(data: NatalChartData): string {
  let text = '';

  text += `Дата рождения: ${data.input.date}, время: ${data.input.time}\n`;
  text += `Место: ${data.input.city} (${data.input.lat.toFixed(2)}°, ${data.input.lng.toFixed(2)}°)\n\n`;

  text += `☉ Солнце: ${data.sunSign}\n`;
  text += `☽ Луна: ${data.moonSign}\n`;
  text += `ASC (Асцендент): ${data.ascendant}\n`;
  text += `MC (Середина неба): ${data.midheaven}\n\n`;

  text += `═══ ПЛАНЕТЫ ═══\n`;
  for (const p of data.planets) {
    const retro = p.isRetrograde ? ' ℞' : '';
    text += `${p.name}: ${p.sign}, Дом ${p.house}${retro}\n`;
  }

  text += `\n═══ ОСОБЫЕ ТОЧКИ ═══\n`;
  for (const pt of data.points) {
    text += `${pt.name}: ${pt.sign}, Дом ${pt.house}\n`;
  }

  text += `\n═══ БАЛАНС СТИХИЙ ═══\n`;
  text += `🔥 Огонь: ${data.elements.fire} | 🌍 Земля: ${data.elements.earth} | 💨 Воздух: ${data.elements.air} | 💧 Вода: ${data.elements.water}\n`;

  if (data.retrogrades.length > 0) {
    text += `\n═══ РЕТРОГРАДЫ ═══\n`;
    text += data.retrogrades.join(', ') + '\n';
  }

  text += `\n═══ КЛЮЧЕВЫЕ АСПЕКТЫ ═══\n`;
  for (const a of data.aspects) {
    text += `${a.planet1} ${a.type} ${a.planet2} (орб ${a.orb}°)\n`;
  }

  text += `\n═══ ДОМА ═══\n`;
  for (const h of data.houses) {
    text += `Дом ${h.id}: ${h.sign}\n`;
  }

  return text;
}
