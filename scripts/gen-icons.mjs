// Generates PWA PNG icons from public/icon.svg using sharp.
// Square (full-bleed) variants avoid transparent-corner issues on iOS/maskable.
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const rounded = readFileSync(resolve(root, 'public/icon.svg'), 'utf8')
const square = rounded.replaceAll('rx="116"', 'rx="0"')
const outDir = resolve(root, 'public/icons')
mkdirSync(outDir, { recursive: true })

const buf = Buffer.from(square)
const tasks = [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['maskable-512.png', 512],
  ['apple-touch-icon-180.png', 180],
]

for (const [name, size] of tasks) {
  await sharp(buf).resize(size, size).png().toFile(resolve(outDir, name))
  console.log('icon:', name, size)
}
console.log('done')
