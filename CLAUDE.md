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
  (`meta{unlocked,completed,stars,diamonds,settings}` + `games[id]{...}` +
  `inventory{itemId:qty}`). Производные — в `games/engine/selectors.ts`.
- **Общая экономика (между всеми играми).** В `useGameStore`:
  - `meta.diamonds` — общая премиум-валюта 💎. Начисляется за прохождение
    (`cfg.diamondReward`) и за продажу «ценностей» из инвентаря. Тратится на
    премиум-улучшения (напр. на ферме `currency:'diamonds'`). Видна в шапке
    хаба, игр (`GameShell`) и инвентаря.
  - `inventory` — ОБЩИЙ инвентарь, куда все игры складывают предметы. Реестр
    предметов: `items/items.ts` (`ItemDef{category,source,rarity,diamondValue}`,
    `CATEGORY_TABS` = вкладки, `rollTreasure`). Экран: `components/inventory/
    InventoryScreen.tsx` (вкладки по категориям; «ценности» продаются за 💎).
    Навигация — `useNav` экран `inventory`. Версия persist поднята до 2 (миграция
    добавляет diamonds/inventory).
- **Мета-прогресс (надстройка над всеми играми).** `meta` (persist v3) хранит
  `stats` (кросс-игровые счётчики), `boosts` (вечные апгрейды), `claimed`
  (достижения), `daily`, `rewardedLevel`. Чистые хелперы — `meta/progress.ts`.
  - `stats` (тип `Stats`): `harvested/cropsSold/ordersFilled/treasuresFound/
    coinsEarned/served/vipServed/giftsReceived/diamondsEarned`. Игры зовут
    `useGameStore.getState().bumpStat(key, n)` на ДИСКРЕТНЫХ событиях (продажа,
    сдача заказа, подача гостя) — НЕ в тиках по чуть-чуть.
  - **Уровень магната**: `levelFromXp(stats.coinsEarned)` — кривая `70*1.45^L`.
    `bumpStat('coinsEarned')` сам начисляет 💎 за новые уровни (`rewardedLevel`,
    `levelReward`) и пушит тост.
  - **Достижения**: `meta/achievements.ts` (`ACHIEVEMENTS`, метрики из `stats`
    + `level`/`gamesCompleted`). Экран `components/meta/AchievementsScreen.tsx`,
    `claimAchievement(id)` → 💎. Бейдж на хабе = число «забираемых».
  - **Лавка магната** (`MAGNATE_BOOSTS`): вечные ГЛОБАЛЬНЫЕ бусты за 💎 —
    `income` (×доход во всех играх), `luck` (+шанс находок/подарков), `gem`
    (+цена ценностей). Селекторы `globalIncomeMult/globalLuckBonus/globalGemMult`
    применяются в farm `sellAll/fulfillOrder/treasureChance` и coffee
    `computeEarn/itemDropChance` и в `sellItemForDiamonds`. Экран
    `MagnateShopScreen`, `buyBoost(id)`.
  - **Ежедневка**: `claimDaily()` (стрик по датам) → 💎 + предмет. `DailyModal`.
  - **Тосты**: `store/useToast.ts` + `components/ui/Toasts.tsx` (примонтирован в
    `App`). Сторы могут пушить через `useToast.getState().push`.
  - Навигация: экраны `achievements`/`shop` в `useNav`. Хаб — «домашняя база»
    с уровнем, рядом действий (🎁🏆💠🎒) и сеткой игр.
- Навигация: `store/useNav.ts` — state-based (`hub`/`game`/`soon`) + history,
  чтобы работала кнопка «назад». В шапке игры — своя кнопка ‹ (нужна для iOS).
- Цикл: `games/engine/useIdleLoop.ts` — RAF-тик (коммит ~10/с) + капнутый
  офлайн-докоп (≤120с). Тап-цель ловит `pointerdown` (не `click`!).
- **Мини-игры (не кликеры).** У `GameConfig` есть поле `kind?: 'idle'|'farm'|'coffee'`.
  Роутинг — `GameScreen` в `App.tsx` (switch по `kind`); `idle` → старый
  `<IdleGame>`. Так в одну витрину уживаются разные движки; новую игру-мини
  делаем тем же приёмом — новый `kind` + свой компонент + свой стор.
- **Ферма** (`kind:'farm'`) — полноценная мини-игра, а не кликер:
  - Данные/экономика: `games/farm/crops.ts` (культуры `CROPS`, улучшения
    `FARM_UPGRADES`, цена грядки, множители роста/продажи, лимит полива).
  - Состояние: ОТДЕЛЬНЫЙ стор `store/useFarmStore.ts`, свой persist-ключ
    `tycoon-farm-v1` (`coins,totalEarned,plots[],barn,upgrades,selectedSeed`).
    Рост — по таймстемпам (`plantedAt+boostMs`), поэтому идёт и оффлайн; чистые
    селекторы `plotProgress/isRipe/barnValue` экспортируются оттуда же.
    Старт: `coins:60` (иначе нечем купить первое семя!). Dev-хук `window.__farm`.
  - Луп: `games/farm/useFarmTick.ts` — тик ~4/с (анимация роста + автосбор
    `Комбайн`/автопродажа `Грузовик`). Компоненты: `components/game/farm/`
    (`FarmGame` оркестрирует, `Plot`, `SeedBar`, `FarmShopSheet`).
  - Цикл игры: выбрать семя → тап по пустой грядке = посадить (списывает монеты)
    → тап по растущей = полить (быстрее, до лимита) → тап по спелой = собрать
    (урожай идёт в ОБЩИЙ `inventory`, шанс выкопать «ценность» → 💎) → кнопка
    «Продать» = монеты за весь урожай из инвентаря. Победа по `cfg.goal.amount`.
  - Связь с общей экономикой: сбор кладёт предметы в `useGameStore.inventory`
    (farm store зовёт его через `getState()`), редкие находки (`rollTreasure`)
    продаются за 💎 в инвентаре. **Заказы** (`orders` в farm store,
    `FarmOrdersSheet`) — сдать N урожая → монеты + 💎. Премиум-улучшения
    (`rainbow`/`lucky`) покупаются за 💎. `barn` удалён (был в v1, миграция чистит).
  - Баланс мини-фермы НЕ в `scripts/sim.mjs` (там idle-модель). Прикидка пейсинга
    — отдельным скриптом по модели «посадил-полил-собрал-продал», цель ~8–10 мин.
- **Кофейня** (`kind:'coffee'`) — мини-игра «обслужи очередь»:
  - Данные/экономика: `games/coffee/drinks.ts` (`DRINKS` — напитки с ценой/
    временем варки/анлоком, `COFFEE_UPGRADES` — бариста/машина/столики/реклама/
    зал/авто-бариста + премиум за 💎; деривативы: `stationCount/seatCount/brewMs/
    arrivalMs/patienceMs/tipMult/itemDropChance`).
  - Состояние: ОТДЕЛЬНЫЙ стор `store/useCoffeeStore.ts`, persist-ключ
    `tycoon-coffee-v1`. Гости (`customers[]`) — статусы `waiting→brewing→served/
    left` с таймстемпами (`deadline`, `brewDoneAt`); живая очередь НЕ
    персистится (partialize хранит только coins/totalEarned/upgrades/статы).
    Dev-хук `window.__coffee`.
  - Луп: `games/coffee/useCoffeeTick.ts` — тик ~8/с: довести варку, протухание
    терпения, спавн гостей до лимита мест, авто-бариста. Компоненты:
    `components/game/coffee/` (`CoffeeGame`, `CustomerCard`, `CoffeeShopSheet`).
  - Цикл игры: тап по гостю = начать варить его напиток (если есть свободный
    бариста) → авто-подача по готовности → монеты + чаевые (тем больше, чем
    быстрее подал). VIP 👑 — большой бонус и гарантированный подарок-предмет.
    Не успел до конца терпения → гость уходит. Связь с экономикой: подача даёт
    шанс «товара» в ОБЩИЙ `inventory` (`rollCoffeeDrop`, продаётся за 💎), за
    прохождение — `diamondReward`. Цель ~10–12 мин (баланс прикинут отдельным
    sim-скриптом по очереди, НЕ в `scripts/sim.mjs`).

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
