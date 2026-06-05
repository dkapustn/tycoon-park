import { motion } from 'framer-motion'
import type { Customer } from '../../../store/useCoffeeStore'
import { customerMeter } from '../../../store/useCoffeeStore'
import { drinkById } from '../../../games/coffee/drinks'
import { itemById } from '../../../items/items'
import { formatNumber } from '../../../lib/format'
import { cn } from '../../../lib/cn'

interface Props {
  c: Customer
  now: number
  canBrew: boolean
  onTap: (id: number) => void
}

export function CustomerCard({ c, now, canBrew, onTap }: Props) {
  const drink = drinkById(c.drinkId)
  const meter = customerMeter(c, now)
  const waiting = c.status === 'waiting'
  const brewing = c.status === 'brewing'
  const served = c.status === 'served'
  const left = c.status === 'left'
  const urgent = waiting && meter < 0.3

  // Patience bar colour: green → amber → red as it drains.
  const barColor = brewing
    ? 'bg-[var(--accent)]'
    : meter > 0.5
      ? 'bg-emerald-400'
      : meter > 0.25
        ? 'bg-amber-400'
        : 'bg-rose-500'

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
        'relative flex flex-col items-center gap-1 rounded-2xl p-2.5 tap-none no-select',
        'border shadow-inset',
        served && 'border-emerald-400/60 bg-emerald-500/15',
        left && 'border-rose-500/40 bg-rose-500/10',
        brewing && 'border-white/15 bg-white/[0.06]',
        waiting && (canBrew ? 'border-white/15 bg-white/10' : 'border-white/10 bg-white/[0.05]'),
      )}
    >
      {c.vip && (
        <span className="absolute -left-1 -top-1 text-base drop-shadow" title="VIP-гость">
          👑
        </span>
      )}

      {/* avatar + order bubble */}
      <div className="relative">
        <span className="text-4xl leading-none">{served ? '😄' : left ? '😤' : c.face}</span>
        <span
          className={cn(
            'absolute -right-2 -top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-sm',
            urgent && 'ring-2 ring-rose-500',
          )}
        >
          {served ? '✅' : drink?.emoji ?? '☕'}
        </span>
      </div>

      {/* status line */}
      {served ? (
        <div className="flex items-center gap-1 text-sm font-bold text-emerald-300 tabular-nums">
          +{formatNumber(c.earn)}
          {c.giftItem && <span title="Подарок">{itemById(c.giftItem)?.emoji ?? '🎁'}</span>}
        </div>
      ) : left ? (
        <div className="text-xs font-semibold text-rose-300">Ушёл…</div>
      ) : (
        <>
          <div className="text-[11px] font-semibold tabular-nums text-white/70">
            {brewing ? 'Готовлю…' : `🪙 ${formatNumber(drink?.price ?? 0)}`}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className={cn('h-full rounded-full transition-[width] duration-150', barColor)}
              style={{ width: `${meter * 100}%` }}
            />
          </div>
        </>
      )}
    </motion.button>
  )
}
