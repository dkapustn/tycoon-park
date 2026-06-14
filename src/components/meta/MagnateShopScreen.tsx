import { motion } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { MAGNATE_BOOSTS, boostCost } from '../../meta/progress'
import { formatNumber } from '../../lib/format'
import { sfx } from '../../lib/sound'
import { haptic } from '../../lib/haptics'
import { burst } from '../../lib/confetti'
import { StatBadge } from '../ui/StatBadge'
import { ScreenHeader } from '../ui/ScreenHeader'
import { cn } from '../../lib/cn'

export function MagnateShopScreen({ onBack }: { onBack: () => void }) {
  const diamonds = useGameStore((s) => s.meta.diamonds)
  const boosts = useGameStore((s) => s.meta.boosts)
  const buyBoost = useGameStore((s) => s.buyBoost)

  const onBuy = (id: string) => {
    if (buyBoost(id)) {
      sfx.buy()
      haptic(14)
      burst({ origin: { y: 0.55 }, particleCount: 40 })
    } else {
      sfx.error()
    }
  }

  return (
    <div className="app-bg absolute inset-0 flex flex-col">
      <ScreenHeader
        title="💠 Лавка магната"
        onBack={onBack}
        right={<StatBadge emoji="💎" value={formatNumber(diamonds)} />}
      />

      <p className="px-5 pb-1 text-center text-sm text-white/55">
        Вечные улучшения, которые действуют сразу во всех играх. Покупаются за 💎.
      </p>

      <div className="scroll-y flex-1 px-4 pb-10 pt-2">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          {MAGNATE_BOOSTS.map((b, i) => {
            const level = boosts[b.id] ?? 0
            const maxed = level >= b.maxLevel
            const cost = boostCost(b, level)
            const affordable = diamonds >= cost
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-3xl bg-gradient-to-br from-white/15 to-white/5 p-4 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-black/30 text-3xl">
                    {b.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg font-bold">{b.name}</div>
                    <div className="text-xs text-white/65">{b.describe(level + 1 > b.maxLevel ? b.maxLevel : level + 1)}</div>
                  </div>
                </div>

                {/* level pips */}
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: b.maxLevel }, (_, k) => (
                    <span
                      key={k}
                      className={cn('h-2 flex-1 rounded-full', k < level ? 'grad-accent' : 'bg-black/30')}
                    />
                  ))}
                </div>

                <button
                  disabled={maxed || !affordable}
                  onClick={() => onBuy(b.id)}
                  className={cn(
                    'mt-3 w-full rounded-2xl py-2.5 font-display font-bold tap-none transition-all active:scale-95',
                    maxed
                      ? 'bg-white/10 text-white/45'
                      : affordable
                        ? 'grad-accent shadow-pop'
                        : 'bg-white/10 text-white/45',
                  )}
                >
                  {maxed ? `Максимум (${b.maxLevel}/${b.maxLevel})` : `Улучшить · 💎 ${formatNumber(cost)}`}
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
