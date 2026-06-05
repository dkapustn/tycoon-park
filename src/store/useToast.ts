import { create } from 'zustand'

export interface Toast {
  id: number
  emoji: string
  text: string
}

interface ToastStore {
  toasts: Toast[]
  push: (t: { emoji: string; text: string }) => void
  dismiss: (id: number) => void
}

let seq = 0

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  push: ({ emoji, text }) => {
    const id = seq++
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, emoji, text }] }))
    window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2800)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
