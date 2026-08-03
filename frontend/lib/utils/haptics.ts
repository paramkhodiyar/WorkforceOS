/**
 * Triggers subtle haptic feedback vibration on mobile devices.
 * Safely checks for navigator.vibrate support before triggering.
 */
export function triggerHaptic(pattern: number | number[] = 40): void {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (err) {
      // Ignore security or permission restrictions
    }
  }
}
