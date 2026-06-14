# Тайкун-Парк — гайд для Claude Code

PWA-аркада из 5 тематических мини-игр-тайкунов (НЕ кликеры) с общим мета-слоем
(уровень магната, достижения, лавка бустов, ежедневка, профиль, общий инвентарь
и алмазы). Витрина: открыта первая (Ферма), остальные открываются по цепочке
после прохождения. Подробности для людей — в `README.md`. Здесь — то, что важно
следующей сессии Claude.

## Стек / расположение
- Папка: `C:\cabbage\Projects\tycoon-arcade`. Vite + React 19 + TS (строгий:
  `verbatimModuleSyntax` → все типы импортировать через `import type`;
  `noUnusedLocals`/`erasableSyntaxOnly` — без enum/namespace).
- Tailwind v3, Framer Motion, Zustand(+persist), canvas-confetti, vite-plugin-pwa.

## Архитектура (data-driven)
- **Игра = объект `GameConfig`** (`games/types.ts`) в массиве `GAMES`
  (`games/registry.ts`); **порядок в массиве = цепочка разблокировки**. Поле
  `kind` выбирает движок (см. ниже). Добавить игру = новый конфиг в
  `games/configs/` + запись в `GAMES` (+ свой `kind`/компонент/стор для мини-игры).
  `implemented:false` → экран «Скоро» (сейчас таких нет — все 5 реализованы).
- Состояние: `store/useGameStore.ts` — один persist-ключ `tycoon-arcade-v1`
  (версия **4**). Хранит `meta{unlocked,completed,stars,diamonds,stats,boosts,
  claimed,daily,rewardedLevel,profile,createdAt,settings}`, `games[id]{...}`
  (для idle-движка) и `inventory{itemId:qty}`. Производные idle — в
  `games/engine/selectors.ts`. `migrate` backfill'ит все новые поля из дефолтов.
- **Общая экономика (между всеми играми).** В `useGameStore`:
  - `meta.diamonds` — общая премиум-валюта 💎. Начисляется за прохождение
    (`cfg.diamondReward`) и за продажу «ценностей» из инвентаря. Тратится на
    премиум-улучшения (напр. на ферме `currency:'diamonds'`). Видна в шапке
    хаба, игр (`GameShell`) и инвентаря.
  - `inventory` — ОБЩИЙ инвентарь, куда все игры складывают предметы. Реестр
    предметов: `items/items.ts` (`ItemDef{category,source,rarity,diamondValue}`,
    `CATEGORY_TABS` = вкладки, `rollTreasure`). Экран: `components/inventory/
    InventoryScreen.tsx` (вкладки по категориям; «ценности» продаются за 💎).
    Навигация — `useNav` экран `inventory`.
- **Мета-прогресс (надстройка над всеми играми).** `meta` хранит `stats`
  (кросс-игровые счётчики), `boosts` (вечные апгрейды), `claimed` (достижения),
  `daily`, `rewardedLevel`, `profile`, `createdAt`. Чистые хелперы — `meta/progress.ts`.
  - `stats` (тип `Stats`): `harvested/cropsSold/ordersFilled/treasuresFound/
    coinsEarned/served/vipServed/giftsReceived/diamondsEarned/pizzasBaked/
    perfectBakes/oresMined/pastriesSold`. Игры зовут
    `useGameStore.getState().bumpStat(key, n)` на ДИСКРЕТНЫХ событиях (продажа,
    сдача заказа, подача гостя, разбитие жилы) — НЕ в тиках по чуть-чуть.
    Новый стат-ключ ⇒ добавить в `Stats`+`emptyStats()` (миграция сама зальёт 0).
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
  - **Профиль/Статистика/Настройки**: `meta.profile{name,avatar}` (экшены
    `setProfileName/setAvatar`), `meta.createdAt` («в игре с …»), `meta.settings
    {sound,reducedMotion,haptics}`. Ранги/аватары — `meta/ranks.ts`
    (`rankForLevel`, `AVATARS`). Экраны `ProfileScreen` (аватар-пикер + ник +
    ранг + плитки + «мои бизнесы»), `StatsScreen` (все `stats` по секциям),
    sheet `SettingsSheet` (тумблеры + ссылки на профиль/стату + сброс). Общий
    хедер под-экранов — `components/ui/ScreenHeader.tsx`.
  - Навигация: экраны `achievements/shop/profile/stats` в `useNav`. Хаб —
    «домашняя база»: профиль-карточка (тап → профиль) + ряд действий
    (🎁🏆💠🎒) + сетка игр. Шапка хаба — `Header` (⭐/💎/⚙️).
- Навигация: `store/useNav.ts` — state-based (`hub/game/soon/inventory/
  achievements/shop/profile/stats`) + history, чтобы работала кнопка «назад».
  В шапке под-экрана — своя кнопка ‹ (нужна для iOS); общий `ScreenHeader`.
- `idle`-движок (`components/game/IdleGame.tsx` + `games/engine/useIdleLoop.ts`,
  RAF-тик) сейчас НЕ используется ни одной игрой, но оставлен как запасной
  `kind:'idle'`. Тап-цели ловят `pointerdown` (не `click`!).
- **Мини-игры (не кликеры).** У `GameConfig` есть поле `kind?: 'idle'|'farm'|'coffee'|'pizza'|'mine'|'bakery'`.
  Все 5 игр витрины — настоящие мини-игры (тизеров/`teasers.ts` больше нет).
  Роутинг — `GameScreen` в `App.tsx` (switch по `kind`); `idle` → старый
  `<IdleGame>`. Так в одну витрину уживаются разные движки; новую игру-мини
  делаем тем же приёмом — новый `kind` + свой компонент + свой стор.
- **Ферма** (`kind:'farm'`) — полноценная мини-игра, а не кликер:
  - Данные/экономика: `games/farm/crops.ts` (культуры `CROPS`, улучшения
    `FARM_UPGRADES`, цена грядки, множители роста/продажи, лимит полива).
  - Состояние: ОТДЕЛЬНЫЙ стор `store/useFarmStore.ts`, свой persist-ключ
    `tycoon-farm-v1` (`coins,totalEarned,plots[],upgrades,selectedSeed,orders`).
    Рост — по таймстемпам (`plantedAt+boostMs`), поэтому идёт и оффлайн;
    селекторы `plotProgress/isRipe` тут, `farmStashValue/farmStashCount` —
    в `crops.ts` (урожай хранится в общем `inventory`, не в farm-сторе).
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
- **Пиццерия** (`kind:'pizza'`) — мини-игра «поймай прожарку» (новая механика):
  - Данные: `games/pizza/pizzas.ts` (`PIZZAS`, `PIZZA_UPGRADES` — печь/тесто/
    столики/промо/декор/робот + премиум за 💎 шеф/бренд/рецепт; деривативы
    `ovenCount/seatCount/bakeMs/arrivalMs/patienceMs/perfectFrom/bakeQuality/
    comboMult`). Константы `PERFECT_BASE/BURNT_AT/AUTO_PULL_AT`.
  - Состояние: ОТДЕЛЬНЫЙ стор `store/usePizzaStore.ts`, persist `tycoon-pizza-v1`
    (живые заказы не персистятся). Заказы `orders[]` — статусы `waiting→baking→
    served/left`. Dev-хук `window.__pizza`.
  - Цикл: тап по заказу = поставить в печь (если свободна) → тап ВТОРОЙ раз в
    зелёной зоне прогресса = «идеально» (полная цена + чаевые + растущее комбо);
    рано = сыро (×0.6), поздно = передержал (×0.5), не достал до `BURNT_AT` =
    сгорела (потеря, комбо сброс). `Робот-пиццайоло` достаёт сам в идеале.
  - Луп: `games/pizza/usePizzaTick.ts` (~12/с — окно «идеально» узкое). Компоненты
    `components/game/pizza/` (`PizzaGame`, `OrderCard` с баром прожарки и зоной,
    `PizzaShopSheet`). Стат-ключи `pizzasBaked/perfectBakes`, дропы `rollPizzaDrop`.
- **Шахта** (`kind:'mine'`) — мини-игра + ПЕРВЫЙ idle-движок парка (оффлайн-доход):
  - Данные: `games/mine/ores.ts` (`ORES` — слои с value/veinHp/depthFrom,
    `MINE_UPGRADES` — кирка/шахтёры/бур/вагонетка + премиум 💎 экзоскелет/турбо/
    детектор; `tapDamage/autoDps/valueMult/gemChance`, `OFFLINE_CAP_MS=8ч`).
  - Состояние: ОТДЕЛЬНЫЙ стор `store/useMineStore.ts`, persist `tycoon-mine-v1`
    (хранит depth/veinHp/upgrades/lastSeen). `applyDamage()` ломает жилы (урон ≥
    hp) → монеты + углубление + шанс самоцвета (`rollMineGem` → инвентарь → 💎).
    Тап = `mineTap`, авто-шахтёры = `tick(dt)`. **Оффлайн**: `collectOffline()`
    на входе считает добычу авто-шахтёров за время отсутствия (аппрокс. на текущем
    слое, кап 8ч) → модалка `WelcomeBackModal`. `markSeen` держит lastSeen свежим.
    Dev-хук `window.__mine`.
  - Луп: `games/mine/useMineTick.ts` (~10/с: авто-урон + markSeen). Компоненты
    `components/game/mine/` (`MineGame`, `RockFace` — тап-цель с HP-баром жилы,
    `MineShopSheet`, `WelcomeBackModal`). Стат-ключ `oresMined`, самоцветы бьют
    `treasuresFound`. Цель 90k (~10 мин активной игры, диамант — пост-гейм).
- **Пекарня** (`kind:'bakery'`) — мини-игра «спрос и предложение» (5-я, финал):
  - Данные: `games/bakery/pastries.ts` (`PASTRIES`, `BAKERY_UPGRADES` — печь/
    тестомес/витрина/зал/реклама/авто-пекарь/продавец + премиум 💎 рецепт/бренд/
    глазурь; деривативы `ovenCount/shelfCap/seatCount/bakeMs/batchOf/arrivalMs`).
  - Состояние: ОТДЕЛЬНЫЙ стор `store/useBakeryStore.ts`, persist `tycoon-bakery-v1`
    (хранит `shelf` сток + upgrades/статы; живые `baking`/`customers` не
    персистятся). Dev-хук `window.__bakery`.
  - Цикл: тап по выпечке = поставить партию в печь → готово → +`batch` на витрину
    (склад с лимитом `shelfCap`). Гости приходят с заказом-КОМБО (несколько видов
    выпечки); тап по гостю = выдать заказ, если всё есть на витрине → монеты +
    чаевые. Авто-пекарь/продавец автоматизируют (только онлайн, оффлайна нет —
    idle только у Шахты). Стат-ключ `pastriesSold`. Цель 95k (~10-12 мин).
  - Луп: `games/bakery/useBakeryTick.ts` (~7/с). Компоненты `components/game/
    bakery/` (`BakeryGame` с рядом печей, `CustomerCard` с комбо-заказом, `BakeryShopSheet`).

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
- Цель каждой мини-игры — ~10–12 мин активной игры. `scripts/sim.mjs` — для
  СТАРОЙ idle-модели (мини-игры им НЕ покрываются). Баланс мини-игр калибрую
  одноразовым sim-скриптом под конкретную механику (модель «посадил-собрал-
  продал» / «очередь» / «прожарка» / «жилы» / «спрос-предложение»), прогоняю,
  числа вношу в `games/<game>/*.ts` + `goal` в `configs/<game>.ts`.
- Текущие цели (`totalEarned`): Ферма 80k, Кофейня 65k, Пиццерия 70k, Шахта 90k,
  Пекарня 95k. У всех мини-игр ранний старт «снаппи» (первый апгрейд ~20–30с),
  длину набирает середина/конец.

## iOS PWA (уже учтено — не сломать)
- `#root` = `position:fixed; inset:0` (обход клиппинга `100dvh` в standalone).
- Safe-area только через CSS-классы `.pt-safe/.pb-safe/...` (`env()` в классе),
  **не** `env()` в inline-style React.
- SW `registerType:'autoUpdate'`, в dev выключен (`devOptions.enabled:false`).
  Старая версия после деплоя → переустановить PWA.
- Иконки: `public/icon.svg` (источник) → `npm run icons` → `public/icons/*.png`.

## Деплой
- `npm run build` → статика в `dist/` (`base:'./'`). Хостинг — **Vercel**
  (preset Vite), прод-ветка = **`main`**. ⚠️ Работаем в фиче-ветке
  `claude/...`; чтобы прод на Vercel обновился, ветку надо влить в `main`
  (обычно fast-forward) и запушить `main` — пуш в фиче-ветку прод НЕ обновляет.
- PWA на iPhone: Safari → «На экран Домой». SW `autoUpdate` → после деплоя
  старая версия может держаться из кэша; обновить страницу/переустановить ярлык.
