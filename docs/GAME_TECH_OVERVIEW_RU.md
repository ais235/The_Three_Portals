# Fantasy Card Quest — технический обзор

Документ для разработчика / техспециалиста: стек, точки входа, модули, данные, боевой цикл, сохранение.

---

## Стек и запуск

- **Чистый клиент:** HTML + CSS + JavaScript без сборщика.
- **Точка входа:** `index.html` — единая SPA-оболочка `#app` с переключаемыми «экранами» `.screen`.
- Дополнительно в репозитории есть **`battle_interface.html`** — отдельный макет/прототип боя (не обязателен для основного `index.html`).

Откройте `index.html` через локальный HTTP-сервер или файловый протокол (учитывайте ограничения браузера для некоторых API).

---

## Порядок подключения скриптов (`index.html`)

Логический пайплайн загрузки:

1. `js/npc_dialogues.js` — реплики NPC.
2. **`cards_and_weapons.js`** (корень проекта) — `ALLIES`, `CLASSES`, `RACES`, `WEAPONS`, формулы `calcStat`, `calcInitiative`, `calcDamage`, дроп оружия и т.д.
3. `js/data/enemies.js` — `ENEMY_TEMPLATES`.
4. `js/data/locations.js` — `LOCATIONS`, `ARTIFACTS`, `getTempleBonus()`.
5. `js/data/battleUnits.js` — фабрики `createBattleAlly`, `createBattleEnemy`, `generateLocationEnemies`, тестовый `createTestBattle` и шаблоны для демо.
6. `js/engine/effects.js` — `Effects` (статусы, тики, мана).
7. `js/engine/ai.js` — `AI.autoAllyAction` и логика врагов.
8. `js/engine/battle.js` — **`Battle`** singleton: состояние боя, очередь ходов, урон, заклинания, режимы tactical/auto/fast.
9. UI боёв: `battlefield.js`, `battleLog.js`.
10. `portal.js`, `exchange.js`, `village.js`, `unitCard.js`, `barracks.js`, `arsenal.js`, `worldmap.js`, `squadSelect.js`, `villageMap.js`, `library.js`.
11. **`js/main.js`** — `GameState`, `App`, инициализация и маршрутизация экранов.

Глобальные сущности (`const` на window): ожидается наличие `ALLIES`, `WEAPONS`, `LOCATIONS`, `Battle`, `GameState`, `App` и т.д.

---

## Состояние приложения и сохранение

**`GameState`** (IIFE в `main.js`):

- Держит в памяти объект прогресса и синхронизирует его в **`localStorage`** под ключом **`fcq_save_v1`** (`SAVE_KEY`).
- Поля (см. `DEFAULT_SAVE`): монеты; пыль по `1…5`; `unlockedCards`; `cardLevels` `{ id: { stars, powerLevel } }`; `equipped` **по юниту** `{ weapon, accessory }`; `ownedWeapons`; `completedLocations`; `artifacts`; `lastSquad`; суточные поля магазина и квестов.

Публичный API: монеты/пыль, карты (разблокировка, апгрейд, переработка), экипировка (в т.ч. миграция со старого формата «одна строка weapon id»), оружие, локации, артефакты, отряд, магазин, квесты, `save`, `reset`.

**`App.init()`** при старте вызывает **`GameState.load()`** — перечитывает сейв из `localStorage` и снова прогоняет `_ensureCardLevels` (при первом парсе скрипта данные уже поднимаются один раз в IIFE через `_loadSave`).

---

## Маршрутизация экранов

**`App.showScreen(screenId)`**:

- Прячет все `.screen`, показывает целевой `screen-${domId}`.
- Вкладки зданий деревни (`portal`, `temple`, `shop`, `council`) мапятся на **`screen-village`** + `VillageUI.switchTab`.
- Побочные эффекты: `initBattle()` при `battle` (если не выставлен флаг `_skipBattleInit`), перерисовка `BarracksUI`, `WorldMap`, `SquadSelect`, и т.д.
- HUD ресурсов скрывается на `home`.

---

## Данные контента

| Источник | Содержимое |
|----------|------------|
| `cards_and_weapons.js` | Союзники, классы, расы, оружие, таблицы дропа |
| `js/data/enemies.js` | Шаблоны врагов для боёв и библиотеки |
| `js/data/locations.js` | Локации, награды, `enemyCount`, лимиты отряда, артефакты, `getTempleBonus` |
| `js/data/battleUnits.js` | Связка локации → враги, создание экземпляров юнитов для боя |

В проекте также встречается **`units_data.js`** (альтернативный/старый датасет с CommonJS `module.exports`) — **в основной цепочке `index.html` не подключается**.

---

## Модель юнита в бою

Экземпляр (см. `createBattleAlly` / `createBattleEnemy`):

- Идентификатор шаблона + `instanceId`, `side` (`ally` \| `enemy`), `column`, `row`, `stats` (вычисленные HP, атаки, защиты, мана, инициатива), `statusEffects`, `isAlive`, кулдауны способностей, флаги хода.
- Союзникам дополнительно подмешиваются **бонусы оружия** из `GameState` и **`getTempleBonus()`** при создании.

Формулы статов: **`calcStat(base, stars, level)`** и **`calcInitiative(base, stars, level)`** из `cards_and_weapons.js`.

---

## Движок боя (`js/engine/battle.js`)

- **Состояние:** массивы союзников/врагов, `turnOrder`, индекс текущего, номер раунда, флаги окончания, `pendingAction` (режим выбора цели для атаки/заклинания), колбэки `onLogEntry`, `onRender`, `onEnd`, `onEnableActions`, `onRequestTarget`.
- **Инициализация:** `Battle.init(allies, enemies, callbacks)` — сбор `allUnits`, построение очереди, первый ход.
- **Очередь:** живые юниты сортируются по инициативе + малый случайный тай-брейк; каждый раунд пересобирается.
- **Начало хода:** эффекты (`Effects.processTurnStart`), реген маны, проверка смерти, **stun** → пропуск хода.
- **Урон:** ветвление по `melee` / `ranged` / `magic`, учёт пассивных множителей, формула с `(atk - def)` и случайным множителем 0.9–1.1, минимум 1.
- **Режимы:** `tactical` (игрок кликает), `auto` / AI для союзников с таймером, `fast` — ускоренная симуляция без части визуала.
- **Окончание:** проверка живых сторон; `App.onBattleEnd` начисляет награды, штрафы, квесты, дроп.

**AI врагов** задаётся в шаблоне (`ai: 'attack_lowest_hp'` и др.) в `js/engine/ai.js`.

---

## UI боя (`js/ui/battlefield.js`)

- Рендер сеток `#allies-grid` / `#enemies-grid`, ячейки `bf-cell`.
- Карточка юнита: `. unit-card.ally-card` / `.enemy-card`, портрет или emoji, полосы HP/маны, инициатива, иконки статусов, превью урона.
- Коллбэки движка дергают `BattlefieldUI.render`, карусель хода, панель заклинаний, модалки.

Лог: **`BattleLog`** пишет в `#battle-log`.

---

## Поток «локация → бой»

1. `WorldMap` строит узлы из `LOCATIONS`, проверяет `requires`, зону и флаги прохождения.
2. Игрок жмёт «В бой» → `SquadSelect.open(location)` — фильтр карт по `maxStars`, лимит `maxUnits`, восстановление `lastSquad`.
3. `SquadSelect.startBattle()` собирает юнитов через `createBattleAlly`, врагов через `generateLocationEnemies` (или аналог), вызывает **`App.initCustomBattle(allies, enemies, location)`**.
4. `App._startBattle` передаёт в **`Battle.init`** колбэки на лог и `BattlefieldUI`.

Тестовый бой (`App.initBattle`) использует **`createTestBattle()`** из `battleUnits.js` без локации.

---

## UI карточек коллекции

- **`UnitCard.buildMiniCard`** — верстка `.fc` для союзников (казарма, библиотека, магазин); **`LibraryUI.buildEnemyCard`** — `.ec` для врагов.
- Детали: модалка карточки союзника (`showCardDetail`), оверлей врага (`LibraryUI.showEnemyDetail`).

PNG-арты: массив **`CARDS_WITH_ART`** в `unitCard.js` (сейчас может быть пустым); иначе показывается emoji.

---

## Стили

Основной каскад: **`css/style.css`** (общий объём: экраны деревни, боя, карточки `.fc` / `.ec`, сетка поля).

---

## Расширение

- Новый союзник: запись в **`ALLIES`** + при необходимости обновление дропа/магазина.
- Новый враг: **`ENEMY_TEMPLATES`** + включение id в **`locations.js`**.
- Новая локация: элемент **`LOCATIONS`** с полями наград и ограничений.
- Новый статус: **`Effects`** + обработка в `battle.js`.
- Новое здание: таб в **`VillageUI`**, пункт на **`villageMap.js`**, при необходимости новый `screen-*` в HTML.

---

## Версия

В UI указано **v0.1**; структура и API могут меняться — при изменении `SAVE_KEY` или формата сохранения нужна миграция (сейчас частично есть для `equipped`).
