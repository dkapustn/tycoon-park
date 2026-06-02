import { useState } from 'react'
import type { GameConfig } from '../../games/types'
import { useGameStore } from '../../store/useGameStore'
import { buildingCost } from '../../games/engine/selectors'
import { formatNumber, formatRate } from '../../lib/format'
import { sfx } from '../../lib/sound'
import { haptic } from '../../lib/haptics'
import { cn } from '../../lib/cn'
import { ShopItem } from './ShopItem'

export function ShopList({ cfg }: { cfg: GameConfig }) {
  const [tab, setTab] = useState<'buildings' | 'upgrades'>('buildings')
  const coins = useGameStore((s) => s.games[cfg.id]?.coins ?? 0)
  const buildings = useGameStore((s) => s.games[cfg.id]?.buildings)
  const upgrades = useGameStore((s) => s.games[cfg.id]?.upgrades)
  const buyBuilding = useGameStore((s) => s.buyBuilding)
  const buyUpgrade = useGameStore((s) => s.buyUpgrade)

  const owned = buildings ?? {}
  const bought = upgrades ?? []

  const buy = (ok: boolean) => {
    if (ok) {
      sfx.buy()
      haptic(12)
    } else {
      sfx.error()
    }
  }

  const allUpgradesBought = cfg.upgrades.length > 0 && cfg.upgrades.every((u) => bought.includes(u.id))

  return (
    <div className="flex h-[40vh] max-h-[440px] min-h-0 flex-col rounded-t-4xl bg-black/25 px-3 pb-safe pt-2.5">
      <div className="mb-2 flex gap-1 rounded-full bg-black/30 p-1">
        {(['buildings', 'upgrades'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-full py-1.5 font-display text-sm font-semibold transition-colors tap-none',
              tab === t ? 'grad-accent text-white' : 'text-white/60',
            )}
          >
            {t === 'buildings' ? '🏗️ Здания' : '⚡ Улучшения'}
          </button>
        ))}
      </div>

      <div className="scroll-y flex min-h-0 flex-1 flex-col gap-2">
        {tab === 'buildings' &&
          cfg.buildings.map((b) => {
            const count = owned[b.id] ?? 0
            const cost = buildingCost(cfg, b.id, count)
            return (
              <ShopItem
                key={b.id}
                emoji={b.emoji}
                title={b.name}
                subtitle={`+${formatRate(b.baseRate)} ${cfg.currency.emoji}/сек`}
                owned={count}
                cost={`${cfg.currency.emoji} ${formatNumber(cost)}`}
                affordable={coins >= cost}
                onBuy={() => buy(buyBuilding(cfg.id, b.id))}
              />
            )
          })}

        {tab === 'upgrades' &&
          cfg.upgrades.map((u) => (
            <ShopItem
              key={u.id}
              emoji={u.emoji}
              title={u.name}
              subtitle={u.desc}
              done={bought.includes(u.id)}
              cost={`${cfg.currency.emoji} ${formatNumber(u.cost)}`}
              affordable={coins >= u.cost}
              onBuy={() => buy(buyUpgrade(cfg.id, u.id))}
            />
          ))}

        {tab === 'upgrades' && allUpgradesBought && (
          <div className="py-6 text-center text-sm text-white/50">Все улучшения куплены! 🎉</div>
        )}
      </div>
    </div>
  )
}
