import type { GameConfig } from '../../games/types'
import { useGameStore } from '../../store/useGameStore'
import { goalProgress } from '../../games/engine/selectors'
import { ProgressBar } from '../ui/ProgressBar'

export function GoalBar({ cfg }: { cfg: GameConfig }) {
  const progress = useGameStore((s) => {
    const g = s.games[cfg.id]
    return g ? goalProgress(cfg, g) : 0
  })
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-white/85">🎯 {cfg.goal.label}</span>
        <span className="tabular-nums text-white/60">{Math.floor(progress * 100)}%</span>
      </div>
      <ProgressBar value={progress} />
    </div>
  )
}
