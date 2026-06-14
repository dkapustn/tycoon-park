import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { useNav } from '../../store/useNav'
import { GAMES } from '../../games/registry'
import { levelFromXp } from '../../meta/progress'
import { ACHIEVEMENTS } from '../../meta/achievements'
import { rankForLevel, AVATARS } from '../../meta/ranks'
import { itemById } from '../../items/items'
import { formatNumber } from '../../lib/format'
import { sfx } from '../../lib/sound'
import { haptic } from '../../lib/haptics'
import { ScreenHeader } from '../ui/ScreenHeader'
import { ProgressBar } from '../ui/ProgressBar'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

function memberSince(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ProfileScreen() {
  const meta = useGameStore((s) => s.meta)
  const inventory = useGameStore((s) => s.inventory)
  const setProfileName = useGameStore((s) => s.setProfileName)
  const setAvatar = useGameStore((s) => s.setAvatar)
  const openStats = useNav((s) => s.openStats)
  const back = () => history.back()

  const [avatarOpen, setAvatarOpen] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [draftName, setDraftName] = useState(meta.profile.name)

  const lvl = levelFromXp(meta.stats.coinsEarned)
  const rank = rankForLevel(lvl.level)
  const items = Object.entries(inventory).reduce((a, [id, n]) => a + (itemById(id) ? n : 0), 0)

  const tiles = [
    { emoji: '💎', label: 'Алмазы', value: formatNumber(meta.diamonds) },
    { emoji: '⭐', label: 'Звёзды', value: formatNumber(meta.stars) },
    { emoji: '🏆', label: 'Награды', value: `${meta.claimed.length}/${ACHIEVEMENTS.length}` },
    { emoji: '🎮', label: 'Игр пройдено', value: `${meta.completed.length}/${GAMES.length}` },
    { emoji: '📦', label: 'Предметов', value: formatNumber(items) },
    { emoji: '🪙', label: 'Всего заработано', value: formatNumber(meta.stats.coinsEarned) },
  ]

  const pickAvatar = (a: string) => {
    setAvatar(a)
    sfx.tap()
    haptic(8)
    setAvatarOpen(false)
  }

  const saveName = () => {
    setProfileName(draftName)
    sfx.buy()
    haptic(10)
    setNameOpen(false)
  }

  return (
    <div className="app-bg absolute inset-0 flex flex-col">
      <ScreenHeader title="👤 Профиль" onBack={back} />

      <div className="scroll-y flex-1 px-4 pb-10 pt-2">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          {/* Identity card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="overflow-hidden rounded-4xl bg-gradient-to-br from-white/15 to-white/5 p-5 text-center shadow-card"
          >
            <button
              onClick={() => setAvatarOpen(true)}
              className="relative mx-auto grid h-24 w-24 place-items-center rounded-full grad-accent text-6xl shadow-pop tap-none active:scale-95"
            >
              {meta.profile.avatar}
              <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-sm">
                ✏️
              </span>
            </button>

            <button
              onClick={() => {
                setDraftName(meta.profile.name)
                setNameOpen(true)
              }}
              className="mt-3 inline-flex items-center gap-2 tap-none"
            >
              <span className="font-display text-2xl font-bold text-shadow-pop">{meta.profile.name}</span>
              <span className="text-sm opacity-60">✏️</span>
            </button>

            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-sm font-semibold">
              {rank.emoji} {rank.title} · ур. {lvl.level}
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-white/60">
                <span>Уровень {lvl.level}</span>
                <span>до {lvl.level + 1}: {formatNumber(Math.ceil(lvl.span - lvl.into))} 🪙</span>
              </div>
              <ProgressBar value={lvl.progress} />
            </div>

            <div className="mt-3 text-xs text-white/45">В Тайкун-Парке с {memberSince(meta.createdAt)}</div>
          </motion.div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-2">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-2xl bg-white/[0.06] px-2 py-3 text-center">
                <div className="font-display text-base font-extrabold leading-none tabular-nums">
                  {t.emoji} {t.value}
                </div>
                <div className="mt-1 text-[11px] text-white/55">{t.label}</div>
              </div>
            ))}
          </div>

          {/* Businesses */}
          <div className="rounded-3xl bg-white/[0.06] p-4">
            <div className="mb-2 font-display text-sm font-bold text-white/85">🏢 Мои бизнесы</div>
            <div className="flex justify-between gap-1">
              {GAMES.map((g) => {
                const done = meta.completed.includes(g.id)
                const unlocked = meta.unlocked.includes(g.id)
                return (
                  <div key={g.id} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn(
                        'grid h-12 w-12 place-items-center rounded-2xl text-2xl',
                        done ? 'grad-accent shadow-pop' : unlocked ? 'bg-white/12' : 'bg-black/30 opacity-40',
                      )}
                    >
                      {unlocked ? g.emoji : '🔒'}
                    </div>
                    <span className="text-[10px] leading-none text-white/55">{done ? '✓' : unlocked ? '…' : ''}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <Button variant="soft" className="w-full" onClick={openStats}>
            📊 Подробная статистика
          </Button>
        </div>
      </div>

      {/* Avatar picker */}
      <Modal open={avatarOpen} onClose={() => setAvatarOpen(false)}>
        <div className="rounded-4xl bg-[var(--surface)] p-5 shadow-card">
          <h2 className="mb-3 text-center font-display text-lg font-bold">Выбери аватар</h2>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => pickAvatar(a)}
                className={cn(
                  'grid aspect-square place-items-center rounded-2xl text-2xl tap-none active:scale-90',
                  a === meta.profile.avatar ? 'grad-accent shadow-pop' : 'bg-white/10',
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Name editor */}
      <Modal open={nameOpen} onClose={() => setNameOpen(false)}>
        <div className="rounded-4xl bg-[var(--surface)] p-5 shadow-card">
          <h2 className="mb-3 text-center font-display text-lg font-bold">Как тебя зовут?</h2>
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={18}
            autoFocus
            className="w-full rounded-2xl bg-black/30 px-4 py-3 text-center font-display text-lg font-bold text-white outline-none ring-2 ring-white/10 focus:ring-[var(--accent)]"
            placeholder="Магнат"
          />
          <div className="mt-4 flex gap-2">
            <Button variant="soft" className="flex-1" onClick={() => setNameOpen(false)}>
              Отмена
            </Button>
            <Button variant="primary" className="flex-1" onClick={saveName}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
