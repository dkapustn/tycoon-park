import { motion } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { levelFromXp } from '../../meta/progress'
import { ACHIEVEMENTS } from '../../meta/achievements'
import { itemById } from '../../items/items'
import { formatNumber } from '../../lib/format'
import { StatBadge } from '../ui/StatBadge'
import { ScreenHeader } from '../ui/ScreenHeader'

interface Row {
  emoji: string
  label: string
  value: number
}

export function StatsScreen() {
  const meta = useGameStore((s) => s.meta)
  const inventory = useGameStore((s) => s.inventory)
  const back = () => history.back()

  const st = meta.stats
  const level = levelFromXp(st.coinsEarned).level
  const items = Object.entries(inventory).reduce((a, [id, n]) => a + (itemById(id) ? n : 0), 0)

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: '🏆 Общее',
      rows: [
        { emoji: '🏙️', label: 'Уровень магната', value: level },
        { emoji: '🪙', label: 'Монет заработано', value: st.coinsEarned },
        { emoji: '💎', label: 'Алмазов заработано', value: st.diamondsEarned },
        { emoji: '🎮', label: 'Игр пройдено', value: meta.completed.length },
        { emoji: '⭐', label: 'Достижений получено', value: meta.claimed.length },
        { emoji: '📦', label: 'Предметов в инвентаре', value: items },
      ],
    },
    {
      title: '🌱 Ферма',
      rows: [
        { emoji: '🌾', label: 'Урожая собрано', value: st.harvested },
        { emoji: '🧺', label: 'Урожая продано', value: st.cropsSold },
        { emoji: '📋', label: 'Заказов сдано', value: st.ordersFilled },
        { emoji: '🍀', label: 'Ценностей найдено', value: st.treasuresFound },
      ],
    },
    {
      title: '☕ Обслуживание гостей',
      rows: [
        { emoji: '🧑‍🍳', label: 'Гостей обслужено', value: st.served },
        { emoji: '👑', label: 'VIP-гостей', value: st.vipServed },
        { emoji: '🎁', label: 'Подарков получено', value: st.giftsReceived },
      ],
    },
    {
      title: '🍕 Пиццерия',
      rows: [
        { emoji: '🍕', label: 'Пицц испечено', value: st.pizzasBaked },
        { emoji: '🎯', label: 'Идеальных прожарок', value: st.perfectBakes },
      ],
    },
    {
      title: '⛏️ Шахта и 🍞 Пекарня',
      rows: [
        { emoji: '⛏️', label: 'Жил добыто', value: st.oresMined },
        { emoji: '🥐', label: 'Выпечки продано', value: st.pastriesSold },
      ],
    },
  ]

  return (
    <div className="app-bg absolute inset-0 flex flex-col">
      <ScreenHeader
        title="📊 Статистика"
        onBack={back}
        right={<StatBadge emoji="🏆" value={`${meta.claimed.length}/${ACHIEVEMENTS.length}`} />}
      />
      <div className="scroll-y flex-1 px-4 pb-10 pt-2">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          {sections.map((sec, i) => (
            <motion.div
              key={sec.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-3xl bg-white/[0.06] p-1.5"
            >
              <div className="px-3 py-2 font-display text-sm font-bold text-white/85">{sec.title}</div>
              <div className="flex flex-col gap-1">
                {sec.rows.map((r) => (
                  <div key={r.label} className="flex items-center gap-3 rounded-2xl bg-black/20 px-3 py-2.5">
                    <span className="text-xl leading-none">{r.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-white/75">{r.label}</span>
                    <span className="font-display text-base font-bold tabular-nums">{formatNumber(r.value)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
