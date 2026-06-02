import { cn } from '../../lib/cn'

interface Props {
  emoji: string
  value: string
  label?: string
  className?: string
}

export function StatBadge({ emoji, value, label, className }: Props) {
  return (
    <div className={cn('flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur', className)}>
      <span className="text-base leading-none">{emoji}</span>
      <span className="font-display font-bold tabular-nums leading-none">{value}</span>
      {label && <span className="text-xs text-white/60 leading-none">{label}</span>}
    </div>
  )
}
