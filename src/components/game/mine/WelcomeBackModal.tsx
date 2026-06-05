import type { OfflineReport } from '../../../store/useMineStore'
import { formatNumber } from '../../../lib/format'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'

function humanDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} ч ${m} мин`
  if (m > 0) return `${m} мин`
  return `${seconds} сек`
}

export function WelcomeBackModal({ report, onClose }: { report: OfflineReport | null; onClose: () => void }) {
  return (
    <Modal open={report != null} onClose={onClose}>
      <div className="overflow-hidden rounded-4xl bg-[var(--surface)] p-6 text-center shadow-card">
        <div className="mx-auto mb-3 grid h-20 w-20 animate-popIn place-items-center rounded-full grad-accent text-5xl shadow-pop">
          👷
        </div>
        <h2 className="font-display text-2xl font-bold text-shadow-pop">С возвращением!</h2>
        <p className="mt-2 text-sm text-white/75">
          Твои шахтёры копали {report ? humanDuration(report.seconds) : ''} и добыли:
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-display text-xl font-bold">
          🪙 +{formatNumber(report?.coins ?? 0)}
        </div>
        <Button variant="primary" className="mt-5 w-full" onClick={onClose}>
          Забрать
        </Button>
      </div>
    </Modal>
  )
}
