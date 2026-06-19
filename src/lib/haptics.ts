/**
 * Telegram Mini App Haptic Feedback utility
 */
const getTg = () => (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null);

export function hapticLight() {
  getTg()?.HapticFeedback?.impactOccurred?.('light');
}

export function hapticMedium() {
  getTg()?.HapticFeedback?.impactOccurred?.('medium');
}

export function hapticHeavy() {
  getTg()?.HapticFeedback?.impactOccurred?.('heavy');
}

export function hapticSuccess() {
  getTg()?.HapticFeedback?.notificationOccurred?.('success');
}

export function hapticWarning() {
  getTg()?.HapticFeedback?.notificationOccurred?.('warning');
}

export function hapticSelection() {
  getTg()?.HapticFeedback?.selectionChanged?.();
}
