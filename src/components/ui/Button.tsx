import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'soft' | 'ghost'

const styles: Record<Variant, string> = {
  primary: 'grad-accent text-white shadow-pop',
  soft: 'bg-white/15 text-white hover:bg-white/25',
  ghost: 'bg-transparent text-white/80 hover:text-white',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className, ...rest }: Props) {
  return (
    <button
      className={cn(
        'font-display font-semibold rounded-2xl px-5 py-3 no-select tap-none',
        'transition-all duration-150 active:scale-95 hover:brightness-105',
        'disabled:opacity-40 disabled:active:scale-100 disabled:hover:brightness-100',
        styles[variant],
        className,
      )}
      {...rest}
    />
  )
}
