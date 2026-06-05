import { useEffect, useState } from 'react'
import { useCoffeeStore } from '../../store/useCoffeeStore'

/**
 * Drives the café: ticks ~8x/sec to advance brews, decay patience, spawn new
 * customers and run the auto-barista. Returns the current timestamp so cards
 * can redraw their patience / brew meters.
 */
export function useCoffeeTick(): number {
  const [now, setNow] = useState(() => Date.now())
  const tick = useCoffeeStore((s) => s.tick)
  const init = useCoffeeStore((s) => s.init)

  useEffect(() => {
    init()
    const id = window.setInterval(() => {
      const n = Date.now()
      setNow(n)
      tick(n)
    }, 120)
    return () => window.clearInterval(id)
  }, [tick, init])

  return now
}
