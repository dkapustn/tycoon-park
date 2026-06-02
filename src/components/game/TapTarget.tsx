import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { formatNumber } from '../../lib/format'

interface Floater {
  id: number
  x: number
  y: number
  text: string
}

interface Props {
  emoji: string
  label: string
  onTap: () => number
}

export function TapTarget({ emoji, label, onTap }: Props) {
  const [floaters, setFloaters] = useState<Floater[]>([])
  const idRef = useRef(0)

  const handle = (e: PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const gained = onTap()
    const id = idRef.current++
    setFloaters((f) => [...f.slice(-15), { id, x, y, text: `+${formatNumber(gained)}` }])
  }

  return (
    <div className="relative flex flex-col items-center justify-center gap-4 no-select">
      <motion.button
        onPointerDown={handle}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 600, damping: 16 }}
        className="relative grid place-items-center rounded-full tap-none outline-none"
        style={{ width: 'min(62vw, 256px)', height: 'min(62vw, 256px)' }}
        aria-label={label}
      >
        <span className="absolute -inset-3 rounded-full opacity-50 blur-2xl grad-accent" />
        <span className="absolute inset-0 rounded-full grad-accent opacity-95 shadow-pop" />
        <span className="absolute inset-3 rounded-full bg-white/10" />
        <span
          className="relative animate-bob leading-none drop-shadow-lg"
          style={{ fontSize: 'min(30vw, 128px)' }}
        >
          {emoji}
        </span>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            className="pointer-events-none absolute left-0 top-0 font-display text-2xl font-extrabold text-white text-shadow-pop"
            initial={{ opacity: 1, x: f.x - 10, y: f.y, scale: 0.7 }}
            animate={{ opacity: 0, x: f.x - 10, y: f.y - 120, scale: 1.25 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            onAnimationComplete={() => setFloaters((list) => list.filter((i) => i.id !== f.id))}
          >
            {f.text}
          </motion.span>
        ))}
      </motion.button>
      <div className="font-display font-semibold text-white/80">{label}</div>
    </div>
  )
}
