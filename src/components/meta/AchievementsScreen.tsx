import { motion } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { ACHIEVEMENTS, metricValue } from '../../meta/achievements'
import type { AchievementContext } from '../../meta/achievements'
import { levelFromXp } from '../../meta/progress'
import { formatNumber } from '../../lib/format'
import { sfx } from '../../lib/sound'
import { haptic } from '../../lib/haptics'
import { burst } from '../../lib/confetti'
import { StatBadge } from '../ui/StatBadge'
import { cn } from '../../lib/cn'

export function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const meta = useGameStore((s) => s.meta)
  const claim = useGameStore((s) => s.claimAchievement)

  const ctx: AchievementContext = {
    ...meta.stats,
    level: levelFromXp(meta.stats.coinsEarned).level,
    gamesCompleted: meta.completed.length,
  }

  const rows = ACHIEVEMENTS.map((a) => {
    const value = metricValue(a.metric, ctx)
    const done = value >= a.goal
    const claimed = meta.claimed.includes(a.id)
    return { a, value, done, claimed }
  })
  // Claimable first, then in-progress, then claimed.
  rows.sort((x, y) => {
    const rank = (r: typeof x) => (r.done && !r.claimed ? 0 : r.claimed ? 2 : 1)
    return rank(x) - rank(y)
  })

  const claimedCount = rows.filter((r) => r.claimed).length

  const onClaim = (id: string) => {
    if (claim(id)) {
      sfx.win()
      haptic(18)
      burst({ origin: { y: 0.5 } })
    } else {
      sfx.error()
    }
  }

  return (
    <div className="app-bg absolute inset-0 flex flex-col">
      <header className="pl-safe pr-safe pt-safe">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            aria-label="Назад"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12 text-2xl leading-none active:scale-95 tap-none"
          >
            ‹
          </button>
          <div className="flex-1 truncate text-center font-display text-lg font-bold">🏆 Достижения</div>
          <StatBadge emoji="💎" value={formatNumber(meta.diamonds)} />
        </div>
      </header>

      <div className="px-4 pb-1 text-center text-sm text-white/55">
        Получено {claimedCount} из {ACHIEVEMENTS.length}
      </div>

      <div className="scroll-y flex-1 px-4 pb-10 pt-2">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          {rows.map(({ a, value, done, claimed }, i) => {
            const pct = Math.min(1, value / a.goal)
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className={cn(
                  'flex items-center gap-3 rounded-2xl p-3',
                  claimed ? 'bg-white/[0.05]' : done ? 'bg-emerald-500/15 ring-1 ring-emerald-400/50' : 'bg-white/[0.07]',
                )}
              >
                <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black/25 text-2xl', claimed && 'opacity-60')}>
                  {a.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display font-semibold">{a.name}</span>
                    <span className="shrink-0 text-xs font-bold text-[var(--accent-soft)]">+{a.reward}💎</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
                    <div className="h-full rounded-full grad-accent" style={{ width: `${pct * 100}%` }} />
                  </div>
                  <div className="mt-0.5 text-[11px] tabular-nums text-white/50">
                    {formatNumber(Math.min(value, a.goal))} / {formatNumber(a.goal)}
                  </div>
                </div>
                {claimed ? (
                  <span className="shrink-0 text-xl text-emerald-400">✓</span>
                ) : (
                  <button
                    disabled={!done}
                    onClick={() => onClaim(a.id)}
                    className={cn(
                      'shrink-0 rounded-xl px-3 py-2 font-display text-sm font-bold tap-none transition-all active:scale-95',
                      done ? 'grad-accent shadow-pop' : 'bg-white/10 text-white/40',
                    )}
                  >
                    Забрать
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
