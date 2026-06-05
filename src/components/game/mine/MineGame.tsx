import { useEffect, useRef, useState } from 'react'
import type { GameConfig } from '../../../games/types'
import { useGameStore } from '../../../store/useGameStore'
import { useMineStore } from '../../../store/useMineStore'
import type { OfflineReport } from '../../../store/useMineStore'
import { useMineTick } from '../../../games/mine/useMineTick'
import { oreAtDepth, nextOre, autoDps } from '../../../games/mine/ores'
import { formatNumber, formatRate } from '../../../lib/format'
import { sfx } from '../../../lib/sound'
import { haptic } from '../../../lib/haptics'
import { burst, bigWin } from '../../../lib/confetti'
import { GameShell } from '../GameShell'
import { CompletionModal } from '../CompletionModal'
import { ProgressBar } from '../../ui/ProgressBar'
import { RockFace } from './RockFace'
import { MineShopSheet } from './MineShopSheet'
import { WelcomeBackModal } from './WelcomeBackModal'

export function MineGame({ cfg, onExit }: { cfg: GameConfig; onExit: () => void }) {
  useMineTick() // drives auto-miners; the component redraws via store subscriptions

  const coins = useMineStore((s) => s.coins)
  const totalEarned = useMineStore((s) => s.totalEarned)
  const depth = useMineStore((s) => s.depth)
  const veinHp = useMineStore((s) => s.veinHp)
  const upgrades = useMineStore((s) => s.upgrades)
  const mineTap = useMineStore((s) => s.mineTap)
  const collectOffline = useMineStore((s) => s.collectOffline)

  const diamonds = useGameStore((s) => s.meta.diamonds)
  const alreadyDone = useGameStore((s) => s.meta.completed.includes(cfg.id))
  const completeGame = useGameStore((s) => s.completeGame)

  const [shopOpen, setShopOpen] = useState(false)
  const [showWin, setShowWin] = useState(false)
  const [unlockedId, setUnlockedId] = useState<string | null>(null)
  const [offline, setOffline] = useState<OfflineReport | null>(null)
  const firedRef = useRef(false)
  const milestoneRef = useRef(0)
  const offlineRef = useRef(false)

  const goal = cfg.goal.amount
  const progress = Math.min(1, totalEarned / goal)
  const ore = oreAtDepth(depth)
  const next = nextOre(depth)
  const dps = autoDps(upgrades)

  // Collect idle/offline earnings once on entry, then surface the welcome-back
  // modal. Intentional run-once-on-mount state set.
  useEffect(() => {
    if (offlineRef.current) return
    offlineRef.current = true
    const r = collectOffline()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (r) setOffline(r)
  }, [collectOffline])

  useEffect(() => {
    if (totalEarned >= goal && !firedRef.current && !alreadyDone) {
      firedRef.current = true
      const res = completeGame(cfg.id)
      setUnlockedId(res.unlockedId)
      setShowWin(true)
      sfx.win()
      bigWin()
    }
  }, [totalEarned, goal, alreadyDone, cfg.id, completeGame])

  useEffect(() => {
    const steps = [0.25, 0.5, 0.75]
    while (milestoneRef.current < steps.length && progress >= steps[milestoneRef.current]) {
      milestoneRef.current++
      if (!alreadyDone) {
        burst()
        haptic(10)
      }
    }
  }, [progress, alreadyDone])

  const onTap = () => {
    const hit = mineTap()
    if (hit.broke > 0) {
      sfx.coin()
      haptic(12)
      if (hit.gems.length > 0) {
        sfx.unlock()
        burst({ particleCount: 30, origin: { y: 0.5 } })
      }
    } else {
      sfx.tap()
      haptic(4)
    }
    return hit
  }

  return (
    <GameShell cfg={cfg} onBack={onExit}>
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
        <div className="flex flex-col gap-2 px-4 pt-1">
          <div className="rounded-2xl bg-black/20 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-white/85">🎯 {cfg.goal.label}</span>
              <span className="tabular-nums text-white/60">{Math.floor(progress * 100)}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <div className="font-display text-3xl font-extrabold leading-none tabular-nums text-shadow-pop">
                🪙 {formatNumber(coins)}
              </div>
              <div className="mt-1 text-sm font-bold tabular-nums text-[var(--accent-soft)]">
                💎 {formatNumber(diamonds)}
              </div>
            </div>
            <div className="flex gap-2 text-center">
              <div className="rounded-2xl bg-black/25 px-3 py-1.5">
                <div className="font-display text-lg font-extrabold leading-none tabular-nums">
                  {formatNumber(depth)}
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">глубина</div>
              </div>
              <div className="rounded-2xl bg-black/25 px-3 py-1.5">
                <div className="font-display text-lg font-extrabold leading-none tabular-nums text-emerald-300">
                  {dps > 0 ? formatRate(dps) : '—'}
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">авто/сек</div>
              </div>
            </div>
          </div>

          {next && (
            <div className="text-center text-xs text-white/55">
              Следующий слой {next.emoji} {next.name} — через {formatNumber(next.depthFrom - depth)} жил
            </div>
          )}
        </div>

        <div className="grid min-h-0 flex-1 place-items-center px-4">
          <RockFace ore={ore} veinHp={veinHp} veinMax={ore.veinHp} onTap={onTap} />
        </div>

        <div className="rounded-t-4xl bg-black/25 px-3 pb-safe pt-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">
              💰 {ore.emoji} {formatNumber(ore.value)} / жила
            </span>
            <button
              onClick={() => setShopOpen(true)}
              className="rounded-full bg-white/15 px-3 py-1 font-display text-sm font-semibold tap-none active:scale-95"
            >
              🏗️ Снаряжение
            </button>
          </div>
          <p className="pb-1 text-center text-[11px] text-white/40">
            Тапай по породе — добывай руду и копай глубже. Шахтёры копают сами, даже офлайн!
          </p>
        </div>
      </div>

      <MineShopSheet open={shopOpen} onClose={() => setShopOpen(false)} />
      <WelcomeBackModal report={offline} onClose={() => setOffline(null)} />

      <CompletionModal
        open={showWin}
        cfg={cfg}
        unlockedId={unlockedId}
        onMenu={onExit}
        onContinue={() => setShowWin(false)}
      />
    </GameShell>
  )
}
