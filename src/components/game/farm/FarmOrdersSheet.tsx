import { AnimatePresence, motion } from 'framer-motion'
import { useFarmStore } from '../../../store/useFarmStore'
import { useGameStore } from '../../../store/useGameStore'
import { cropById } from '../../../games/farm/crops'
import { formatNumber } from '../../../lib/format'
import { sfx } from '../../../lib/sound'
import { haptic } from '../../../lib/haptics'
import { burst } from '../../../lib/confetti'
import { cn } from '../../../lib/cn'

export function FarmOrdersSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const orders = useFarmStore((s) => s.orders)
  const fulfill = useFarmStore((s) => s.fulfillOrder)
  const reroll = useFarmStore((s) => s.rerollOrder)
  const inventory = useGameStore((s) => s.inventory)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative max-h-[80vh] rounded-t-4xl bg-[var(--surface)] px-4 pt-3 pb-safe shadow-card"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/25" />
            <h2 className="mb-1 font-display text-lg font-bold">📋 Заказы рынка</h2>
            <p className="mb-3 text-xs text-white/55">
              Собери нужный урожай в амбар и выполни заказ — получишь монеты и 💎 алмазы.
            </p>

            <div className="scroll-y flex max-h-[60vh] flex-col gap-2 pb-2">
              {orders.map((o) => {
                const crop = cropById(o.cropId)
                const have = inventory[o.cropId] ?? 0
                const ready = have >= o.qty
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-2.5"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black/25 text-2xl">
                      {crop?.emoji ?? '🌱'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold">
                        {crop?.name ?? 'Урожай'} ×{o.qty}
                      </div>
                      <div className="text-xs text-white/60">
                        В амбаре: <span className={cn('tabular-nums', ready ? 'text-[var(--accent-soft)]' : 'text-white/60')}>{formatNumber(have)}</span> / {o.qty}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold tabular-nums text-white/80">
                        🪙 {formatNumber(o.coins)} · 💎 {o.diamonds}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        disabled={!ready}
                        onClick={() => {
                          if (fulfill(o.id)) {
                            sfx.coin()
                            haptic(16)
                            burst({ origin: { y: 0.7 } })
                          } else {
                            sfx.error()
                          }
                        }}
                        className={cn(
                          'rounded-xl px-3 py-2 font-display text-sm font-bold tap-none transition-all active:scale-95',
                          ready ? 'grad-accent shadow-pop' : 'bg-white/10 text-white/40',
                        )}
                      >
                        Сдать
                      </button>
                      <button
                        onClick={() => {
                          reroll(o.id)
                          sfx.tap()
                          haptic(6)
                        }}
                        className="rounded-xl bg-white/10 px-3 py-1 text-xs text-white/70 tap-none active:scale-95"
                      >
                        🔄 Другой
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
