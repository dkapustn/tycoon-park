import { useEffect, useState } from 'react'
import { useMineStore } from '../../store/useMineStore'

/**
 * Drives the mine: auto-miners deal damage every ~100ms (idle income), and we
 * keep `lastSeen` fresh so the offline catch-up stays accurate. Returns the
 * current timestamp so the vein HP bar redraws.
 */
export function useMineTick(): number {
  const [now, setNow] = useState(() => Date.now())
  const tick = useMineStore((s) => s.tick)
  const markSeen = useMineStore((s) => s.markSeen)

  useEffect(() => {
    let last = performance.now()
    const id = window.setInterval(() => {
      const t = performance.now()
      const dt = t - last
      last = t
      tick(dt)
      setNow(Date.now())
    }, 100)
    const seen = window.setInterval(() => markSeen(), 5000)
    return () => {
      window.clearInterval(id)
      window.clearInterval(seen)
      markSeen()
    }
  }, [tick, markSeen])

  return now
}
