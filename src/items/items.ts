import { CROPS } from '../games/farm/crops'

// The shared inventory holds items produced by every game. Each item declares
// its category (drives the inventory tabs) and which game it came from. Crops
// are generated from the farm's crop list so the two never drift apart.

export type ItemCategory = 'crop' | 'goods' | 'treasure'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface ItemDef {
  id: string
  name: string
  emoji: string
  category: ItemCategory
  /** Game id this item originates from, e.g. 'farm'. */
  source: string
  rarity: Rarity
  desc: string
  /** If set, the item can be sold from the inventory for this many 💎 each. */
  diamondValue?: number
}

const cropItems: ItemDef[] = CROPS.map((c) => ({
  id: c.id,
  name: c.name,
  emoji: c.emoji,
  category: 'crop',
  source: 'farm',
  rarity: 'common',
  desc: 'Свежий урожай с фермы. Продаётся на рынке за монеты.',
}))

const treasures: ItemDef[] = [
  {
    id: 'clover',
    name: 'Клевер удачи',
    emoji: '🍀',
    category: 'treasure',
    source: 'farm',
    rarity: 'rare',
    desc: 'Найден в земле во время сбора. Приносит удачу — и алмазы.',
    diamondValue: 2,
  },
  {
    id: 'gem_shard',
    name: 'Осколок алмаза',
    emoji: '💠',
    category: 'treasure',
    source: 'farm',
    rarity: 'rare',
    desc: 'Сверкающий кусочек, выкопанный из грядки.',
    diamondValue: 3,
  },
  {
    id: 'golden_veg',
    name: 'Золотой овощ',
    emoji: '🥇',
    category: 'treasure',
    source: 'farm',
    rarity: 'epic',
    desc: 'Невероятно редкая мутация. Коллекционеры платят алмазами.',
    diamondValue: 9,
  },
  {
    id: 'relic',
    name: 'Древний артефакт',
    emoji: '🏺',
    category: 'treasure',
    source: 'farm',
    rarity: 'legendary',
    desc: 'Реликвия, пролежавшая в земле века. Бесценна!',
    diamondValue: 25,
  },
]

export const ITEMS: ItemDef[] = [...cropItems, ...treasures]

const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]))

export function itemById(id: string): ItemDef | undefined {
  return ITEM_BY_ID.get(id)
}

/** Tabs shown in the inventory, in display order. */
export const CATEGORY_TABS: { id: ItemCategory; label: string; emoji: string }[] = [
  { id: 'crop', label: 'Урожай', emoji: '🌾' },
  { id: 'goods', label: 'Товары', emoji: '🍯' },
  { id: 'treasure', label: 'Ценности', emoji: '💎' },
]

export const RARITY_STYLE: Record<Rarity, { ring: string; glow: string; label: string }> = {
  common: { ring: 'ring-white/15', glow: '', label: 'Обычное' },
  rare: { ring: 'ring-sky-400/60', glow: 'shadow-[0_0_18px_-4px_rgba(56,189,248,0.7)]', label: 'Редкое' },
  epic: { ring: 'ring-fuchsia-400/60', glow: 'shadow-[0_0_18px_-4px_rgba(232,121,249,0.7)]', label: 'Эпическое' },
  legendary: { ring: 'ring-amber-300/70', glow: 'shadow-[0_0_22px_-2px_rgba(252,211,77,0.8)]', label: 'Легендарное' },
}

// Weighted treasure table used when a harvest "digs up" something rare.
const TREASURE_TABLE: { id: string; weight: number }[] = [
  { id: 'clover', weight: 50 },
  { id: 'gem_shard', weight: 30 },
  { id: 'golden_veg', weight: 14 },
  { id: 'relic', weight: 6 },
]

/** Rolls for a treasure given a 0..1 drop chance. Returns an item id or null. */
export function rollTreasure(dropChance: number): string | null {
  if (Math.random() > dropChance) return null
  const total = TREASURE_TABLE.reduce((a, t) => a + t.weight, 0)
  let r = Math.random() * total
  for (const t of TREASURE_TABLE) {
    r -= t.weight
    if (r <= 0) return t.id
  }
  return TREASURE_TABLE[0].id
}
