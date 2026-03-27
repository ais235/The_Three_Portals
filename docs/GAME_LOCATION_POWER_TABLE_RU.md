# Таблица силы локаций (баланс)

Документ синхронизирован с текущим кодом (`js/data/battleUnits.js`, `js/balanceTool.js`, `js/ui/worldmap.js`).

## 1) Формулы и пайплайн расчёта

### 1.1 Сила юнита (`calculateUnitPower`)

Для юнита со статами `s`:

- `atk = meleeAtk + rangeAtk + magic`
- `def = meleeDef + rangeDef + magicDef`
- `basePower = 0.35 * maxHp + 3.0 * atk + 0.8 * def + 6 * initiative`
- `roleMod`:
  - `tank: 0.9`, `bruiser: 1.0`, `assassin: 1.1`, `archer: 1.1`,
  - `mage: 1.15`, `healer: 0.85`, `control: 1.1`, `boss: 1.2`
- `abilityMod`:
  - `+0.15`, если есть spell типа `heal`
  - `+0.15`, если есть spell типа `poison`
  - `+0.2`, если есть `stun|freeze|disable`
  - `+0.1`, если атакует 2+ колонок
  - `+0.1`, если есть дальняя/магическая атака

Итог:

`unitPower = round(basePower * roleMod * abilityMod)`

### 1.2 Сила группы (`calculateGroupPower`)

- `sum = Σ unitPower`
- `countMod = 1 + (N - 1) * 0.12`
- `groupPower = round(sum * countMod)`

### 1.3 Подготовка врагов перед макро-скейлом

Для encounter:

1. Нормализация числа врагов (`normalizeEncounterToCount`):
   - если меньше нужного количества — добор случайно из `location.enemies`
   - если больше — обрезка
2. Размещение по колонкам (`buildEncounterPlacedUnits`):
   - `melee -> col 1`, `ranged -> col 2`, `magic -> col 3`
   - лимит 3 юнита в колонке
3. Синергии (`applyEnemySynergies`):
   - `swarm`: `meleeAtk += count-1`
   - `tank + bruiser`: `bruiser.meleeAtk *= 1.2`
   - `control`: всем `initiative *= 1.1`
   - `boss`: всем `meleeAtk *= 1.15`, `rangeAtk *= 1.15`, `magic *= 1.15`
4. Микро-скейл encounter (`encounter.statScale`) через `applyEncounterStoredStatScale`.

### 1.4 Макро-скейл к цели боя (`generateLocationEnemies`)

`baseEncounterPower = calculateGroupPower(enemies_after_synergy_and_statScale)`

Целевая сила:

- если есть dev-override: `targetEncounterPower = override.targetPower`
- иначе случайно из диапазона локации: `targetPower[0]..targetPower[1]`

Множитель:

- `scale = targetEncounterPower / baseEncounterPower`
- с override: clamp `0.1..10`
- без override: clamp `0.85..1.15`

Затем `applyEnemyStatScale` (масштабирует `maxHp/hp`, все атаки и защиты).

## 2) Выбор encounter и веса

`pickEncounterForLocation`:

- сначала отбирает encounter, попавшие в `location.targetPower` по `estimateEncounterPowerAfterSynergies`
- если есть такие — выбирает из них
- если нет — выбирает среди ближайших к диапазону
- выбор внутри пула — **взвешенный** (`_weightedPickEnc`)

Эффективный вес encounter (`getEncounterEffectiveWeight`):

- `override.weight` (если задан в dev tool)
- иначе `encounter.weight` (если задан в данных)
- иначе `1`

## 3) Количество врагов

`getRecommendedEnemyCountRange(maxUnits)`:

- `maxUnits <= 2 -> 1..2`
- `maxUnits == 3 -> 2..3`
- `maxUnits >= 4 -> 3..4`

Реальный спавн (`sampleEnemyCountWithPlusOne`):

- базовый диапазон выше (70%)
- `+1` враг с шансом `30%`

UI карты мира показывает диапазон:

`min = baseMin`, `max = baseMax + 1`

## 4) Dev-система таблицы баланса

Хранилище:

`window.__BALANCE_OVERRIDES__ = { encounters: { [encounterId]: { targetPower?, weight? } } }`

Persist:

- `loadBalanceOverrides()` / `saveBalanceOverrides()`
- `localStorage` ключ: `balanceOverrides`

Инструменты:

- модалка `#balance-modal` (кнопка «Баланс»)
- поля `target`/`weight`, кнопка `Применить`, быстрые `+50/-50`
- значения в колонке силы считаются функцией `estimateEnemyPowerAsInBattle` (та же логика, что и в бою)

Важно:

- `targetPower` в таблице — это **целевая сила врага в бою после макро-скейла**
- базовые данные врагов не переписываются
- правки идут только через override-слой

## 5) Актуальная таблица локаций (параметры)

| Локация | Zone | Макс. звёзд | Макс. юнитов | Кол-во врагов в бою (min-max) | Базовый пул врагов |
| --- | --- | --- | --- | --- | --- |
| Крысиные норы | 1 | 3 | 3 | 2–4 | rat, large_rat |
| Паутинные туннели | 1 | 1 | 3 | 2–4 | spider, spider, large_rat |
| Змеиные гнёзда | 1 | 1 | 4 | 3–5 | snake, viper |
| Опушка леса | 1 | 2 | 4 | 3–5 | bandit_club, bandit_bow |
| Лесная тропа | 1 | 2 | 5 | 3–5 | bandit_club, bandit_bow, hypnotist |
| Атаман Кровавый Кулак | 1 | 2 | 5 | 3–5 | bandit_warlord, bandit_captain |
| Разбойный стан | 2 | 2 | 5 | 3–5 | bandit_captain, bandit_bow, hypnotist |
| Заброшенный храм | 2 | 3 | 6 | 3–5 | skeleton, ghost, dark_mage |
| Горный перевал | 2 | 3 | 6 | 3–5 | troll, mountain_bandit, skeleton_archer |
| Страж Храма | 2 | 3 | 6 | 3–5 | temple_guardian, skeleton, ghost |
| Пещера троллей | 3 | 3 | 6 | 3–5 | troll, troll_chief, orc |
| Логово нежити | 3 | 4 | 6 | 3–5 | dark_knight, skeleton, necromancer_acolyte |
| Крепость орков | 3 | 4 | 6 | 3–5 | orc, orc_shaman, stone_golem, dark_knight |
| Командир крепости | 3 | 4 | 6 | 3–5 | fortress_commander, dark_knight, orc_shaman |
| Тёмный лес | 4 | 4 | 6 | 3–5 | vampire, ghost, death_knight |
| Замок некроманта | 4 | 5 | 6 | 3–5 | lich, necromancer_acolyte, death_knight |
| Тронный зал | 4 | 5 | 6 | 3–5 | lich, vampire, death_knight, necromancer_acolyte |
| Некромант Морт | 5 | 5 | 6 | 3–5 | necromancer, lich, death_knight |

> Точные power-значения по каждому encounter зависят от текущих `targetPower`, `weight`, `statScale` и dev-override; смотреть их нужно в runtime-таблице «Баланс».

