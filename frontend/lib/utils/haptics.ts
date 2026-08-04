/**
 * Triggers subtle haptic feedback vibration across Mobile Web, PWA, iOS, Android, and Flutter WebViews.
 * Emits native Flutter bridge messages + navigator.vibrate + Web Audio micro-pulse fallback.
 */
export function triggerHaptic(pattern: number | number[] = 40): void {
  if (typeof window === 'undefined') return;

  const duration = Array.isArray(pattern) ? pattern[0] : pattern;

  // 1. Send all common native Flutter / React Native WebView bridge event types
  try {
    const bridge = (window as any).WorkforceOSBridge || (window as any).webkit?.messageHandlers?.WorkforceOSBridge;
    if (bridge && typeof bridge.postMessage === 'function') {
      const payload = JSON.stringify({
        type: 'haptic',
        action: 'vibrate',
        duration,
        pattern: Array.isArray(pattern) ? pattern : [duration],
      });
      bridge.postMessage(payload);
    }
  } catch (_) {}

  // 2. Standard Web Vibration API (Android Chrome, PWA)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }

  // 3. iOS Safari Web Audio Micro-Impulse (gives a physical click feel on iOS where navigator.vibrate is disabled)
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    }
  } catch (_) {}
}
