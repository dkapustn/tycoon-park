import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { GameConfig } from '../../games/types'
import { useGameStore } from '../../store/useGameStore'
import { useIdleLoop } from '../../games/engine/useIdleLoop'
import { goalProgress, isGoalMet, totalRate } from '../../games/engine/selectors'
import { formatNumber, formatRate } from '../../lib/format'
import { sfx } from '../../lib/sound'
import { haptic } from '../../lib/haptics'
import { bigWin, burst } from '../../lib/confetti'
import { GameShell } from './GameShell'
import { GoalBar } from './GoalBar'
import { TapTarget } from './TapTarget'
import { ShopList } from './ShopList'
import { CompletionModal } from './CompletionModal'

export function IdleGame({ cfg, onExit }: { cfg: GameConfig; onExit: () => void }) {
  const ensureGame = useGameStore((s) => s.ensureGame)
  useLayoutEffect(() => {
    ensureGame(cfg.id)
  }, [cfg.id, ensureGame])
  useIdleLoop(cfg.id)

  const coins = useGameStore((s) => s.games[cfg.id]?.coins ?? 0)
  const rate = useGameStore((s) => {
    const g = s.games[cfg.id]
    return g ? totalRate(cfg, g) : 0
  })
  const met = useGameStore((s) => {
    const g = s.games[cfg.id]
    return g ? isGoalMet(cfg, g) : false
  })
  const progress = useGameStore((s) => {
    const g = s.games[cfg.id]
    return g ? goalProgress(cfg, g) : 0
  })
  const alreadyDone = useGameStore((s) => s.meta.completed.includes(cfg.id))
  const tap = useGameStore((s) => s.tap)
  const completeGame = useGameStore((s) => s.completeGame)

  const [showWin, setShowWin] = useState(false)
  const [unlockedId, setUnlockedId] = useState<string | null>(null)
  const firedRef = useRef(false)
  const milestoneRef = useRef(0)

  useEffect(() => {
    if (met && !firedRef.current && !alreadyDone) {
      firedRef.current = true
      const res = completeGame(cfg.id)
      setUnlockedId(res.unlockedId)
      setShowWin(true)
      sfx.win()
      bigWin()
    }
  }, [met, alreadyDone, cfg.id, completeGame])

  // Small confetti pops at 25 / 50 / 75% on the way to the goal.
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

  const handleTap = () => {
    const v = tap(cfg.id)
    sfx.tap()
    haptic(6)
    return v
  }

  return (
    <GameShell cfg={cfg} onBack={onExit}>
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
        <div className="flex flex-col gap-2 px-4 pt-1">
          <GoalBar cfg={cfg} />
          <div className="text-center">
            <div className="font-display text-4xl font-extrabold tabular-nums text-shadow-pop">
              {cfg.currency.emoji} {formatNumber(coins)}
            </div>
            <div className="text-sm text-white/65">
              {formatRate(rate)} {cfg.currency.emoji}/сек
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 place-items-center px-4">
          <TapTarget emoji={cfg.tapTarget.emoji} label={cfg.tapTarget.label} onTap={handleTap} />
        </div>

        <ShopList cfg={cfg} />
      </div>

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
