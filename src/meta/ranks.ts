// Cosmetic progression flavour: a rank title per level and the avatar choices.

export interface Rank {
  title: string
  emoji: string
}

export function rankForLevel(level: number): Rank {
  if (level >= 30) return { title: 'Легенда Парка', emoji: '👑' }
  if (level >= 22) return { title: 'Титан бизнеса', emoji: '🏛️' }
  if (level >= 16) return { title: 'Воротила', emoji: '💰' }
  if (level >= 11) return { title: 'Магнат', emoji: '🏙️' }
  if (level >= 7) return { title: 'Бизнесмен', emoji: '📈' }
  if (level >= 3) return { title: 'Предприниматель', emoji: '💼' }
  return { title: 'Новичок', emoji: '🌱' }
}

export const AVATARS: string[] = [
  '🧑‍💼', '👩‍💼', '🧑‍🌾', '👩‍🍳', '🧑‍🍳', '👷', '🧑‍🔧', '🧑‍🚀',
  '🤴', '👸', '🦸', '🦹', '🧙', '🧛', '🧜', '🧚',
  '🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐯', '🐲',
  '🦄', '🤖', '👽', '🎅',
]
