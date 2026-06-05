import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNav } from './store/useNav'
import { useGameStore } from './store/useGameStore'
import { getConfig } from './games/registry'
import { setSoundEnabled } from './lib/sound'
import { setHapticsEnabled } from './lib/haptics'
import { setConfettiReduced } from './lib/confetti'
import { Hub } from './components/hub/Hub'
import { IdleGame } from './components/game/IdleGame'
import { FarmGame } from './components/game/farm/FarmGame'
import { CoffeeGame } from './components/game/coffee/CoffeeGame'
import { PizzaGame } from './components/game/pizza/PizzaGame'
import { ComingSoon } from './components/game/ComingSoon'
import { InventoryScreen } from './components/inventory/InventoryScreen'
import { AchievementsScreen } from './components/meta/AchievementsScreen'
import { MagnateShopScreen } from './components/meta/MagnateShopScreen'
import { Toasts } from './components/ui/Toasts'

function GameScreen({ id, onExit }: { id: string; onExit: () => void }) {
  const cfg = getConfig(id)
  if (cfg.kind === 'farm') return <FarmGame cfg={cfg} onExit={onExit} />
  if (cfg.kind === 'coffee') return <CoffeeGame cfg={cfg} onExit={onExit} />
  if (cfg.kind === 'pizza') return <PizzaGame cfg={cfg} onExit={onExit} />
  return <IdleGame cfg={cfg} onExit={onExit} />
}

export default function App() {
  const screen = useNav((s) => s.screen)
  const sound = useGameStore((s) => s.meta.settings.sound)
  const reducedMotion = useGameStore((s) => s.meta.settings.reducedMotion)

  // Keep side-effect libs in sync with persisted settings.
  useEffect(() => setSoundEnabled(sound), [sound])
  useEffect(() => {
    setHapticsEnabled(!reducedMotion)
    setConfettiReduced(reducedMotion)
  }, [reducedMotion])

  // Device / browser back button returns to the hub.
  useEffect(() => {
    const onPop = () => useNav.getState().goHome()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const back = () => history.back()
  const key = 'id' in screen ? `${screen.name}:${screen.id}` : screen.name

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.22 }}
        >
          {screen.name === 'hub' && <Hub />}
          {screen.name === 'game' && <GameScreen id={screen.id} onExit={back} />}
          {screen.name === 'soon' && <ComingSoon cfg={getConfig(screen.id)} onExit={back} />}
          {screen.name === 'inventory' && <InventoryScreen onBack={back} />}
          {screen.name === 'achievements' && <AchievementsScreen onBack={back} />}
          {screen.name === 'shop' && <MagnateShopScreen onBack={back} />}
        </motion.div>
      </AnimatePresence>
      <Toasts />
    </>
  )
}
