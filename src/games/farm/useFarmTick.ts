import { useEffect, useState } from 'react'
import { useFarmStore } from '../../store/useFarmStore'

/**
 * Drives the farm screen: ticks ~4x/sec so growth progress animates and the
 * automation upgrades (auto-harvest / auto-sell) run. Returns the current
 * timestamp so plots can recompute progress on each frame. Growth itself is
 * timestamp-based, so crops keep maturing while the app is closed.
 */
export function useFarmTick(): number {
  const [now, setNow] = useState(() => Date.now())
  const runAuto = useFarmStore((s) => s.runAuto)
  const init = useFarmStore((s) => s.init)

  useEffect(() => {
    init()
    runAuto() // catch up automation right away (covers time spent away)
    const id = window.setInterval(() => {
      setNow(Date.now())
      runAuto()
    }, 250)
    return () => window.clearInterval(id)
  }, [runAuto, init])

  return now
}
