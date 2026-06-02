import type { GameConfig } from '../../games/types'
import { getConfig } from '../../games/registry'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface Props {
  open: boolean
  cfg: GameConfig
  unlockedId: string | null
  onMenu: () => void
  onContinue: () => void
}

export function CompletionModal({ open, cfg, unlockedId, onMenu, onContinue }: Props) {
  const next = unlockedId ? getConfig(unlockedId) : null
  return (
    <Modal open={open} onClose={onContinue}>
      <div className="overflow-hidden rounded-4xl bg-[var(--surface)] p-6 text-center shadow-card">
        <div className="mx-auto mb-3 grid h-20 w-20 animate-popIn place-items-center rounded-full grad-accent text-5xl shadow-pop">
          {cfg.emoji}
        </div>
        <h2 className="font-display text-2xl font-bold text-shadow-pop">{cfg.win.title}</h2>
        <p className="mt-2 text-sm text-white/75">{cfg.win.text}</p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
          <span className="text-xl">⭐</span>
          <span className="font-display font-bold">+{cfg.starReward} звёзд</span>
        </div>

        {next && (
          <div className="mt-4 rounded-2xl bg-black/25 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">Открыта новая игра</div>
            <div className="mt-1 font-display text-lg font-bold">
              {next.emoji} {next.title}
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={onMenu}>
            В меню
          </Button>
          <Button variant="primary" className="flex-1" onClick={onContinue}>
            Играть дальше
          </Button>
        </div>
      </div>
    </Modal>
  )
}
