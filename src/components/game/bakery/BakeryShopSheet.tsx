import { AnimatePresence, motion } from 'framer-motion'
import { useBakeryStore } from '../../../store/useBakeryStore'
import { useGameStore } from '../../../store/useGameStore'
import { BAKERY_UPGRADES } from '../../../games/bakery/pastries'
import { formatNumber } from '../../../lib/format'
import { sfx } from '../../../lib/sound'
import { haptic } from '../../../lib/haptics'
import { ShopItem } from '../ShopItem'

export function BakeryShopSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const coins = useBakeryStore((s) => s.coins)
  const upgrades = useBakeryStore((s) => s.upgrades)
  const buyUpgrade = useBakeryStore((s) => s.buyUpgrade)
  const diamonds = useGameStore((s) => s.meta.diamonds)

  const buy = (ok: boolean) => {
    if (ok) {
      sfx.buy()
      haptic(12)
    } else {
      sfx.error()
    }
  }

  const coinUpgrades = BAKERY_UPGRADES.filter((u) => u.currency !== 'diamonds')
  const gemUpgrades = BAKERY_UPGRADES.filter((u) => u.currency === 'diamonds')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative max-h-[80vh] rounded-t-4xl bg-[var(--surface)] px-4 pt-3 pb-safe shadow-card"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/25" />
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">🏗️ Прокачка пекарни</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-black/30 px-3 py-1 font-display text-sm font-bold tabular-nums">
                  🪙 {formatNumber(coins)}
                </span>
                <span className="rounded-full bg-black/30 px-3 py-1 font-display text-sm font-bold tabular-nums">
                  💎 {formatNumber(diamonds)}
                </span>
              </div>
            </div>

            <div className="scroll-y flex max-h-[64vh] flex-col gap-2 pb-2">
              <div className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-white/50">
                Улучшения
              </div>
              {coinUpgrades.map((u) => {
                const level = upgrades[u.id] ?? 0
                const maxed = level >= u.maxLevel
                const cost = Math.ceil(u.baseCost * Math.pow(u.costGrowth, level))
                return (
                  <ShopItem
                    key={u.id}
                    emoji={u.emoji}
                    title={u.maxLevel > 1 ? `${u.name} (${level}/${u.maxLevel})` : u.name}
                    subtitle={u.describe(level + 1)}
                    owned={u.maxLevel > 1 ? level : undefined}
                    done={maxed}
                    cost={maxed ? undefined : `🪙 ${formatNumber(cost)}`}
                    affordable={coins >= cost}
                    onBuy={() => buy(buyUpgrade(u.id))}
                  />
                )
              })}

              <div className="px-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent-soft)]">
                💎 Премиум (за алмазы)
              </div>
              {gemUpgrades.map((u) => {
                const level = upgrades[u.id] ?? 0
                const maxed = level >= u.maxLevel
                const cost = Math.ceil(u.baseCost * Math.pow(u.costGrowth, level))
                return (
                  <ShopItem
                    key={u.id}
                    emoji={u.emoji}
                    title={u.maxLevel > 1 ? `${u.name} (${level}/${u.maxLevel})` : u.name}
                    subtitle={u.describe(level + 1)}
                    owned={u.maxLevel > 1 ? level : undefined}
                    done={maxed}
                    cost={maxed ? undefined : `💎 ${formatNumber(cost)}`}
                    affordable={diamonds >= cost}
                    onBuy={() => buy(buyUpgrade(u.id))}
                  />
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
