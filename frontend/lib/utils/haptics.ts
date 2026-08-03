/**
 * Triggers subtle haptic feedback vibration on mobile devices & native Flutter WebView bridge.
 * Sends haptic pattern both to Web API (navigator.vibrate) and native mobile bridge (WorkforceOSBridge).
 */
export function triggerHaptic(pattern: number | number[] = 50): void {
  if (typeof window === 'undefined') return;

  // 1. Try Native Flutter WebView Bridge for 100% reliable hardware vibration
  try {
    const bridge = (window as any).WorkforceOSBridge;
    if (bridge && typeof bridge.postMessage === 'function') {
      bridge.postMessage(JSON.stringify({
        type: 'haptic',
        pattern: Array.isArray(pattern) ? pattern : [pattern],
      }));
    }
  } catch (bridgeErr) {
    // Ignore bridge errors
  }

  // 2. Web API navigator.vibrate fallback
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (err) {
      // Ignore web permissions restrictions
    }
  }
}
