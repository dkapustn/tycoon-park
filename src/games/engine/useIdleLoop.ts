import { useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { getConfig } from '../registry'
import { totalRate } from './selectors'

const OFFLINE_CAP_SECONDS = 120
const COMMIT_SECONDS = 0.1
const MAX_FRAME_SECONDS = 0.5 // clamp big jumps (tab was backgrounded)

/**
 * Runs the passive-income loop for a game while its screen is mounted.
 * Commits ~10x/sec so numbers tick smoothly without flooding React.
 * Awards a small, capped offline catch-up on entry.
 */
export function useIdleLoop(gameId: string) {
  const tick = useGameStore((s) => s.tick)
  const markSeen = useGameStore((s) => s.markSeen)

  useEffect(() => {
    // One-time capped offline catch-up.
    const state = useGameStore.getState().games[gameId]
    if (state) {
      const elapsed = Math.min(OFFLINE_CAP_SECONDS, (Date.now() - state.lastSeen) / 1000)
      if (elapsed > 2 && totalRate(getConfig(gameId), state) > 0) {
        tick(gameId, elapsed)
      }
    }

    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      const dt = Math.min(MAX_FRAME_SECONDS, (now - last) / 1000)
      last = now
      acc += dt
      if (acc >= COMMIT_SECONDS) {
        tick(gameId, acc)
        acc = 0
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const seen = window.setInterval(() => markSeen(gameId), 5000)
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(seen)
      markSeen(gameId)
    }
  }, [gameId, tick, markSeen])
}
