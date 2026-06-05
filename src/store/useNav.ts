import { create } from 'zustand'

export type Screen =
  | { name: 'hub' }
  | { name: 'game'; id: string }
  | { name: 'soon'; id: string }
  | { name: 'inventory' }
  | { name: 'achievements' }
  | { name: 'shop' }

interface NavState {
  screen: Screen
  openGame: (id: string) => void
  openSoon: (id: string) => void
  openInventory: () => void
  openAchievements: () => void
  openShop: () => void
  goHome: () => void
}

// Sub-screens push a history entry so the in-app back button and the device/
// browser back button share one path (back() -> popstate -> goHome).
export const useNav = create<NavState>((set) => ({
  screen: { name: 'hub' },
  openGame: (id) => {
    history.pushState({ nav: 'game' }, '')
    set({ screen: { name: 'game', id } })
  },
  openSoon: (id) => {
    history.pushState({ nav: 'soon' }, '')
    set({ screen: { name: 'soon', id } })
  },
  openInventory: () => {
    history.pushState({ nav: 'inventory' }, '')
    set({ screen: { name: 'inventory' } })
  },
  openAchievements: () => {
    history.pushState({ nav: 'achievements' }, '')
    set({ screen: { name: 'achievements' } })
  },
  openShop: () => {
    history.pushState({ nav: 'shop' }, '')
    set({ screen: { name: 'shop' } })
  },
  goHome: () => set({ screen: { name: 'hub' } }),
}))
