import { useEffect, useState } from 'react'
import { useBakeryStore } from '../../store/useBakeryStore'

/**
 * Drives the bakery: ticks ~7x/sec to finish baking trays into the shelf, expire
 * customers, spawn new ones and run the auto-baker / auto-seller. Returns the
 * current timestamp so bake and patience bars redraw.
 */
export function useBakeryTick(): number {
  const [now, setNow] = useState(() => Date.now())
  const tick = useBakeryStore((s) => s.tick)
  const init = useBakeryStore((s) => s.init)

  useEffect(() => {
    init()
    const id = window.setInterval(() => {
      const n = Date.now()
      setNow(n)
      tick(n)
    }, 140)
    return () => window.clearInterval(id)
  }, [tick, init])

  return now
}
