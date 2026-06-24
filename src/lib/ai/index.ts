/**
 * AI module — barrel re-export
 *
 * Usage:
 *   import { callGrok, buildReadingPrompt, generateImage } from '@/lib/ai';
 */

export {
  callGrok,
  callOpenRouter,
  callGrokJSON,
  sanitizeLLMOutput,
  GrokRateLimitError,
  GrokServiceError,
  type Message,
} from './clients';

export { generateImage, buildImagePrompt } from './image';

export {
  buildTarotSystemPrompt,
  buildCardSelectionPrompt,
  buildReadingPrompt,
  buildNumerologyPrompt,
  buildHoroscopePrompt,
  buildDreamPrompt,
  buildCompatibilityPrompt,
  buildAngelNumberPrompt,
  buildRunesPrompt,
  buildPsychPortraitPrompt,
  buildPastLivesPrompt,
  buildNatalChartPrompt,
  getZodiacSign,
} from './prompts';
