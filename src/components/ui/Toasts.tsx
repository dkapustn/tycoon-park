import { AnimatePresence, motion } from 'framer-motion'
import { useToast } from '../../store/useToast'

/** Top-center reward popups (level-ups, achievement claims, etc.). */
export function Toasts() {
  const toasts = useToast((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 pt-safe">
      <div className="mt-2 flex flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 shadow-card backdrop-blur"
            >
              <span className="text-xl leading-none">{t.emoji}</span>
              <span className="font-display text-sm font-bold text-white">{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
