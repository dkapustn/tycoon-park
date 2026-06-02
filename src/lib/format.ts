const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc']

/** 1234 -> "1.23K", 1_500_000 -> "1.5M". Compact idle-game style. */
export function formatNumber(value: number): string {
  if (!isFinite(value)) return '∞'
  let n = Math.floor(value)
  if (n < 1000) return String(n)
  let tier = 0
  while (n >= 1000 && tier < UNITS.length - 1) {
    n /= 1000
    tier++
  }
  const str = n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)
  return `${str}${UNITS[tier]}`
}

/** Per-second rate: keep one decimal for small values so trickle income reads nicely. */
export function formatRate(value: number): string {
  if (value > 0 && value < 100) {
    return (Math.round(value * 10) / 10).toString()
  }
  return formatNumber(value)
}
