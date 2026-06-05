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

// Items produced by the Coffee shop (Кофейня) — fills the "Товары" tab and the
// "Ценности" tab, all sellable for 💎.
const coffeeItems: ItemDef[] = [
  {
    id: 'coffee_beans',
    name: 'Мешок зёрен',
    emoji: '🫘',
    category: 'goods',
    source: 'coffee',
    rarity: 'rare',
    desc: 'Отборные обжаренные зёрна от благодарных гостей.',
    diamondValue: 2,
  },
  {
    id: 'croissant',
    name: 'Золотой круассан',
    emoji: '🥐',
    category: 'goods',
    source: 'coffee',
    rarity: 'epic',
    desc: 'Идеально слоёный. Гурманы платят за него алмазами.',
    diamondValue: 6,
  },
  {
    id: 'golden_cup',
    name: 'Золотая чашка',
    emoji: '🏆',
    category: 'treasure',
    source: 'coffee',
    rarity: 'epic',
    desc: 'Награда лучшему бариста. Чистое золото!',
    diamondValue: 12,
  },
  {
    id: 'barista_badge',
    name: 'Знак мастера',
    emoji: '🎖️',
    category: 'treasure',
    source: 'coffee',
    rarity: 'legendary',
    desc: 'Подарок от VIP-гостя. Большая редкость.',
    diamondValue: 30,
  },
]

// Items produced by the Пиццерия.
const pizzaItems: ItemDef[] = [
  {
    id: 'tomato_crate',
    name: 'Ящик томатов',
    emoji: '🍅',
    category: 'goods',
    source: 'pizza',
    rarity: 'rare',
    desc: 'Спелые томаты в подарок от довольного гостя.',
    diamondValue: 2,
  },
  {
    id: 'olive_oil',
    name: 'Оливковое масло',
    emoji: '🫒',
    category: 'goods',
    source: 'pizza',
    rarity: 'epic',
    desc: 'Первый отжим, экстра-класс. Гурманы ценят.',
    diamondValue: 6,
  },
  {
    id: 'golden_slice',
    name: 'Золотой кусочек',
    emoji: '🍕',
    category: 'treasure',
    source: 'pizza',
    rarity: 'epic',
    desc: 'Идеально испечённый ломтик. Хрустит золотом!',
    diamondValue: 13,
  },
  {
    id: 'pizzaiolo_medal',
    name: 'Медаль пиццайоло',
    emoji: '🏅',
    category: 'treasure',
    source: 'pizza',
    rarity: 'legendary',
    desc: 'Знак высшего мастерства от VIP-гостя.',
    diamondValue: 30,
  },
]

// Gems dug up in the Шахта.
const mineItems: ItemDef[] = [
  {
    id: 'amethyst',
    name: 'Аметист',
    emoji: '🟣',
    category: 'treasure',
    source: 'mine',
    rarity: 'rare',
    desc: 'Фиолетовый кристалл, выбитый из породы.',
    diamondValue: 3,
  },
  {
    id: 'topaz',
    name: 'Топаз',
    emoji: '🔶',
    category: 'treasure',
    source: 'mine',
    rarity: 'epic',
    desc: 'Тёплый золотистый самоцвет.',
    diamondValue: 7,
  },
  {
    id: 'sapphire',
    name: 'Сапфир',
    emoji: '🔷',
    category: 'treasure',
    source: 'mine',
    rarity: 'epic',
    desc: 'Глубокий синий камень редкой чистоты.',
    diamondValue: 11,
  },
  {
    id: 'mine_diamond',
    name: 'Чистый алмаз',
    emoji: '💎',
    category: 'treasure',
    source: 'mine',
    rarity: 'legendary',
    desc: 'Безупречный алмаз с самой глубины шахты.',
    diamondValue: 28,
  },
]

// Items gifted in the Пекарня.
const bakeryItems: ItemDef[] = [
  {
    id: 'cookies',
    name: 'Печенье',
    emoji: '🍪',
    category: 'goods',
    source: 'bakery',
    rarity: 'rare',
    desc: 'Тёплое домашнее печенье от благодарного гостя.',
    diamondValue: 2,
  },
  {
    id: 'donut',
    name: 'Глазурный пончик',
    emoji: '🍩',
    category: 'goods',
    source: 'bakery',
    rarity: 'epic',
    desc: 'Идеальная глазурь, тает во рту. Сладкоежки в восторге.',
    diamondValue: 6,
  },
  {
    id: 'celebration_cake',
    name: 'Праздничный торт',
    emoji: '🎂',
    category: 'treasure',
    source: 'bakery',
    rarity: 'epic',
    desc: 'Роскошный торт на заказ. Стоит хороших алмазов.',
    diamondValue: 13,
  },
  {
    id: 'master_baker',
    name: 'Колпак мастера',
    emoji: '👨‍🍳',
    category: 'treasure',
    source: 'bakery',
    rarity: 'legendary',
    desc: 'Знак великого пекаря, подарок VIP-гостя.',
    diamondValue: 30,
  },
]

export const ITEMS: ItemDef[] = [
  ...cropItems,
  ...treasures,
  ...coffeeItems,
  ...pizzaItems,
  ...mineItems,
  ...bakeryItems,
]

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

// Coffee-shop drop table (used when serving a happy or VIP customer).
const COFFEE_TABLE: { id: string; weight: number }[] = [
  { id: 'coffee_beans', weight: 58 },
  { id: 'croissant', weight: 26 },
  { id: 'golden_cup', weight: 13 },
  { id: 'barista_badge', weight: 3 },
]

export function rollCoffeeDrop(dropChance: number): string | null {
  if (Math.random() > dropChance) return null
  const total = COFFEE_TABLE.reduce((a, t) => a + t.weight, 0)
  let r = Math.random() * total
  for (const t of COFFEE_TABLE) {
    r -= t.weight
    if (r <= 0) return t.id
  }
  return COFFEE_TABLE[0].id
}

// Pizzeria drop table.
const PIZZA_TABLE: { id: string; weight: number }[] = [
  { id: 'tomato_crate', weight: 58 },
  { id: 'olive_oil', weight: 26 },
  { id: 'golden_slice', weight: 13 },
  { id: 'pizzaiolo_medal', weight: 3 },
]

export function rollPizzaDrop(dropChance: number): string | null {
  if (Math.random() > dropChance) return null
  const total = PIZZA_TABLE.reduce((a, t) => a + t.weight, 0)
  let r = Math.random() * total
  for (const t of PIZZA_TABLE) {
    r -= t.weight
    if (r <= 0) return t.id
  }
  return PIZZA_TABLE[0].id
}

// Mine gem table.
const MINE_TABLE: { id: string; weight: number }[] = [
  { id: 'amethyst', weight: 56 },
  { id: 'topaz', weight: 28 },
  { id: 'sapphire', weight: 12 },
  { id: 'mine_diamond', weight: 4 },
]

export function rollMineGem(dropChance: number): string | null {
  if (Math.random() > dropChance) return null
  const total = MINE_TABLE.reduce((a, t) => a + t.weight, 0)
  let r = Math.random() * total
  for (const t of MINE_TABLE) {
    r -= t.weight
    if (r <= 0) return t.id
  }
  return MINE_TABLE[0].id
}

// Bakery drop table.
const BAKERY_TABLE: { id: string; weight: number }[] = [
  { id: 'cookies', weight: 58 },
  { id: 'donut', weight: 26 },
  { id: 'celebration_cake', weight: 13 },
  { id: 'master_baker', weight: 3 },
]

export function rollBakeryDrop(dropChance: number): string | null {
  if (Math.random() > dropChance) return null
  const total = BAKERY_TABLE.reduce((a, t) => a + t.weight, 0)
  let r = Math.random() * total
  for (const t of BAKERY_TABLE) {
    r -= t.weight
    if (r <= 0) return t.id
  }
  return BAKERY_TABLE[0].id
}
