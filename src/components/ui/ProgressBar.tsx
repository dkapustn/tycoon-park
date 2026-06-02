import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <div className={cn('h-3 overflow-hidden rounded-full bg-black/30', className)}>
      <motion.div
        className="h-full rounded-full grad-accent"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      />
    </div>
  )
}
