import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { GameConfig } from '../../../games/types'
import { useGameStore } from '../../../store/useGameStore'
import { useBakeryStore } from '../../../store/useBakeryStore'
import { useBakeryTick } from '../../../games/bakery/useBakeryTick'
import { ovenCount, shelfCap, unlockedPastries, pastryById } from '../../../games/bakery/pastries'
import { formatNumber } from '../../../lib/format'
import { sfx } from '../../../lib/sound'
import { haptic } from '../../../lib/haptics'
import { burst, bigWin } from '../../../lib/confetti'
import { GameShell } from '../GameShell'
import { CompletionModal } from '../CompletionModal'
import { ProgressBar } from '../../ui/ProgressBar'
import { CustomerCard } from './CustomerCard'
import { BakeryShopSheet } from './BakeryShopSheet'
import { cn } from '../../../lib/cn'

interface Floater {
  id: number
  text: string
}

export function BakeryGame({ cfg, onExit }: { cfg: GameConfig; onExit: () => void }) {
  const now = useBakeryTick()

  const coins = useBakeryStore((s) => s.coins)
  const totalEarned = useBakeryStore((s) => s.totalEarned)
  const shelf = useBakeryStore((s) => s.shelf)
  const baking = useBakeryStore((s) => s.baking)
  const customers = useBakeryStore((s) => s.customers)
  const upgrades = useBakeryStore((s) => s.upgrades)
  const served = useBakeryStore((s) => s.served)
  const bake = useBakeryStore((s) => s.bake)
  const fulfill = useBakeryStore((s) => s.fulfill)

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

  const goal = cfg.goal.amount
  const progress = Math.min(1, totalEarned / goal)
  const ovens = ovenCount(upgrades)
  const cap = shelfCap(upgrades)
  const stockTotal = Object.values(shelf).reduce((a, b) => a + b, 0)
  const menu = unlockedPastries(totalEarned)

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

  const onBake = (id: string) => {
    if (bake(id)) {
      sfx.tap()
      haptic(6)
    } else {
      sfx.error()
      haptic(14)
    }
  }

  const onServe = (id: number) => {
    const r = fulfill(id)
    if (r) {
      sfx.coin()
      haptic(12)
      const fid = floaterId.current++
      setFloaters((f) => [...f.slice(-6), { id: fid, text: `+${formatNumber(r.earn)}` }])
      if (r.giftItem) burst({ particleCount: 26, origin: { y: 0.5 } })
    } else {
      sfx.error()
      haptic(16)
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
                  {stockTotal}/{cap}
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">витрина</div>
              </div>
              <div className="rounded-2xl bg-black/25 px-3 py-1.5">
                <div className="font-display text-lg font-extrabold leading-none tabular-nums text-emerald-300">
                  {formatNumber(served)}
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">заказов</div>
              </div>
            </div>
          </div>

          {/* ovens row */}
          <div className="flex gap-1.5">
            {Array.from({ length: ovens }, (_, i) => {
              const job = baking[i]
              const p = job ? pastryById(job.pastryId) : null
              const prog = job ? Math.min(1, 1 - (job.doneAt - now) / job.totalMs) : 0
              return (
                <div key={i} className="relative h-9 flex-1 overflow-hidden rounded-xl bg-black/30">
                  {job && (
                    <span className="absolute inset-0 bg-amber-500/25" style={{ width: `${prog * 100}%` }} />
                  )}
                  <span className="absolute inset-0 grid place-items-center text-lg leading-none">
                    {p ? p.emoji : '🔥'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* customers */}
        <div className="scroll-y relative min-h-0 flex-1 px-4 py-3">
          {customers.length === 0 ? (
            <div className="mt-12 text-center text-white/45">
              <div className="mb-2 text-5xl">🔔</div>
              <p className="text-sm">Пеки впрок — гости вот-вот придут!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence>
                {customers.map((c) => (
                  <CustomerCard key={c.id} c={c} now={now} shelf={shelf} onTap={onServe} />
                ))}
              </AnimatePresence>
            </div>
          )}

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

        {/* bake dock */}
        <div className="rounded-t-4xl bg-black/25 px-3 pb-safe pt-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">🥐 Печь на витрину</span>
            <button
              onClick={() => setShopOpen(true)}
              className="rounded-full bg-white/15 px-3 py-1 font-display text-sm font-semibold tap-none active:scale-95"
            >
              🏗️ Прокачка
            </button>
          </div>
          <div className="scroll-y flex gap-2 overflow-x-auto pb-1">
            {menu.map((p) => {
              const stock = shelf[p.id] ?? 0
              return (
                <button
                  key={p.id}
                  onPointerDown={() => onBake(p.id)}
                  className="relative flex w-[4.8rem] shrink-0 flex-col items-center gap-0.5 rounded-2xl bg-white/10 px-1.5 py-2 tap-none transition-all active:scale-95"
                >
                  <span className={cn('absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums', stock > 0 ? 'bg-emerald-500' : 'bg-black/70')}>
                    {stock}
                  </span>
                  <span className="text-2xl leading-none">{p.emoji}</span>
                  <span className="truncate text-[11px] font-semibold leading-tight">{p.name}</span>
                  <span className="text-[11px] font-bold tabular-nums text-[var(--accent-soft)]">
                    🪙 {formatNumber(p.price)}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-1 text-center text-[11px] text-white/40">
            Тапни выпечку — пеки про запас. Тапни гостя — выдай заказ с витрины.
          </p>
        </div>
      </div>

      <BakeryShopSheet open={shopOpen} onClose={() => setShopOpen(false)} />

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
