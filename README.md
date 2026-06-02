# 🎡 Тайкун-Парк

PWA-аркада из коллекции тематических **idle-clicker тайкунов**. Главный экран —
витрина игр: сначала открыта только 🌱 **Ферма**, остальные заблокированы.
Каждая игра — короткий завершаемый тайкун на ~10 минут с понятной целью; пройдя
игру, открываешь следующую. Сочный мульт-визуал, отлично работает на ПК и на
iPhone (ставится как PWA).

## Стек

- **Vite + React + TypeScript**
- **Tailwind CSS** + **Framer Motion** (пружинные анимации, частицы)
- **Zustand** (`persist`) — прогресс хранится локально в `localStorage`
- **canvas-confetti**, self-hosted шрифты **Fredoka** + **Nunito**
- **vite-plugin-pwa** (Workbox) — манифест + service worker (autoUpdate)

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
```

Прочие команды:

```bash
npm run build      # прод-сборка в dist/ (tsc + vite + PWA)
npm run preview    # локальный предпросмотр прод-сборки
npm run icons      # перегенерировать PWA-иконки из public/icon.svg
npm run sim        # оценить тайминг прохождения (калибровка экономики)
```

## Деплой

Сборка статична (`base: './'`), работает с любого статик-хостинга:

- **GitHub Pages** — залить содержимое `dist/` (или собрать GH Action).
- **Vercel** — framework preset «Vite», без доп. настроек.

Для установки PWA на iPhone: открыть HTTPS-адрес в **Safari** → «Поделиться» →
«На экран Домой».

## Как добавить новую игру

Все игры рендерит один движок `<IdleGame config={...}>` — игра целиком задаётся
объектом-конфигом. Чтобы добавить новую:

1. Создай `src/games/configs/<имя>.ts` по образцу `farm.ts` / `coffee.ts`:
   тема (цвета), валюта, тап-цель, список зданий и улучшений, цель (`goal`),
   текст победы, награда ⭐, `implemented: true`.
2. Добавь его в массив `GAMES` в `src/games/registry.ts` — **порядок в массиве
   задаёт цепочку разблокировки**.
3. Готово. Прокачай тайминг через `npm run sim` (скопируй экономику в
   `scripts/sim.mjs`) — цель ~8–10 минут.

Заблокированные «тизеры» (`implemented: false`, см. `configs/teasers.ts`)
показывают экран «Скоро» — так витрина выглядит полной, а будущие игры видны.

## Структура

```
src/
  store/        useGameStore (Zustand+persist) · useNav (экраны + кнопка «назад»)
  games/
    types.ts    GameConfig / BuildingDef / UpgradeDef
    registry.ts список игр + цепочка разблокировки
    engine/     selectors (экономика) · useIdleLoop (RAF-тик + офлайн-докоп)
    configs/    farm · coffee · teasers
  components/
    hub/        Hub · GameCard (открыта/пройдена/заблокирована) · Header
    game/       IdleGame · GameShell · TapTarget · ShopList · GoalBar · CompletionModal · ComingSoon
    ui/         Button · StatBadge · ProgressBar · Modal
    settings/   SettingsSheet (звук · меньше анимаций · сброс прогресса)
  lib/          format · sound (Web Audio) · haptics · confetti · theme · cn
```

## Заметки про iOS PWA (учтены в коде)

- Внешний контейнер `#root` — `position: fixed; inset: 0` (обход клиппинга `100dvh`
  в standalone).
- Safe-area — через CSS-классы `.pt-safe/.pb-safe/...` (`env()` в классе, не в inline-style).
- `viewport-fit=cover`, `apple-mobile-web-app-*` мета-теги, `theme-color`.
- Service worker — `registerType: 'autoUpdate'`; в dev отключён, чтобы не мешал.
  Если после деплоя видна старая версия — переустанови PWA с домашнего экрана.
