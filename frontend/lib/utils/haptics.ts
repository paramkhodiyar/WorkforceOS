/**
 * Triggers haptic feedback vibration across Mobile Web, PWA, iOS, Android, and Flutter WebViews.
 * Emits native Flutter bridge messages + navigator.vibrate + Web Audio micro-pulse fallback.
 */
export function triggerHaptic(pattern: number | number[] = 40): void {
  if (typeof window === 'undefined') return;

  const duration = Array.isArray(pattern) ? pattern[0] : pattern;
  const style = duration > 80 ? 'heavy' : duration > 40 ? 'medium' : 'light';

  // 1. Flutter WebView Bridge (Android / iOS)
  try {
    const bridge = (window as any).WorkforceOSBridge || (window as any).webkit?.messageHandlers?.WorkforceOSBridge;
    if (bridge && typeof bridge.postMessage === 'function') {
      bridge.postMessage(JSON.stringify({ type: 'haptic_feedback', style }));
    }
  } catch (_) {}

  // 2. Standard Web Vibration API (Android Chrome, PWA, Android WebView)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }

  // 3. iOS Safari Web Audio Micro-Impulse (physical click feel on iOS where navigator.vibrate is disabled)
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();
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

/**
 * Notifies the Flutter host that an attendance action completed successfully.
 * This syncs the home screen widget state with the new status.
 */
export function notifyAttendanceAction(status: 'CLOCKED_IN' | 'CLOCKED_OUT', workMode: 'WFO' | 'WFH' = 'WFO'): void {
  if (typeof window === 'undefined') return;
  try {
    const bridge = (window as any).WorkforceOSBridge || (window as any).webkit?.messageHandlers?.WorkforceOSBridge;
    if (bridge && typeof bridge.postMessage === 'function') {
      bridge.postMessage(JSON.stringify({ type: 'attendance_action', status, workMode }));
    }
  } catch (_) {}
}
