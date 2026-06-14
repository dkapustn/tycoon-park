import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { ITEMS, CATEGORY_TABS, RARITY_STYLE, itemById } from '../../items/items'
import type { ItemCategory, ItemDef } from '../../items/items'
import { getConfig } from '../../games/registry'
import { formatNumber } from '../../lib/format'
import { sfx } from '../../lib/sound'
import { haptic } from '../../lib/haptics'
import { burst } from '../../lib/confetti'
import { StatBadge } from '../ui/StatBadge'
import { ScreenHeader } from '../ui/ScreenHeader'
import { cn } from '../../lib/cn'

type Tab = 'all' | ItemCategory

function sourceEmoji(source: string): string {
  try {
    return getConfig(source).emoji
  } catch {
    return '🎮'
  }
}

export function InventoryScreen({ onBack }: { onBack: () => void }) {
  const inventory = useGameStore((s) => s.inventory)
  const diamonds = useGameStore((s) => s.meta.diamonds)
  const sellItem = useGameStore((s) => s.sellItemForDiamonds)
  const [tab, setTab] = useState<Tab>('all')

  // Only show tabs that actually have at least one defined item.
  const tabs = useMemo(() => {
    const present = new Set(ITEMS.map((i) => i.category))
    return [{ id: 'all' as Tab, label: 'Всё', emoji: '🎒' }, ...CATEGORY_TABS.filter((t) => present.has(t.id))]
  }, [])

  const owned: { def: ItemDef; qty: number }[] = ITEMS.filter(
    (i) => (inventory[i.id] ?? 0) > 0 && (tab === 'all' || i.category === tab),
  ).map((def) => ({ def, qty: inventory[def.id] ?? 0 }))

  const totalItems = Object.entries(inventory).reduce(
    (a, [id, n]) => a + (itemById(id) ? n : 0),
    0,
  )

  const sell = (id: string) => {
    const got = sellItem(id)
    if (got > 0) {
      sfx.coin()
      haptic(14)
      burst({ origin: { y: 0.6 } })
    } else {
      sfx.error()
    }
  }

  return (
    <div className="app-bg absolute inset-0 flex flex-col">
      <ScreenHeader
        title="🎒 Инвентарь"
        onBack={onBack}
        right={<StatBadge emoji="💎" value={formatNumber(diamonds)} />}
      />

      {/* Tabs */}
      <div className="px-4 pt-1">
        <div className="flex gap-1 overflow-x-auto rounded-full bg-black/30 p-1 scroll-y">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 whitespace-nowrap rounded-full px-3 py-1.5 font-display text-sm font-semibold transition-colors tap-none',
                tab === t.id ? 'grad-accent text-white' : 'text-white/60',
              )}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-y flex-1 px-4 pb-10 pt-3">
        {owned.length === 0 ? (
          <div className="mt-16 text-center text-white/50">
            <div className="mb-3 text-6xl">📦</div>
            <p className="font-display text-lg font-semibold">Пока пусто</p>
            <p className="mt-1 text-sm">
              Играй в тайкуны — собранные предметы появятся здесь. Например, урожай с фермы.
            </p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
            {owned.map(({ def, qty }, i) => {
              const r = RARITY_STYLE[def.rarity]
              return (
                <motion.div
                  key={def.id}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 240, damping: 20 }}
                  className={cn(
                    'relative flex flex-col rounded-2xl bg-white/[0.07] p-3 ring-1',
                    r.ring,
                    r.glow,
                  )}
                >
                  <span className="absolute right-2 top-2 text-xs" title={sourceEmoji(def.source)}>
                    {sourceEmoji(def.source)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl leading-none">{def.emoji}</span>
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold tabular-nums">
                      ×{formatNumber(qty)}
                    </span>
                  </div>
                  <div className="mt-1.5 font-display text-sm font-semibold leading-tight">{def.name}</div>
                  <div className="text-[11px] text-white/45">{r.label}</div>

                  {def.diamondValue ? (
                    <button
                      onClick={() => sell(def.id)}
                      className="mt-2 rounded-xl grad-accent px-2 py-1.5 font-display text-xs font-bold tap-none active:scale-95"
                    >
                      Продать всё · 💎 {formatNumber(def.diamondValue * qty)}
                    </button>
                  ) : (
                    <div className="mt-2 text-[11px] leading-snug text-white/45">{def.desc}</div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {totalItems > 0 && (
          <p className="mt-6 text-center text-xs text-white/35">Всего предметов: {formatNumber(totalItems)}</p>
        )}
      </div>
    </div>
  )
}
