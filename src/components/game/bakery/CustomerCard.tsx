import { motion } from 'framer-motion'
import type { Customer } from '../../../store/useBakeryStore'
import { canFulfill } from '../../../store/useBakeryStore'
import { pastryById } from '../../../games/bakery/pastries'
import { itemById } from '../../../items/items'
import { formatNumber } from '../../../lib/format'
import { cn } from '../../../lib/cn'

interface Props {
  c: Customer
  now: number
  shelf: Record<string, number>
  onTap: (id: number) => void
}

export function CustomerCard({ c, now, shelf, onTap }: Props) {
  const waiting = c.status === 'waiting'
  const served = c.status === 'served'
  const left = c.status === 'left'
  const ready = waiting && canFulfill(shelf, c.order)
  const patience = Math.max(0, Math.min(1, (c.deadline - now) / c.patienceMs))
  const urgent = waiting && patience < 0.3

  const barColor = patience > 0.5 ? 'bg-emerald-400' : patience > 0.25 ? 'bg-amber-400' : 'bg-rose-500'

  return (
    <motion.button
      layout
      onPointerDown={() => waiting && onTap(c.id)}
      disabled={!waiting}
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{
        opacity: left ? 0.5 : 1,
        scale: served ? 1.04 : 1,
        y: 0,
        x: urgent ? [0, -2, 2, -2, 0] : 0,
      }}
      exit={{ opacity: 0, scale: 0.6, y: -20 }}
      transition={{ x: { repeat: urgent ? Infinity : 0, duration: 0.4 }, layout: { duration: 0.25 } }}
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-2xl p-2.5 tap-none no-select border shadow-inset',
        served && 'border-emerald-400/60 bg-emerald-500/15',
        left && 'border-rose-500/40 bg-rose-500/10',
        waiting && (ready ? 'border-emerald-400/70 bg-emerald-500/10' : 'border-white/12 bg-white/[0.06]'),
      )}
    >
      {c.vip && <span className="absolute -left-1 -top-1 text-base drop-shadow">👑</span>}
      <span className="text-3xl leading-none">{served ? '😄' : left ? '😤' : c.face}</span>

      {served ? (
        <div className="flex items-center gap-1 text-sm font-bold text-emerald-300 tabular-nums">
          +{formatNumber(c.earn)}
          {c.giftItem && <span>{itemById(c.giftItem)?.emoji ?? '🎁'}</span>}
        </div>
      ) : left ? (
        <div className="text-xs font-semibold text-rose-300">Ушёл…</div>
      ) : (
        <>
          {/* order combo */}
          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
            {Object.entries(c.order).map(([pid, qty]) => {
              const have = (shelf[pid] ?? 0) >= qty
              return (
                <span
                  key={pid}
                  className={cn('text-xs font-bold tabular-nums', have ? 'text-emerald-300' : 'text-white/80')}
                >
                  {pastryById(pid)?.emoji}
                  {qty}
                </span>
              )
            })}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <div className={cn('h-full rounded-full transition-[width] duration-150', barColor)} style={{ width: `${patience * 100}%` }} />
          </div>
        </>
      )}
    </motion.button>
  )
}
