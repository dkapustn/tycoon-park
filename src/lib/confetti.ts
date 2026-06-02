import confetti from 'canvas-confetti'

type Opts = Parameters<typeof confetti>[0]

let reduced = false
const COLORS = ['#fde047', '#fb7185', '#a78bfa', '#34d399', '#60a5fa', '#f472b6']

export function setConfettiReduced(value: boolean) {
  reduced = value
}

/** Quick pop, e.g. for milestones. */
export function burst(opts?: Opts) {
  if (reduced) return
  confetti({
    particleCount: 70,
    spread: 72,
    startVelocity: 42,
    origin: { y: 0.7 },
    colors: COLORS,
    disableForReducedMotion: true,
    ...opts,
  })
}

/** Sustained celebration for completing a game. */
export function bigWin() {
  if (reduced) return
  const end = Date.now() + 1400
  ;(function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 65, origin: { x: 0, y: 0.8 }, colors: COLORS })
    confetti({ particleCount: 6, angle: 120, spread: 65, origin: { x: 1, y: 0.8 }, colors: COLORS })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
