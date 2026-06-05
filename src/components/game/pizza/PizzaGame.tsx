import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { GameConfig } from '../../../games/types'
import { useGameStore } from '../../../store/useGameStore'
import { usePizzaStore } from '../../../store/usePizzaStore'
import { usePizzaTick } from '../../../games/pizza/usePizzaTick'
import { ovenCount, unlockedPizzas, comboMult } from '../../../games/pizza/pizzas'
import { formatNumber } from '../../../lib/format'
import { sfx } from '../../../lib/sound'
import { haptic } from '../../../lib/haptics'
import { burst, bigWin } from '../../../lib/confetti'
import { GameShell } from '../GameShell'
import { CompletionModal } from '../CompletionModal'
import { ProgressBar } from '../../ui/ProgressBar'
import { OrderCard } from './OrderCard'
import { PizzaShopSheet } from './PizzaShopSheet'

interface Floater {
  id: number
  text: string
  cls: string
}

export function PizzaGame({ cfg, onExit }: { cfg: GameConfig; onExit: () => void }) {
  const now = usePizzaTick()

  const coins = usePizzaStore((s) => s.coins)
  const totalEarned = usePizzaStore((s) => s.totalEarned)
  const orders = usePizzaStore((s) => s.orders)
  const upgrades = usePizzaStore((s) => s.upgrades)
  const served = usePizzaStore((s) => s.served)
  const ruined = usePizzaStore((s) => s.ruined)
  const combo = usePizzaStore((s) => s.combo)
  const startBake = usePizzaStore((s) => s.startBake)
  const pull = usePizzaStore((s) => s.pull)

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
  const prevRuined = useRef(ruined)

  const goal = cfg.goal.amount
  const progress = Math.min(1, totalEarned / goal)
  const ovens = ovenCount(upgrades)
  const busy = orders.filter((o) => o.status === 'baking').length
  const freeOvens = ovens - busy
  const menu = unlockedPizzas(totalEarned)

  const spawnFloater = (text: string, cls: string) => {
    const id = floaterId.current++
    setFloaters((f) => [...f.slice(-6), { id, text, cls }])
  }

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

  // A pizza burnt or a guest walked out.
  useEffect(() => {
    if (ruined > prevRuined.current) {
      sfx.error()
      haptic(20)
    }
    prevRuined.current = ruined
  }, [ruined])

  const onStart = (id: number) => {
    if (startBake(id)) {
      sfx.tap()
      haptic(6)
    } else {
      sfx.error()
      haptic(16)
    }
  }

  const onPull = (id: number) => {
    const r = pull(id)
    if (!r) return
    if (r.quality === 'perfect') {
      sfx.win()
      haptic(16)
      burst({ origin: { y: 0.55 }, particleCount: 40 })
      spawnFloater(`Идеально! +${formatNumber(r.earn)}${r.combo > 1 ? ` 🔥${r.combo}` : ''}`, 'text-emerald-300')
    } else {
      sfx.coin()
      haptic(8)
      const label = r.quality === 'under' ? 'Сыровато' : 'Передержал'
      spawnFloater(`${label} +${formatNumber(r.earn)}`, 'text-amber-300')
    }
  }

  return (
    <GameShell cfg={cfg} onBack={onExit}>
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
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
                  {freeOvens}/{ovens}
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">печи</div>
              </div>
              <div className="rounded-2xl bg-black/25 px-3 py-1.5">
                <div className="font-display text-lg font-extrabold leading-none tabular-nums text-emerald-300">
                  {formatNumber(served)}
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">подано</div>
              </div>
            </div>
          </div>

          {combo >= 2 && (
            <div className="text-center font-display text-sm font-bold text-orange-300">
              🔥 Комбо ×{combo} · бонус +{Math.round((comboMult(combo) - 1) * 100)}%
            </div>
          )}
        </div>

        <div className="scroll-y relative min-h-0 flex-1 px-4 py-3">
          {orders.length === 0 ? (
            <div className="mt-16 text-center text-white/45">
              <div className="mb-2 text-5xl">🔔</div>
              <p className="text-sm">Гости вот-вот придут…</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence>
                {orders.map((o) => (
                  <OrderCard
                    key={o.id}
                    o={o}
                    now={now}
                    upgrades={upgrades}
                    canBake={freeOvens > 0}
                    onStart={onStart}
                    onPull={onPull}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
            <AnimatePresence>
              {floaters.map((f) => (
                <motion.span
                  key={f.id}
                  className={`absolute whitespace-nowrap font-display text-xl font-extrabold text-shadow-pop ${f.cls}`}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -70, scale: 1.2 }}
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

        <div className="rounded-t-4xl bg-black/25 px-3 pb-safe pt-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">🍕 Меню</span>
            <button
              onClick={() => setShopOpen(true)}
              className="rounded-full bg-white/15 px-3 py-1 font-display text-sm font-semibold tap-none active:scale-95"
            >
              🏗️ Прокачка
            </button>
          </div>
          <div className="scroll-y flex gap-2 overflow-x-auto pb-1">
            {menu.map((p) => (
              <div
                key={p.id}
                className="flex w-[4.6rem] shrink-0 flex-col items-center gap-0.5 rounded-2xl bg-white/10 px-1.5 py-2"
              >
                <span className="text-2xl leading-none">{p.emoji}</span>
                <span className="truncate text-[11px] font-semibold leading-tight">{p.name}</span>
                <span className="text-[11px] font-bold tabular-nums text-[var(--accent-soft)]">
                  🪙 {formatNumber(p.price)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-center text-[11px] text-white/40">
            Тапни заказ — поставь в печь. Тапни ещё раз в зелёной зоне = идеально!
          </p>
        </div>
      </div>

      <PizzaShopSheet open={shopOpen} onClose={() => setShopOpen(false)} />

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
