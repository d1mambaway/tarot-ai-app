import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReadingBody } from '@/lib/reading-markdown';

const html = (text: string) => renderToStaticMarkup(<ReadingBody text={text} />);

const REPORT = [
  '🔯 **Твоя матрица судьбы**',
  '🎭 **Ядро личности**',
  'Центр — твоя движущая сила.',
  '🏹 **Предназначение**',
  'Задача воплощения.',
  '💼 **Денежный канал**',
  'Деньги через талант.',
  '💞 **Отношения**',
  'Партнёрство.',
].join('\n');

describe('ReadingBody', () => {
  it('a heading with no text before another heading becomes the title', () => {
    const h = html(REPORT);
    expect(h).toContain('reading-title-text');
    expect(h.match(/reading-title-text/g)).toHaveLength(1);
    expect(h).toContain('Твоя матрица судьбы');
  });

  it('long reports get collapsible sections, open at first', () => {
    const h = html(REPORT);
    expect(h.match(/aria-expanded="true"/g)).toHaveLength(4);
    expect(h).toContain('Деньги через талант.');
  });

  it('short readings stay plain', () => {
    const h = html('🌄 **Первое впечатление**\nТекст.\n✅ **Совет**\nСделай паузу.');
    expect(h).not.toContain('aria-expanded');
    expect(h).not.toContain('reading-title-text');
    expect(h).toContain('reading-heading');
  });

  it('text before the first heading is kept', () => {
    expect(html('Вступление.\n✅ **Совет**\nТекст.')).toContain('Вступление.');
  });
});
