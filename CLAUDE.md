# Тайкун-Парк — гайд для Claude Code

PWA-аркада из тематических idle-clicker тайкунов. Витрина игр: открыта первая
(Ферма), остальные открываются по цепочке после прохождения. Подробности для
людей — в `README.md`. Здесь — то, что важно следующей сессии Claude.

## Стек / расположение
- Папка: `C:\cabbage\Projects\tycoon-arcade`. Vite + React 19 + TS (строгий:
  `verbatimModuleSyntax` → все типы импортировать через `import type`;
  `noUnusedLocals`/`erasableSyntaxOnly` — без enum/namespace).
- Tailwind v3, Framer Motion, Zustand(+persist), canvas-confetti, vite-plugin-pwa.

## Архитектура (data-driven)
- **Все игры рендерит один `<IdleGame config>`** (`components/game/IdleGame.tsx`).
  Игра = объект `GameConfig` (`games/types.ts`). Добавить игру = новый файл в
  `games/configs/` + запись в массив `GAMES` (`games/registry.ts`); **порядок в
  массиве = цепочка разблокировки**. `implemented:false` → экран «Скоро».
- Состояние: `store/useGameStore.ts` — один persist-ключ `tycoon-arcade-v1`
  (`meta{unlocked,completed,stars,settings}` + `games[id]{coins,totalEarned,
  buildings,upgrades,lastSeen}`). Производные (стоимость/доход/тап/прогресс) —
  в `games/engine/selectors.ts`, не хранятся.
- Навигация: `store/useNav.ts` — state-based (`hub`/`game`/`soon`) + history,
  чтобы работала кнопка «назад». В шапке игры — своя кнопка ‹ (нужна для iOS).
- Цикл: `games/engine/useIdleLoop.ts` — RAF-тик (коммит ~10/с) + капнутый
  офлайн-докоп (≤120с). Тап-цель ловит `pointerdown` (не `click`!).

## Превью (как «видеть» приложение)
- Preview MCP читает `C:\cabbage\Projects\.claude\launch.json` (НЕ папку проекта).
  Конфиг `tycoon` запускает dev через `npm --prefix C:\cabbage\Projects\
  tycoon-arcade run dev` на порту 5173.
- ⚠️ НЕ использовать `powershell -ExecutionPolicy Bypass` в launch.json — авто-
  классификатор Claude блокирует это как security-weaken. Поэтому `npm --prefix`.
- `mcp__Claude_Preview__preview_start {name:"tycoon"}` → `preview_screenshot`,
  `preview_resize` (mobile/desktop), `preview_eval`.
- **Dev-хук**: в dev `window.__store` = useGameStore. Удобно для проверки и
  калибровки, напр.:
  `__store.setState(s=>({games:{...s.games,farm:{...s.games.farm,totalEarned:1e6}}}))`
  → триггерит модалку прохождения. В прод-сборку не попадает (`import.meta.env.DEV`).
- Чтение баланса из DOM после тапа отстаёт на 1 кадр React — сверяй по
  `__store.getState()`/localStorage, а не по тексту сразу.

## Экономика / калибровка
- Цель каждой игры ~8–10 мин активной игры. Инструмент: `npm run sim`
  (`scripts/gen-icons.mjs` — иконки; `scripts/sim.mjs` — симулятор тайминга).
  При смене чисел в `configs/*.ts` обнови экономику и в `sim.mjs`, прогони.
- Ферма: goal 80k (~8 мин). Кофейня: goal 95k. Кривая роста ×1.13–1.17.

## iOS PWA (уже учтено — не сломать)
- `#root` = `position:fixed; inset:0` (обход клиппинга `100dvh` в standalone).
- Safe-area только через CSS-классы `.pt-safe/.pb-safe/...` (`env()` в классе),
  **не** `env()` в inline-style React.
- SW `registerType:'autoUpdate'`, в dev выключен (`devOptions.enabled:false`).
  Старая версия после деплоя → переустановить PWA.
- Иконки: `public/icon.svg` (источник) → `npm run icons` → `public/icons/*.png`.

## Деплой
- `npm run build` → статика в `dist/` (`base:'./'`). GitHub Pages или Vercel
  (preset Vite). PWA на iPhone: Safari → «На экран Домой».
