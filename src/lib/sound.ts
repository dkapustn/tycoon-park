// Tiny Web Audio SFX — no asset files, just synthesized blips.
let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(value: boolean) {
  enabled = value
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

type Tone = {
  freq: number
  dur: number
  type?: OscillatorType
  gain?: number
  slideTo?: number
}

function tone({ freq, dur, type = 'sine', gain = 0.05, slideTo }: Tone) {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  const osc = c.createOscillator()
  const g = c.createGain()
  const t0 = c.currentTime
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function chord(freqs: number[], step = 110, opts: Partial<Tone> = {}) {
  freqs.forEach((f, i) =>
    setTimeout(() => tone({ freq: f, dur: 0.2, type: 'triangle', gain: 0.06, ...opts }), i * step),
  )
}

export const sfx = {
  tap() {
    if (!enabled) return
    tone({ freq: 520, slideTo: 700, dur: 0.07, type: 'triangle', gain: 0.045 })
  },
  coin() {
    if (!enabled) return
    tone({ freq: 880, slideTo: 1320, dur: 0.11, type: 'square', gain: 0.035 })
  },
  buy() {
    if (!enabled) return
    tone({ freq: 320, slideTo: 540, dur: 0.16, type: 'sawtooth', gain: 0.05 })
  },
  error() {
    if (!enabled) return
    tone({ freq: 200, slideTo: 130, dur: 0.13, type: 'sawtooth', gain: 0.04 })
  },
  unlock() {
    if (!enabled) return
    chord([659, 988], 120)
  },
  win() {
    if (!enabled) return
    chord([523, 659, 784, 1047], 120)
  },
}
