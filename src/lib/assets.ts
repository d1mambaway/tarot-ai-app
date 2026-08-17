/**
 * Card and UI artwork is stored as WebP (see PR "perf: webp assets").
 *
 * Readings created before that change have PNG/JPG paths baked into their
 * stored `cards` JSON in the database, so those rows would 404 in history.
 * Normalize any image path coming from persisted data through this helper.
 */
export function assetUrl(path: string): string;
export function assetUrl(path: string | null | undefined): string | undefined;
export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return path ?? undefined;
  return path.replace(/\.(png|jpe?g)(\?.*)?$/i, '.webp$2');
}
