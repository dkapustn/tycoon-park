import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { GameConfig } from '../../../games/types'
import { useGameStore } from '../../../store/useGameStore'
import { useCoffeeStore } from '../../../store/useCoffeeStore'
import { useCoffeeTick } from '../../../games/coffee/useCoffeeTick'
import { stationCount, unlockedDrinks } from '../../../games/coffee/drinks'
import { formatNumber } from '../../../lib/format'
import { sfx } from '../../../lib/sound'
import { haptic } from '../../../lib/haptics'
import { burst, bigWin } from '../../../lib/confetti'
import { GameShell } from '../GameShell'
import { CompletionModal } from '../CompletionModal'
import { ProgressBar } from '../../ui/ProgressBar'
import { CustomerCard } from './CustomerCard'
import { CoffeeShopSheet } from './CoffeeShopSheet'

interface Floater {
  id: number
  text: string
}

export function CoffeeGame({ cfg, onExit }: { cfg: GameConfig; onExit: () => void }) {
  const now = useCoffeeTick()

  const coins = useCoffeeStore((s) => s.coins)
  const totalEarned = useCoffeeStore((s) => s.totalEarned)
  const customers = useCoffeeStore((s) => s.customers)
  const upgrades = useCoffeeStore((s) => s.upgrades)
  const served = useCoffeeStore((s) => s.served)
  const missed = useCoffeeStore((s) => s.missed)
  const startBrew = useCoffeeStore((s) => s.startBrew)

  const diamonds = useGameStore((s) => s.meta.diamonds)
  const alreadyDone = useGameStore((s) => s.meta.completed.includes(cfg.id))
  const completeGame = useGameStore((s) => s.completeGame)

  const [shopOpen, setShopOpen] = useState(false)
  const [showWin, setShowWin] = useState(false)
  const [unlockedId, setUnlockedId] = useState<string | null>(null)
  const [floaters, setFloaters] = useState<Floater[]>([])
  const floaterId = useRef(0)
  const firedRef = useRef(false)
  const milestoneRef = useRef(0)
  const prevServed = useRef(served)
  const prevMissed = useRef(missed)
  const prevCoins = useRef(coins)

  const goal = cfg.goal.amount
  const progress = Math.min(1, totalEarned / goal)
  const stations = stationCount(upgrades)
  const busy = customers.filter((c) => c.status === 'brewing').length
  const freeStations = stations - busy
  const menu = unlockedDrinks(totalEarned)

  // Win when lifetime revenue crosses the goal.
  useEffect(() => {
    if (totalEarned >= goal && !firedRef.current && !alreadyDone) {
      firedRef.current = true
      const res = completeGame(cfg.id)
      setUnlockedId(res.unlockedId)
      setShowWin(true)
      sfx.win()
      bigWin()
    }
  }, [totalEarned, goal, alreadyDone, cfg.id, completeGame])

  // Milestone pops.
  useEffect(() => {
    const steps = [0.25, 0.5, 0.75]
    while (milestoneRef.current < steps.length && progress >= steps[milestoneRef.current]) {
      milestoneRef.current++
      if (!alreadyDone) {
        burst()
        haptic(10)
      }
    }
  }, [progress, alreadyDone])

  // Feedback when a customer is served (coins pop) or walks out (error).
  useEffect(() => {
    if (served > prevServed.current) {
      sfx.coin()
      haptic(10)
      const delta = coins - prevCoins.current
      if (delta > 0) {
        const id = floaterId.current++
        setFloaters((f) => [...f.slice(-6), { id, text: `+${formatNumber(delta)}` }])
      }
    }
    if (missed > prevMissed.current) {
      sfx.error()
      haptic(20)
    }
    prevServed.current = served
    prevMissed.current = missed
    prevCoins.current = coins
  }, [served, missed, coins])

  const onTap = (id: number) => {
    if (startBrew(id)) {
      sfx.tap()
      haptic(6)
    } else {
      sfx.error()
      haptic(16)
    }
  }

  return (
    <GameShell cfg={cfg} onBack={onExit}>
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
        {/* Goal + wallet */}
        <div className="flex flex-col gap-2 px-4 pt-1">
          <div className="rounded-2xl bg-black/20 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-white/85">🎯 {cfg.goal.label}</span>
              <span className="tabular-nums text-white/60">{Math.floor(progress * 100)}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <div className="font-display text-3xl font-extrabold leading-none tabular-nums text-shadow-pop">
                🪙 {formatNumber(coins)}
              </div>
              <div className="mt-1 text-sm font-bold tabular-nums text-[var(--accent-soft)]">
                💎 {formatNumber(diamonds)}
              </div>
            </div>
            <div className="flex gap-2 text-center">
              <div className="rounded-2xl bg-black/25 px-3 py-1.5">
                <div className="font-display text-lg font-extrabold leading-none tabular-nums">
                  {freeStations}/{stations}
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">бариста</div>
              </div>
              <div className="rounded-2xl bg-black/25 px-3 py-1.5">
                <div className="font-display text-lg font-extrabold leading-none tabular-nums text-emerald-300">
                  {formatNumber(served)}
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">подано</div>
              </div>
            </div>
          </div>
        </div>

        {/* Queue */}
        <div className="scroll-y relative min-h-0 flex-1 px-4 py-3">
          {customers.length === 0 ? (
            <div className="mt-16 text-center text-white/45">
              <div className="mb-2 text-5xl">🔔</div>
              <p className="text-sm">Гости вот-вот придут…</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence>
                {customers.map((c) => (
                  <CustomerCard key={c.id} c={c} now={now} canBrew={freeStations > 0} onTap={onTap} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Coin floaters */}
          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
            <AnimatePresence>
              {floaters.map((f) => (
                <motion.span
                  key={f.id}
                  className="absolute font-display text-2xl font-extrabold text-emerald-300 text-shadow-pop"
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -70, scale: 1.25 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  onAnimationComplete={() => setFloaters((l) => l.filter((i) => i.id !== f.id))}
                >
                  {f.text}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Dock: menu + shop */}
        <div className="rounded-t-4xl bg-black/25 px-3 pb-safe pt-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">
              ☕ Меню
            </span>
            <button
              onClick={() => setShopOpen(true)}
              className="rounded-full bg-white/15 px-3 py-1 font-display text-sm font-semibold tap-none active:scale-95"
            >
              🏗️ Прокачка
            </button>
          </div>
          <div className="scroll-y flex gap-2 overflow-x-auto pb-1">
            {menu.map((d) => (
              <div
                key={d.id}
                className="flex w-[4.6rem] shrink-0 flex-col items-center gap-0.5 rounded-2xl bg-white/10 px-1.5 py-2"
              >
                <span className="text-2xl leading-none">{d.emoji}</span>
                <span className="truncate text-[11px] font-semibold leading-tight">{d.name}</span>
                <span className="text-[11px] font-bold tabular-nums text-[var(--accent-soft)]">
                  🪙 {formatNumber(d.price)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-center text-[11px] text-white/40">
            Тапни гостя — сваришь и подашь его напиток. Не дай ему уйти!
          </p>
        </div>
      </div>

      <CoffeeShopSheet open={shopOpen} onClose={() => setShopOpen(false)} />

      <CompletionModal
        open={showWin}
        cfg={cfg}
        unlockedId={unlockedId}
        onMenu={onExit}
        onContinue={() => setShowWin(false)}
      />
    </GameShell>
  )
}
