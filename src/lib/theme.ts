import type { CSSProperties } from 'react'
import type { GameTheme } from '../games/types'

/** Maps a game's theme to the CSS custom properties used across the UI. */
export function themeVars(t: GameTheme): CSSProperties {
  return {
    '--grad-from': t.gradFrom,
    '--grad-to': t.gradTo,
    '--accent': t.accent,
    '--accent-soft': t.accentSoft,
    '--surface': t.surface,
    '--bg-0': t.bg0,
    '--bg-1': t.bg1,
    '--bg-2': t.bg2,
  } as CSSProperties
}
