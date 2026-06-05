import { useEffect, useRef, useState } from 'react'
import type { GameConfig } from '../../../games/types'
import { useGameStore } from '../../../store/useGameStore'
import {
  useFarmStore,
  barnValue,
  barnCount,
  isRipe,
} from '../../../store/useFarmStore'
import { useFarmTick } from '../../../games/farm/useFarmTick'
import { formatNumber } from '../../../lib/format'
import { sfx } from '../../../lib/sound'
import { haptic } from '../../../lib/haptics'
import { burst, bigWin } from '../../../lib/confetti'
import { GameShell } from '../GameShell'
import { CompletionModal } from '../CompletionModal'
import { ProgressBar } from '../../ui/ProgressBar'
import { Plot } from './Plot'
import { SeedBar } from './SeedBar'
import { FarmShopSheet } from './FarmShopSheet'

export function FarmGame({ cfg, onExit }: { cfg: GameConfig; onExit: () => void }) {
  const now = useFarmTick()

  const coins = useFarmStore((s) => s.coins)
  const totalEarned = useFarmStore((s) => s.totalEarned)
  const plots = useFarmStore((s) => s.plots)
  const barn = useFarmStore((s) => s.barn)
  const upgrades = useFarmStore((s) => s.upgrades)
  const plant = useFarmStore((s) => s.plant)
  const water = useFarmStore((s) => s.water)
  const harvest = useFarmStore((s) => s.harvest)
  const sellAll = useFarmStore((s) => s.sellAll)

  const alreadyDone = useGameStore((s) => s.meta.completed.includes(cfg.id))
  const completeGame = useGameStore((s) => s.completeGame)

  const [shopOpen, setShopOpen] = useState(false)
  const [showWin, setShowWin] = useState(false)
  const [unlockedId, setUnlockedId] = useState<string | null>(null)
  const firedRef = useRef(false)
  const milestoneRef = useRef(0)

  const goal = cfg.goal.amount
  const progress = Math.min(1, totalEarned / goal)
  const stash = barnValue(barn, upgrades)
  const stashCount = barnCount(barn)

  // Win when the farm's lifetime earnings cross the goal.
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

  // Milestone pops on the way to the goal.
  useEffect(() => {
    const steps = [0.25, 0.5, 0.75]
    while (milestoneRef.current < steps.length && progress >= steps[milestoneRef.current]) {
      milestoneRef.current++
      if (!alreadyDone) {
        burst()
        sfx.coin()
        haptic(10)
      }
    }
  }, [progress, alreadyDone])

  const onPlotTap = (i: number) => {
    const plot = plots[i]
    if (!plot) return
    if (!plot.crop) {
      if (plant(i)) {
        sfx.buy()
        haptic(8)
      } else {
        sfx.error()
      }
    } else if (isRipe(plot, upgrades, now)) {
      if (harvest(i) > 0) {
        sfx.coin()
        haptic(12)
      }
    } else if (water(i)) {
      sfx.tap()
      haptic(5)
    } else {
      sfx.error()
    }
  }

  const onSell = () => {
    const earned = sellAll()
    if (earned > 0) {
      sfx.coin()
      haptic(16)
      burst({ origin: { y: 0.8 } })
    } else {
      sfx.error()
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
            <div className="font-display text-3xl font-extrabold tabular-nums text-shadow-pop">
              🪙 {formatNumber(coins)}
            </div>
            <button
              onClick={onSell}
              disabled={stashCount === 0}
              className="flex items-center gap-2 rounded-2xl grad-accent px-4 py-2.5 font-display font-bold shadow-pop tap-none transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100"
            >
              <span className="text-lg">🧺</span>
              <span className="flex flex-col items-start leading-none">
                <span className="text-sm">Продать {stashCount > 0 ? `×${stashCount}` : ''}</span>
                <span className="text-xs font-semibold text-white/85 tabular-nums">
                  +{formatNumber(stash)}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Field */}
        <div className="scroll-y min-h-0 flex-1 px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            {plots.map((plot, i) => (
              <Plot key={i} plot={plot} upgrades={upgrades} now={now} onTap={() => onPlotTap(i)} />
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-white/45">
            Тапни грядку: посадить · полить 💧 · собрать ✨
          </p>
        </div>

        {/* Dock: seeds + shop */}
        <div className="rounded-t-4xl bg-black/25 px-3 pb-safe pt-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">
              🌱 Семена
            </span>
            <button
              onClick={() => setShopOpen(true)}
              className="rounded-full bg-white/15 px-3 py-1 font-display text-sm font-semibold tap-none active:scale-95"
            >
              🏗️ Магазин
            </button>
          </div>
          <SeedBar />
        </div>
      </div>

      <FarmShopSheet open={shopOpen} onClose={() => setShopOpen(false)} />

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
