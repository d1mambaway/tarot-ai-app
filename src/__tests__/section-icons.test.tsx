import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderReadingParagraph } from '@/lib/reading-markdown';
import { sectionIconFor } from '@/lib/section-icons';
import { houseOf, computeAspects } from '@/components/ui/NatalChartWheel';

const html = (line: string) => renderToStaticMarkup(<>{renderReadingParagraph(line, 0)}</>);

describe('section icons in headings', () => {
  it('current marker → brand icon instead of the emoji', () => {
    const h = html('✅ **Совет на день**');
    expect(h).toContain('/icons/sections/advice.svg');
    expect(h).not.toContain('✅');
    expect(h).toContain('Совет на день');
  });

  it('variation selector does not matter', () => {
    expect(sectionIconFor('⚠️')).toBe('warning');
    expect(sectionIconFor('⚠')).toBe('warning');
    expect(sectionIconFor('👁️')).toBe('message');
  });

  it('ambiguous legacy emoji stay emoji', () => {
    for (const e of ['💫', '🌙', '✨', '🔮', '⭐', '⚖️', '💚', '🌅', '⚡']) {
      expect(sectionIconFor(e)).toBeNull();
    }
    expect(html('💫 **Совет рун**')).toContain('💫');
  });

  it('legacy caps heading also gets the icon', () => {
    expect(html('🌳 РОДОВЫЕ ЛИНИИ')).toContain('/icons/sections/ancestry.svg');
  });

  it('every mapped icon exists in public/', async () => {
    const fs = await import('node:fs');
    const ids = ['✅', '⚠', '👁', '🪷', '🌒', '🧭', '💠', '🖤', '🔗', '🏹', '💞', '💼', '🚪', '🔑', '🌄', '🎭', '💔', '🌳', '🔭', '🔯', '🔥', '🌊', '🪨', '🌬', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '👑', '❌', '💝', '💰', '🏠', '🍀', '👤', '🕰', '🎁', '💧']
      .map((e) => sectionIconFor(e));
    for (const id of ids) {
      expect(id).not.toBeNull();
      expect(fs.existsSync(`public/icons/sections/${id}.svg`)).toBe(true);
    }
  });
});

describe('natal wheel helpers', () => {
  const cusps = [184.91, 208.48, 239.31, 276.77, 313.4, 342.71, 4.91, 28.48, 59.31, 96.77, 133.4, 162.71];

  it('house of a planet, including the cusp that wraps past 0°', () => {
    expect(houseOf(82.92, cusps)).toBe(9); // Sun
    expect(houseOf(354.35, cusps)).toBe(6); // Saturn, house 6 spans 342.71 → 4.91
    expect(houseOf(2, cusps)).toBe(6);
    expect(houseOf(190, cusps)).toBe(1);
  });

  it('aspects use the brand colours and include sextiles', () => {
    const asp = computeAspects({ Sun: [0], Moon: [61], Mars: [180], Venus: [121] });
    const names = asp.map((a) => `${a.point.name}-${a.toPoint.name}-${a.aspect.name}`);
    expect(names).toContain('Sun-Moon-sextile');
    expect(names).toContain('Sun-Mars-opposition');
    expect(names).toContain('Sun-Venus-trine');
    expect(asp.find((a) => a.aspect.name === 'opposition')!.aspect.color).not.toBe('#27AE60');
  });
});

describe('reading illustrations', () => {
  it('natal chart has no AI picture: the real chart is drawn instead', async () => {
    const { buildImagePrompt } = await import('@/lib/ai/image');
    expect(buildImagePrompt({ spreadId: 'natal_chart', cards: [] })).toBeNull();
    expect(buildImagePrompt({ spreadId: 'dream', cards: [], question: 'летал над морем' })).not.toBeNull();
    expect(buildImagePrompt({ spreadId: 'numerology', cards: [], extraContext: '1995-03-08' })).not.toBeNull();
  });
});
