import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { useNav } from '../../store/useNav'
import { cn } from '../../lib/cn'

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors tap-none',
        checked ? 'grad-accent' : 'bg-white/20',
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-6' : 'left-1',
        )}
      />
    </button>
  )
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useGameStore((s) => s.meta.settings)
  const setSetting = useGameStore((s) => s.setSetting)
  const openProfile = useNav((s) => s.openProfile)
  const openStats = useNav((s) => s.openStats)

  const go = (fn: () => void) => {
    onClose()
    fn()
  }

  const resetAll = () => {
    if (confirm('Сбросить весь прогресс? Это нельзя отменить.')) {
      localStorage.removeItem('tycoon-arcade-v1')
      localStorage.removeItem('tycoon-farm-v1')
      localStorage.removeItem('tycoon-coffee-v1')
      localStorage.removeItem('tycoon-pizza-v1')
      localStorage.removeItem('tycoon-mine-v1')
      localStorage.removeItem('tycoon-bakery-v1')
      location.reload()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="absolute inset-x-0 bottom-0 rounded-t-4xl bg-[#1d1830] p-6 pb-safe"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <h2 className="mb-3 font-display text-xl font-bold">Настройки</h2>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => go(openProfile)}
                className="rounded-2xl bg-white/10 py-3 font-display font-semibold tap-none active:scale-95"
              >
                👤 Профиль
              </button>
              <button
                onClick={() => go(openStats)}
                className="rounded-2xl bg-white/10 py-3 font-display font-semibold tap-none active:scale-95"
              >
                📊 Статистика
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="font-semibold">🔊 Звук</div>
                <div className="text-xs text-white/55">Клики, покупки, победы</div>
              </div>
              <Switch checked={settings.sound} onChange={(v) => setSetting('sound', v)} />
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="font-semibold">📳 Вибрация</div>
                <div className="text-xs text-white/55">Тактильный отклик на действия</div>
              </div>
              <Switch checked={settings.haptics} onChange={(v) => setSetting('haptics', v)} />
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="font-semibold">🍃 Меньше анимаций</div>
                <div className="text-xs text-white/55">Спокойнее и экономит батарею</div>
              </div>
              <Switch checked={settings.reducedMotion} onChange={(v) => setSetting('reducedMotion', v)} />
            </div>

            <button
              onClick={resetAll}
              className="mt-5 w-full rounded-2xl bg-red-500/20 py-3 font-display font-semibold text-red-200 transition active:scale-95 tap-none"
            >
              Сбросить прогресс
            </button>
            <p className="mt-4 text-center text-xs text-white/35">Тайкун-Парк · v1.1</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
