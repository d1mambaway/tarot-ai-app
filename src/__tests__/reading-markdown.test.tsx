import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderReadingParagraph } from '@/lib/reading-markdown';

const html = (line: string) => renderToStaticMarkup(<>{renderReadingParagraph(line, 0)}</>);

describe('reading markdown', () => {
  it('emoji + bold title → heading', () => {
    const h = html('💫 **Совет рун**');
    expect(h).toContain('reading-heading');
    expect(h).toContain('Совет рун');
    expect(h).not.toContain('**');
  });

  it('position — card line → two-tone position heading', () => {
    const h = html('**Суть ситуации** — **ᛁ Иса**');
    expect(h).toContain('reading-position-label');
    expect(h).toContain('ᛁ Иса');
  });

  it('old "Position — Card: text" still works', () => {
    const h = html('**Прошлое** — **Шут**: ты прыгнул, не глядя');
    expect(h).toContain('reading-position-card');
    expect(h).toContain('ты прыгнул');
  });

  it('legacy caps label becomes a quiet label, not shouting', () => {
    const h = html('⚡ ЭНЕРГЕТИЧЕСКОЕ ЗНАЧЕНИЕ: холодный кристалл, застой');
    expect(h).toContain('reading-label');
    expect(h).toContain('Энергетическое значение');
    expect(h).not.toContain('ЭНЕРГЕТИЧЕСКОЕ');
  });

  it('legacy caps heading on its own line', () => {
    const h = html('💫 СОВЕТ ДРЕВНИХ (1-2 фразы):');
    expect(h).toContain('reading-heading');
    expect(h).toContain('Совет древних');
  });

  it('bold inside text → gold highlight', () => {
    const h = html('Сейчас **время паузы**, а не рывка.');
    expect(h).toContain('<strong class="reading-highlight">время паузы</strong>');
  });

  it('plain text stays a paragraph', () => {
    expect(html('Обычный абзац текста.')).toBe('<p class="reading-p">Обычный абзац текста.</p>');
  });
});
