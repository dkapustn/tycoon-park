// Vibration feedback. No-op on iOS Safari (no Vibration API) — harmless.
let enabled = true

export function setHapticsEnabled(value: boolean) {
  enabled = value
}

export function haptic(pattern: number | number[] = 8) {
  if (!enabled) return
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      /* ignore */
    }
  }
}
