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

export { buildUserMemoryContext, getLatestReadingForReminder } from './memory';

export { buildDeckSummary, aiPickCards } from './card-selection';

export { collectDueReminders, markReminderSent } from './reminder';

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
  buildMoonPhasePrompt,
  buildChakraPrompt,
  CHAKRA_LABELS,
  getZodiacSign,
} from './prompts';
