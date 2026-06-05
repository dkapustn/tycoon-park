import { motion } from 'framer-motion'
import type { PointerEvent } from 'react'
import type { Plot as PlotData } from '../../../store/useFarmStore'
import { plotProgress } from '../../../store/useFarmStore'
import { cropById } from '../../../games/farm/crops'
import { cn } from '../../../lib/cn'

interface Props {
  plot: PlotData
  upgrades: Record<string, number>
  now: number
  onTap: (e: PointerEvent<HTMLButtonElement>) => void
}

/** A single soil tile: bare → seedling → sprout → ripe (tap to harvest). */
export function Plot({ plot, upgrades, now, onTap }: Props) {
  const crop = plot.crop ? cropById(plot.crop) : undefined
  const progress = plotProgress(plot, upgrades, now)
  const ripe = crop != null && progress >= 1

  const stageEmoji = !crop ? '' : ripe ? crop.emoji : progress < 0.5 ? '🌱' : '🌿'

  return (
    <motion.button
      onPointerDown={onTap}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 600, damping: 18 }}
      className={cn(
        'relative grid aspect-square place-items-center overflow-hidden rounded-2xl tap-none no-select',
        'border shadow-inset',
        crop
          ? 'border-black/20 bg-gradient-to-b from-[#6b4423] to-[#3f2713]'
          : 'border-dashed border-white/20 bg-black/20',
      )}
      aria-label={crop ? (ripe ? 'Собрать урожай' : 'Полить') : 'Посадить'}
    >
      {/* soil furrows */}
      {crop && (
        <span className="pointer-events-none absolute inset-x-1 bottom-1 top-1/2 rounded-md bg-black/15" />
      )}

      {!crop && <span className="text-2xl text-white/25">＋</span>}

      {crop && (
        <motion.span
          key={stageEmoji}
          className={cn('relative leading-none drop-shadow-md', ripe && 'animate-bob')}
          style={{ fontSize: ripe ? '2.4rem' : `${1.1 + progress * 1.3}rem` }}
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {stageEmoji}
        </motion.span>
      )}

      {/* ripe glow + sparkle prompt */}
      {ripe && (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-[var(--accent-soft)] animate-pulseGlow" />
          <span className="pointer-events-none absolute right-1 top-1 text-sm">✨</span>
        </>
      )}

      {/* growth bar */}
      {crop && !ripe && (
        <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 h-1.5 overflow-hidden rounded-full bg-black/40">
          <span
            className="block h-full rounded-full grad-accent transition-[width] duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </span>
      )}
    </motion.button>
  )
}
