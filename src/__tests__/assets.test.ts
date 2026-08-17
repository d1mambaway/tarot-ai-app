/**
 * Artwork moved from PNG/JPG to WebP. Readings stored before that change keep
 * the old paths in their `cards` JSON, so assetUrl() must rewrite them.
 */
import { describe, it, expect } from 'vitest';
import { assetUrl } from '@/lib/assets';

describe('assetUrl', () => {
  it('rewrites legacy png paths from stored readings', () => {
    expect(assetUrl('/cards/major/00-fool.png')).toBe('/cards/major/00-fool.webp');
  });

  it('rewrites jpg and jpeg', () => {
    expect(assetUrl('/ui/card-of-day.jpg')).toBe('/ui/card-of-day.webp');
    expect(assetUrl('/ui/card-of-day.jpeg')).toBe('/ui/card-of-day.webp');
  });

  it('is case-insensitive', () => {
    expect(assetUrl('/cards/major/00-fool.PNG')).toBe('/cards/major/00-fool.webp');
  });

  it('preserves a query string', () => {
    expect(assetUrl('/ui/mana.png?v=2')).toBe('/ui/mana.webp?v=2');
  });

  it('leaves webp paths untouched', () => {
    expect(assetUrl('/cards/minor/wands-01.webp')).toBe('/cards/minor/wands-01.webp');
  });

  it('does not touch a filename that merely contains "png"', () => {
    expect(assetUrl('/ui/pngfoo.webp')).toBe('/ui/pngfoo.webp');
  });

  it('passes through empty values', () => {
    expect(assetUrl(undefined)).toBeUndefined();
    expect(assetUrl(null)).toBeUndefined();
  });
});
