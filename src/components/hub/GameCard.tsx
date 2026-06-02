import { motion } from 'framer-motion'
import type { GameConfig } from '../../games/types'

export type CardStatus = 'locked' | 'unlocked' | 'completed'

interface Props {
  cfg: GameConfig
  status: CardStatus
  prevTitle: string
  index: number
  onOpen: () => void
}

export function GameCard({ cfg, status, prevTitle, index, onOpen }: Props) {
  const locked = status === 'locked'
  return (
    <motion.button
      onClick={locked ? undefined : onOpen}
      disabled={locked}
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 220, damping: 20 }}
      whileHover={locked ? undefined : { y: -5, scale: 1.02 }}
      whileTap={locked ? undefined : { scale: 0.97 }}
      className="relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-4xl p-4 text-left shadow-card no-select"
      style={{ backgroundImage: `linear-gradient(150deg, ${cfg.cardGradient[0]}, ${cfg.cardGradient[1]})` }}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />

      <div className="relative flex items-start justify-between gap-1">
        <span className="text-4xl drop-shadow-md sm:text-5xl">{cfg.emoji}</span>
        {status === 'completed' && (
          <span className="rounded-full bg-black/30 px-2 py-1 text-[11px] font-bold leading-none">✓ Пройдено</span>
        )}
        {status === 'unlocked' && !cfg.implemented && (
          <span className="rounded-full bg-black/35 px-2 py-1 text-[11px] font-semibold leading-none">Скоро</span>
        )}
      </div>

      <div className="relative">
        <h3 className="font-display text-xl font-bold text-shadow-pop sm:text-2xl">{cfg.title}</h3>
        <p className="text-xs leading-snug text-white/85 sm:text-sm">{cfg.tagline}</p>
        {!locked && (
          <span className="mt-2.5 inline-flex rounded-full bg-black/25 px-3 py-1.5 font-display text-xs font-semibold sm:text-sm">
            {status === 'completed' ? 'Играть снова' : 'Играть ▸'}
          </span>
        )}
      </div>

      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 px-3 text-center backdrop-blur-[2px]">
          <span className="text-4xl sm:text-5xl">🔒</span>
          <span className="text-xs font-semibold leading-snug text-white/90">
            Откроется после
            <br />«{prevTitle}»
          </span>
        </div>
      )}
    </motion.button>
  )
}
