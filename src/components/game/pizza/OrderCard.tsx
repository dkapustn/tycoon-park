import { motion } from 'framer-motion'
import type { Order } from '../../../store/usePizzaStore'
import { bakeProgress, patienceMeter } from '../../../store/usePizzaStore'
import { pizzaById, perfectFrom, BURNT_AT } from '../../../games/pizza/pizzas'
import { itemById } from '../../../items/items'
import { formatNumber } from '../../../lib/format'
import { cn } from '../../../lib/cn'

interface Props {
  o: Order
  now: number
  upgrades: Record<string, number>
  canBake: boolean
  onStart: (id: number) => void
  onPull: (id: number) => void
}

const QUALITY_LABEL: Record<string, { text: string; cls: string }> = {
  perfect: { text: 'Идеально!', cls: 'text-emerald-300' },
  under: { text: 'Сыровато', cls: 'text-amber-300' },
  over: { text: 'Передержал', cls: 'text-orange-300' },
  burnt: { text: 'Сгорела 🔥', cls: 'text-rose-300' },
}

export function OrderCard({ o, now, upgrades, canBake, onStart, onPull }: Props) {
  const pizza = pizzaById(o.pizzaId)
  const waiting = o.status === 'waiting'
  const baking = o.status === 'baking'
  const served = o.status === 'served'
  const left = o.status === 'left'

  const patience = patienceMeter(o, now)
  const progress = bakeProgress(o, now)
  const pStart = perfectFrom(upgrades)
  const inPerfect = baking && progress >= pStart && progress <= 1
  const burning = baking && progress > 1
  const urgentWait = waiting && patience < 0.3

  const fillColor = !baking
    ? 'bg-[var(--accent)]'
    : burning
      ? 'bg-rose-500'
      : inPerfect
        ? 'bg-emerald-400'
        : 'bg-amber-400'

  const patColor = patience > 0.5 ? 'bg-emerald-400' : patience > 0.25 ? 'bg-amber-400' : 'bg-rose-500'

  const onTap = () => {
    if (waiting) onStart(o.id)
    else if (baking) onPull(o.id)
  }

  return (
    <motion.button
      layout
      onPointerDown={onTap}
      disabled={served || left}
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{
        opacity: left ? 0.5 : 1,
        scale: inPerfect ? 1.05 : served ? 1.04 : 1,
        y: 0,
        x: urgentWait || burning ? [0, -2, 2, -2, 0] : 0,
      }}
      exit={{ opacity: 0, scale: 0.6, y: -20 }}
      transition={{ x: { repeat: urgentWait || burning ? Infinity : 0, duration: 0.4 }, layout: { duration: 0.25 } }}
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-2xl p-2.5 tap-none no-select border shadow-inset',
        served && 'border-emerald-400/60 bg-emerald-500/15',
        left && 'border-rose-500/40 bg-rose-500/10',
        inPerfect && 'border-emerald-400 bg-emerald-500/15',
        baking && !inPerfect && 'border-amber-400/40 bg-amber-500/10',
        waiting && (canBake ? 'border-white/15 bg-white/10' : 'border-white/10 bg-white/[0.05]'),
      )}
    >
      {o.vip && <span className="absolute -left-1 -top-1 text-base drop-shadow">👑</span>}

      <div className="relative">
        <span className="text-4xl leading-none">
          {served ? '😄' : left ? (o.quality === 'burnt' ? '🍕' : '😤') : baking ? '🍕' : o.face}
        </span>
        {waiting && (
          <span className={cn('absolute -right-2 -top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-sm', urgentWait && 'ring-2 ring-rose-500')}>
            {pizza?.emoji ?? '🍕'}
          </span>
        )}
        {burning && <span className="absolute -right-1 -top-1 text-sm">🔥</span>}
      </div>

      {served ? (
        <div className={cn('flex items-center gap-1 text-sm font-bold tabular-nums', QUALITY_LABEL[o.quality ?? 'perfect']?.cls)}>
          +{formatNumber(o.earn)}
          {o.giftItem && <span>{itemById(o.giftItem)?.emoji ?? '🎁'}</span>}
        </div>
      ) : left ? (
        <div className={cn('text-xs font-semibold', QUALITY_LABEL[o.quality ?? 'burnt']?.cls ?? 'text-rose-300')}>
          {o.quality === 'burnt' ? 'Сгорела 🔥' : 'Ушёл…'}
        </div>
      ) : baking ? (
        <>
          <div className={cn('text-[11px] font-bold leading-none', inPerfect ? 'text-emerald-300' : burning ? 'text-rose-300' : 'text-amber-300')}>
            {inPerfect ? 'ДОСТАВАЙ!' : burning ? 'Горит!' : 'Печётся…'}
          </div>
          {/* bake bar with perfect zone band */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/40">
            <span
              className="absolute inset-y-0 bg-emerald-400/30"
              style={{ left: `${(pStart / BURNT_AT) * 100}%`, width: `${((1 - pStart) / BURNT_AT) * 100}%` }}
            />
            <span className="absolute inset-y-0 w-px bg-white/60" style={{ left: `${(1 / BURNT_AT) * 100}%` }} />
            <span
              className={cn('absolute inset-y-0 left-0 rounded-full', fillColor)}
              style={{ width: `${Math.min(100, (progress / BURNT_AT) * 100)}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="text-[11px] font-semibold tabular-nums text-white/70">🪙 {formatNumber(pizza?.price ?? 0)}</div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <div className={cn('h-full rounded-full transition-[width] duration-150', patColor)} style={{ width: `${patience * 100}%` }} />
          </div>
        </>
      )}
    </motion.button>
  )
}
