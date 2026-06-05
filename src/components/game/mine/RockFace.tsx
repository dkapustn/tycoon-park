import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { OreDef } from '../../../games/mine/ores'
import type { MineHit } from '../../../store/useMineStore'
import { itemById } from '../../../items/items'
import { formatNumber } from '../../../lib/format'
import { cn } from '../../../lib/cn'

interface Floater {
  id: number
  x: number
  y: number
  text: string
  gold: boolean
}

interface Props {
  ore: OreDef
  veinHp: number
  veinMax: number
  onTap: () => MineHit
}

export function RockFace({ ore, veinHp, veinMax, onTap }: Props) {
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [cracked, setCracked] = useState(0)
  const idRef = useRef(0)
  const progress = Math.max(0, Math.min(1, veinHp / veinMax))

  const handle = (e: PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const hit = onTap()
    setCracked((c) => c + 1)
    if (hit.broke > 0) {
      const gemEmoji = hit.gems.map((g) => itemById(g)?.emoji ?? '💎').join('')
      const id = idRef.current++
      setFloaters((f) => [
        ...f.slice(-12),
        { id, x, y, text: `+${formatNumber(hit.coins)}${gemEmoji ? ' ' + gemEmoji : ''}`, gold: hit.gems.length > 0 },
      ])
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center gap-4 no-select">
      <motion.button
        onPointerDown={handle}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 600, damping: 16 }}
        className="relative grid place-items-center rounded-[2rem] tap-none outline-none"
        style={{ width: 'min(64vw, 260px)', height: 'min(64vw, 260px)' }}
        aria-label="Добывать руду"
      >
        <span className="absolute -inset-3 rounded-[2.5rem] opacity-40 blur-2xl grad-accent" />
        <span className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-[#4b5563] to-[#1f2937] shadow-pop" />
        <span className="absolute inset-2 rounded-[1.6rem] bg-white/5" />
        <motion.span
          key={cracked}
          className="relative leading-none drop-shadow-lg"
          style={{ fontSize: 'min(28vw, 120px)' }}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.06, 1], rotate: [0, -2, 2, 0] }}
          transition={{ duration: 0.18 }}
        >
          {ore.emoji}
        </motion.span>

        {floaters.map((f) => (
          <motion.span
            key={f.id}
            className={cn(
              'pointer-events-none absolute left-0 top-0 font-display text-2xl font-extrabold text-shadow-pop',
              f.gold ? 'text-amber-300' : 'text-white',
            )}
            initial={{ opacity: 1, x: f.x - 10, y: f.y, scale: 0.7 }}
            animate={{ opacity: 0, x: f.x - 10, y: f.y - 120, scale: 1.25 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            onAnimationComplete={() => setFloaters((list) => list.filter((i) => i.id !== f.id))}
          >
            {f.text}
          </motion.span>
        ))}
      </motion.button>

      {/* vein HP bar */}
      <div className="w-[min(64vw,260px)]">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-white/80">
            {ore.emoji} {ore.name}
          </span>
          <span className="tabular-nums text-white/55">
            {formatNumber(Math.ceil(veinHp))}/{formatNumber(veinMax)}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-amber-400 transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
