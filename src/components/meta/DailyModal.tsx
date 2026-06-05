import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { DailyReward } from '../../store/useGameStore'
import { itemById } from '../../items/items'
import { sfx } from '../../lib/sound'
import { haptic } from '../../lib/haptics'
import { burst } from '../../lib/confetti'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DailyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const claimDaily = useGameStore((s) => s.claimDaily)
  const streak = useGameStore((s) => s.meta.daily.streak)
  const claimedToday = useGameStore((s) => s.meta.daily.lastClaim) === todayStr()
  const [reward, setReward] = useState<DailyReward | null>(null)

  const claim = () => {
    const r = claimDaily()
    if (r) {
      setReward(r)
      sfx.win()
      haptic(20)
      burst({ origin: { y: 0.5 } })
    }
  }

  const close = () => {
    setReward(null)
    onClose()
  }

  const item = reward?.itemId ? itemById(reward.itemId) : null

  return (
    <Modal open={open} onClose={close}>
      <div className="overflow-hidden rounded-4xl bg-[var(--surface)] p-6 text-center shadow-card">
        <div className="mx-auto mb-3 grid h-20 w-20 animate-popIn place-items-center rounded-full grad-accent text-5xl shadow-pop">
          {reward ? '🎉' : '🎁'}
        </div>

        {reward ? (
          <>
            <h2 className="font-display text-2xl font-bold text-shadow-pop">Награда дня!</h2>
            <p className="mt-1 text-sm text-white/70">Серия входов: {reward.streak} 🔥</p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-display text-lg font-bold">
                💎 +{reward.diamonds}
              </div>
              {item && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-display font-bold">
                  {item.emoji} {item.name}
                </div>
              )}
            </div>
            <Button variant="primary" className="mt-5 w-full" onClick={close}>
              Забрать
            </Button>
          </>
        ) : claimedToday ? (
          <>
            <h2 className="font-display text-2xl font-bold text-shadow-pop">Уже получено ✅</h2>
            <p className="mt-2 text-sm text-white/70">Заходи завтра за новой наградой!</p>
            {streak > 0 && <p className="mt-2 text-sm text-white/55">Серия: {streak} 🔥</p>}
            <Button variant="soft" className="mt-5 w-full" onClick={close}>
              Закрыть
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold text-shadow-pop">Ежедневный подарок</h2>
            <p className="mt-2 text-sm text-white/70">
              Заходи каждый день — серия растёт, а награда становится больше!
            </p>
            {streak > 0 && <p className="mt-2 text-sm text-white/55">Текущая серия: {streak} 🔥</p>}
            <Button variant="primary" className="mt-5 w-full" onClick={claim}>
              Открыть сундук 🎁
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
