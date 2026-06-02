// Rough economy simulator: estimates active-play time to reach a game's goal.
// Buyer = "buy the highest-rate building you can afford + grab every affordable
// upgrade". Models a sensible (not perfectly optimal) player => realistic-ish
// upper bound. Real casual players will be a little slower.

function sim({ buildings, upgrades, base, goal, tapsPerSec = 4 }) {
  let coins = 0, totalEarned = 0
  const owned = {}
  const bought = new Set()
  let tapAdd = 0, tapMult = 1, rateMult = 1
  const cost = (b) => Math.ceil(b.baseCost * Math.pow(b.growth, owned[b.id] || 0))
  const tapVal = () => Math.max(1, Math.round((base + tapAdd) * tapMult))
  const rate = () => buildings.reduce((a, b) => a + (owned[b.id] || 0) * b.rate, 0) * rateMult
  const dt = 0.1
  let t = 0
  while (totalEarned < goal && t < 7200) {
    const inc = rate() * dt
    coins += inc; totalEarned += inc
    if (Math.random() < tapsPerSec * dt) { const v = tapVal(); coins += v; totalEarned += v }
    let again = true
    while (again) {
      again = false
      for (const u of upgrades) {
        if (!bought.has(u.id) && coins >= u.cost) {
          coins -= u.cost; bought.add(u.id)
          if (u.type === 'tapAdd') tapAdd += u.v
          if (u.type === 'tapMult') tapMult *= u.v
          if (u.type === 'rateMult') rateMult *= u.v
          again = true
        }
      }
      // highest base-rate building we can afford
      let best = null
      for (const b of buildings) {
        const c = cost(b)
        if (coins >= c && (!best || b.rate > best.rate)) best = b
      }
      if (best) { coins -= cost(best); owned[best.id] = (owned[best.id] || 0) + 1; again = true }
    }
    t += dt
  }
  return { minutes: +(t / 60).toFixed(1), rate: Math.round(rate()), owned }
}

const farm = {
  base: 1,
  goal: 80000,
  buildings: [
    { id: 'plot', baseCost: 10, growth: 1.13, rate: 0.5 },
    { id: 'carrot', baseCost: 75, growth: 1.14, rate: 3 },
    { id: 'greenhouse', baseCost: 450, growth: 1.15, rate: 16 },
    { id: 'cows', baseCost: 2500, growth: 1.15, rate: 80 },
    { id: 'tractor', baseCost: 11000, growth: 1.16, rate: 350 },
    { id: 'agro', baseCost: 50000, growth: 1.17, rate: 1500 },
  ],
  upgrades: [
    { id: 'gloves', cost: 120, type: 'tapAdd', v: 3 },
    { id: 'wateringcan', cost: 800, type: 'tapMult', v: 2 },
    { id: 'fertilizer', cost: 3500, type: 'rateMult', v: 2 },
    { id: 'drone', cost: 18000, type: 'rateMult', v: 2 },
    { id: 'goldseeds', cost: 70000, type: 'rateMult', v: 3 },
  ],
}

const runs = Array.from({ length: 6 }, () => sim(farm))
const avg = (runs.reduce((a, r) => a + r.minutes, 0) / runs.length).toFixed(1)
console.log('farm runs (min):', runs.map((r) => r.minutes).join(', '))
console.log('farm AVG minutes:', avg)
console.log('final rate ~', runs[0].rate, 'owned', runs[0].owned)
