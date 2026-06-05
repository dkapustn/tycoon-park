import { useEffect, useState } from 'react'
import { usePizzaStore } from '../../store/usePizzaStore'

/**
 * Drives the pizzeria: ticks ~12x/sec so bake bars move smoothly (the perfect
 * window is tight) while spawning customers, burning forgotten pizzas and
 * running the auto-baker. Returns the current timestamp for the cards.
 */
export function usePizzaTick(): number {
  const [now, setNow] = useState(() => Date.now())
  const tick = usePizzaStore((s) => s.tick)
  const init = usePizzaStore((s) => s.init)

  useEffect(() => {
    init()
    const id = window.setInterval(() => {
      const n = Date.now()
      setNow(n)
      tick(n)
    }, 80)
    return () => window.clearInterval(id)
  }, [tick, init])

  return now
}
