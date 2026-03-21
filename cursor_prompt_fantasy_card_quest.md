# CURSOR PROMPT — Fantasy Card Quest
## Прототип боевой системы (Этап 1)

---

## КОНТЕКСТ И СТЕК

Ты создаёшь **тактическую карточную RPG** в браузере.
Стек: чистый HTML + CSS + JavaScript (без фреймворков).
Один файл `index.html` для старта, потом разбиваем на модули.
Стиль: яркое фэнтези, вдохновлённый Brawl Stars — толстые контуры, насыщенные цвета.

---

## ЭТАП 1 — БОЕВАЯ СИСТЕМА (прототип)

### Что нужно реализовать в этом этапе:

1. Поле боя с расстановкой юнитов
2. Пошаговый бой с инициативой
3. Три режима: тактический / авто / быстрый
4. Базовый UI: HP бары, кнопки действий, лог боя

---

## СТРУКТУРА ПОЛЯ БОЯ

```
СОЮЗНИКИ                    ВРАГИ
кол.3   кол.2   кол.1  |  кол.1   кол.2   кол.3
[Маг]  [Лучн] [Воин]   |  [Воин]  [Лучн]  [Маг]
[Маг]  [Лучн] [Воин]   |  [Воин]  [Лучн]  [Маг]
[Маг]  [Лучн] [Воин]   |  [Воин]  [Лучн]  [Маг]

Колонка 1 = передний ряд  (бойцы ближнего боя)
Колонка 2 = средний ряд   (лучники / арбалетчики)
Колонка 3 = задний ряд    (маги)
```

Визуально: союзники слева, враги справа, между ними разделитель.
Каждая ячейка — карточка юнита с именем, HP баром, иконкой класса.

---

## ДАННЫЕ ЮНИТОВ

### Структура объекта юнита (JavaScript):

```javascript
const unitTemplate = {
  id: "unique_id",
  name: "Имя",
  class: "warrior" | "spearman" | "archer" | "crossbowman" | "mage_aoe" | "mage_single" | "mage_healer",
  subclass: "tank" | "damage",   // только для warrior/spearman
  stars: 1,                       // 1-5
  powerLevel: 1,                  // 1 до (10 * stars)
  column: 1 | 2 | 3,             // позиция на поле
  row: 1 | 2 | 3,                // позиция на поле
  side: "ally" | "enemy",

  // Характеристики (рассчитываются по формуле)
  stats: {
    hp: 0,        maxHp: 0,
    meleeAtk: 0,  meleeDef: 0,
    rangeAtk: 0,  rangeDef: 0,
    mana: 0,      maxMana: 0,   manaRegen: 0,
    magic: 0,     magicDef: 0,
    initiative: 0,
  },

  // Базовые значения до применения формулы
  base: {
    hp: 60,
    meleeAtk: 12, meleeDef: 10,
    rangeAtk: 0,  rangeDef: 8,
    magic: 0,     magicDef: 5,
    mana: 0,      manaRegen: 0,
    initiative: 4,
  },

  abilities: [],    // список способностей
  status: [],       // активные эффекты: poison, stun, blessed...
  isAlive: true,
};
```

### Формула расчёта характеристик:

```javascript
function calcStat(base, stars, powerLevel) {
  return Math.round(base * (1 + stars * 0.2) * (1 + powerLevel * 0.05));
}

function calcInitiative(baseInit, stars, powerLevel) {
  return baseInit + (powerLevel * 0.1) + (stars * 0.5);
}
```

---

## ТЕСТОВЫЕ КАРТЫ ДЛЯ ПРОТОТИПА

### ВОИНЫ (колонка 1)

#### Подкласс: Танк

```javascript
{
  name: "Стражник",
  class: "warrior", subclass: "tank",
  stars: 1,
  base: { hp: 65, meleeAtk: 11, meleeDef: 11, rangeDef: 7, magicDef: 5, initiative: 4 },
  abilities: [
    {
      id: "guard_weak",
      name: "Защита слабых",
      description: "Если союзник в колонке 2 имеет HP < 30% — Стражник получает -20% урона",
      type: "passive"
    }
  ]
}

{
  name: "Ополченец",
  class: "warrior", subclass: "tank",
  stars: 1,
  base: { hp: 70, meleeAtk: 10, meleeDef: 12, rangeDef: 6, magicDef: 4, initiative: 3 },
  abilities: [
    {
      id: "shield_wall",
      name: "Щитовой строй",
      description: "Если рядом другой ополченец — получает -15% урона",
      type: "passive"
    }
  ]
}
```

#### Подкласс: Дамагер

```javascript
{
  name: "Копейщик-новичок",
  class: "spearman", subclass: "damage",
  stars: 1,
  base: { hp: 60, meleeAtk: 12, meleeDef: 10, rangeDef: 8, magicDef: 5, initiative: 4 },
  abilities: [
    {
      id: "spear_row",
      name: "Копейный ряд",
      description: "+20% урона если рядом другой копейщик",
      type: "passive"
    },
    {
      id: "reach",
      name: "Досягаемость копья",
      // КЛЮЧЕВАЯ МЕХАНИКА: копейщик атакует колонку 1 и колонку 2 врагов
      description: "Копьё достаёт до стрелков — может атаковать врагов в колонке 1 и колонке 2",
      type: "passive",
      attackColumns: [1, 2]  // переопределяет стандартный [1] для ближников
    }
  ]
}
```

### ЛУЧНИКИ / АРБАЛЕТЧИКИ (колонка 2)

```javascript
{
  name: "Лучник-новичок",
  class: "archer",
  stars: 1,
  base: { hp: 45, meleeAtk: 5, meleeDef: 5, rangeAtk: 14, rangeDef: 4, magicDef: 4, initiative: 6 },
  attackMode: {
    shots: 2,              // два выстрела за ход
    damagePerShot: 1.0,    // базовый урон × 1.0 (штраф ниже)
  },
  // Штраф урона по колонкам:
  // колонка 1 врагов = 100% урона
  // колонка 2 врагов (стрелки) = 75% урона
  // колонка 3 врагов (маги)    = 50% урона — недоступно для лучника
  rangeModifiers: { col1: 1.0, col2: 0.75, col3: null },
  abilities: [
    {
      id: "precise_shot",
      name: "Точный выстрел",
      description: "Раз в 3 хода — игнорирует штраф дальности",
      type: "active", cooldown: 3
    }
  ]
}

{
  name: "Охотник",
  class: "archer",
  stars: 1,
  base: { hp: 50, meleeAtk: 6, meleeDef: 4, rangeAtk: 13, rangeDef: 5, magicDef: 3, initiative: 7 },
  attackMode: { shots: 2, damagePerShot: 1.0 },
  rangeModifiers: { col1: 1.0, col2: 0.75, col3: null },
  abilities: [
    {
      id: "beast_grip",
      name: "Звериная хватка",
      description: "+30% урона по зверям (крысы, пауки, змеи)",
      type: "passive"
    }
  ]
}

{
  name: "Арбалетчик",
  class: "crossbowman",
  stars: 1,
  base: { hp: 55, meleeAtk: 5, meleeDef: 6, rangeAtk: 16, rangeDef: 4, magicDef: 3, initiative: 4 },
  attackMode: {
    shots: 1,
    damagePerShot: 1.2,    // +20% к урону за выстрел
  },
  rangeModifiers: { col1: 1.0, col2: 0.75, col3: 0.5 },
  // Арбалетчик МОЖЕТ стрелять в колонку 3 (маги) с штрафом 50%
  abilities: [
    {
      id: "heavy_bolt",
      name: "Тяжёлый болт",
      description: "Раз в 4 хода: +50% урона и пробивает 20% защиты цели",
      type: "active", cooldown: 4
    }
  ]
}
```

### МАГИ (колонка 3)

```javascript
{
  name: "Ученик огня",
  class: "mage_aoe",
  stars: 1,
  base: { hp: 35, meleeAtk: 4, meleeDef: 3, magicDef: 6, magic: 15, mana: 60, manaRegen: 20, initiative: 5 },
  // manaRegen: 20% от maxMana в начале каждого хода
  spells: [
    {
      id: "fire_flash",
      name: "Огненная вспышка",
      cost: 20,
      damage: { min: 10, max: 15 },
      target: "all_enemies",   // все враги
      type: "magic_aoe"
    },
    {
      id: "fireball",
      name: "Пламенный шар",
      cost: 40,
      damage: { min: 25, max: 35 },
      target: "single",
      type: "magic_single"
    }
  ]
}

{
  name: "Электрик",
  class: "mage_single",
  stars: 1,
  base: { hp: 38, meleeAtk: 4, meleeDef: 3, magicDef: 7, magic: 18, mana: 70, manaRegen: 20, initiative: 6 },
  spells: [
    {
      id: "discharge",
      name: "Разряд",
      cost: 15,
      damage: { min: 18, max: 22 },
      target: "single",
      type: "magic_single"
    },
    {
      id: "chain_lightning",
      name: "Цепная молния",
      cost: 35,
      damage: { min: 12, max: 18 },
      target: "random_3",   // 3 случайных врага
      type: "magic_chain"
    }
  ]
}

{
  name: "Послушник света",
  class: "mage_healer",
  stars: 1,
  base: { hp: 40, meleeAtk: 4, meleeDef: 4, magicDef: 8, magic: 12, mana: 80, manaRegen: 20, initiative: 4 },
  spells: [
    {
      id: "light_arrow",
      name: "Светлая стрела",
      cost: 12,
      damage: { min: 8, max: 12 },
      target: "single_enemy",
      type: "magic_single"
    },
    {
      id: "minor_heal",
      name: "Малый лекарь",
      cost: 25,
      heal: { min: 20, max: 30 },
      target: "lowest_hp_ally",   // союзник с наименьшим HP
      type: "heal"
    }
  ]
}
```

---

## ВРАГИ ДЛЯ ПЕРВОЙ ЛОКАЦИИ (1★)

```javascript
const enemies = {
  rat: {
    name: "Крыса",
    type: "beast",
    base: { hp: 25, meleeAtk: 8, meleeDef: 3, rangeDef: 2, magicDef: 1, initiative: 6 },
    ai: "attack_lowest_hp"
  },
  spider: {
    name: "Паук",
    type: "beast",
    base: { hp: 30, meleeAtk: 7, meleeDef: 4, rangeDef: 3, magicDef: 2, initiative: 5 },
    abilities: [{
      id: "poison_bite",
      name: "Ядовитый укус",
      description: "20% шанс отравить на 3 хода (3 урона/ход)",
      type: "on_hit"
    }],
    ai: "attack_lowest_hp"
  },
  snake: {
    name: "Змея",
    type: "beast",
    base: { hp: 28, meleeAtk: 9, meleeDef: 2, rangeDef: 2, magicDef: 1, initiative: 7 },
    abilities: [{
      id: "dodge",
      name: "Уклонение",
      description: "15% шанс избежать атаки",
      type: "passive"
    }],
    ai: "attack_front_first"
  }
};
```

---

## ПРАВИЛА АТАКИ ПО КОЛОНКАМ

```javascript
// Кто куда может атаковать:
const attackRules = {
  warrior:      { melee: [1],       range: [],        magic: [] },
  spearman:     { melee: [1, 2],    range: [],        magic: [] },  // копьё достаёт до стрелков!
  archer:       { melee: [1],       range: [1, 2],    magic: [] },  // col3 недоступна
  crossbowman:  { melee: [1],       range: [1, 2, 3], magic: [] },  // col3 с штрафом 50%
  mage_aoe:     { melee: [1],       range: [],        magic: [1, 2, 3] },
  mage_single:  { melee: [1],       range: [],        magic: [1, 2, 3] },
  mage_healer:  { melee: [1],       range: [],        magic: [1, 2, 3] },
};

// Штрафы дальности для лучников/арбалетчиков:
const rangeModifiers = {
  archer:      { 1: 1.0, 2: 0.75, 3: null },
  crossbowman: { 1: 1.0, 2: 0.75, 3: 0.50 },
};

// Правило "пустой колонки":
// Если колонка 1 врагов пуста — ближний бой бьёт по колонке 2
// Если колонки 1 и 2 пусты — ближний бой бьёт по колонке 3
// Это же правило для лучников при выборе приоритета
```

---

## ФОРМУЛА УРОНА

```javascript
function calcDamage(attacker, target, attackType, columnModifier = 1.0) {
  let attack, defense;

  if (attackType === "melee") {
    attack = attacker.stats.meleeAtk;
    defense = target.stats.meleeDef;
  } else if (attackType === "range") {
    attack = attacker.stats.rangeAtk * columnModifier;
    defense = target.stats.rangeDef;
  } else if (attackType === "magic") {
    attack = attacker.stats.magic;
    defense = target.stats.magicDef;
  }

  const random = 0.9 + Math.random() * 0.2;  // 0.9 - 1.1
  const damage = Math.max(1, Math.round((attack - defense) * random));
  return damage;
}
```

---

## ПОРЯДОК ХОДА (ИНИЦИАТИВА)

```javascript
function getBattleOrder(allUnits) {
  // Считаем инициативу для всех живых юнитов
  const alive = allUnits.filter(u => u.isAlive);
  alive.forEach(u => {
    u.currentInitiative = calcInitiative(u.base.initiative, u.stars, u.powerLevel)
                         + Math.random() * 0.01; // тай-брейкер
  });
  // Сортируем по убыванию
  return alive.sort((a, b) => b.currentInitiative - a.currentInitiative);
}
// Порядок пересчитывается каждый раунд!
```

---

## AI ВРАГОВ

```javascript
// Простой AI для прототипа:
function enemyAI(enemy, allies) {
  // 1. Найти живых союзников игрока в доступных колонках
  // 2. Приоритет: ближайшая колонка (col1 → col2 → col3)
  // 3. Среди доступных — атаковать юнита с наименьшим HP
  // 4. Если есть заклинание и достаточно маны — использовать (50% шанс)

  const targetColumn = getLowestAvailableColumn(allies);
  const targets = allies.filter(a => a.isAlive && a.column === targetColumn);
  return targets.sort((a, b) => a.stats.hp - b.stats.hp)[0];
}
```

---

## РЕЖИМЫ БОЯ

```javascript
// ТАКТИЧЕСКИЙ РЕЖИМ:
// - Игрок нажимает "Следующий ход"
// - Показывается кто ходит сейчас (подсветка)
// - Для союзника: игрок выбирает цель кликом
// - Для врага: AI выбирает автоматически с задержкой 800ms
// - Лог событий обновляется после каждого действия

// АВТО-РЕЖИМ:
// - Кнопка "Авто-бой"
// - Все юниты (и союзники и враги) действуют по AI
// - Задержка между ходами: 600ms
// - Игрок может остановить в любой момент → вернуться в тактический

// БЫСТРЫЙ БОЙ:
// - Кнопка "Быстрый бой" (разблокируется после первой победы в локации)
// - Симулируется весь бой в JS без рендера
// - Показывается только итог: победа/поражение + потери
```

---

## UI — ЧТО НУЖНО ОТРИСОВАТЬ

### Экран боя:

```
┌─────────────────────────────────────────────────────┐
│  [Раунд: 1]          [Авто] [Быстро] [Выйти]        │
├───────────────────────┬─────────────────────────────┤
│   СОЮЗНИКИ            │           ВРАГИ              │
│  кол3  кол2  кол1     │    кол1  кол2  кол3          │
│ [Маг][Луч][Вой]      │   [Крыс][    ][    ]         │
│ [Маг][Луч][Вой]      │   [Пауk][    ][    ]         │
│ [   ][   ][   ]      │   [    ][    ][    ]          │
├─────────────────────────────────────────────────────┤
│ ХОД: Копейщик-новичок                               │
│ [Атака] [Способность] [Пропустить]                  │
├─────────────────────────────────────────────────────┤
│ ЛОГ БОЯ:                                            │
│ • Крыса атакует Стражника — 5 урона                 │
│ • Паук укусил Лучника — 7 урона (яд!)               │
└─────────────────────────────────────────────────────┘
```

### Карточка юнита:

```
┌──────────┐
│  [ИКОНКА]│  ← emoji или цветной блок по классу
│  Стражник│
│ ████░░░░ │  ← HP бар (зелёный → жёлтый → красный)
│ 45/65 HP │
│ ⚡ Инц: 4.5│
└──────────┘
```

### Цвета по классу:
- Воин-танк: синий (#185FA5)
- Воин-дамагер / Копейщик: фиолетовый (#534AB7)
- Лучник: зелёный (#3B6D11)
- Арбалетчик: тёрзо-зелёный (#0F6E56)
- Маг AoE: оранжевый (#BA7517)
- Маг точечный: жёлтый (#854F0B)
- Маг-хилер: белый/светлый (#185FA5)
- Враги: оттенки красного (#A32D2D, #993C1D)

---

## СТРУКТУРА ФАЙЛОВ (предлагаемая)

```
/fantasy-card-quest/
├── index.html          ← точка входа, разметка
├── css/
│   └── style.css       ← стили (Brawl Stars: толстые контуры, яркие цвета)
└── js/
    ├── data/
    │   ├── units.js    ← все карты юнитов
    │   └── enemies.js  ← все враги
    ├── engine/
    │   ├── battle.js   ← логика боя, порядок хода, формулы
    │   ├── ai.js       ← AI врагов и авто-режим
    │   └── effects.js  ← яд, оглушение, баффы
    └── ui/
        ├── battlefield.js  ← рендер поля боя
        ├── unitCard.js     ← рендер карточки юнита
        └── battleLog.js    ← лог событий
```

---

## ТЕСТОВЫЙ СЦЕНАРИЙ (стартовый бой)

Для первого запуска захардкодить:

**Союзники:**
- кол.1, ряд.1: Стражник (1★, уровень 1)
- кол.1, ряд.2: Копейщик-новичок (1★, уровень 1)
- кол.2, ряд.1: Лучник-новичок (1★, уровень 1)
- кол.3, ряд.1: Послушник света (1★, уровень 1)

**Враги (Крысиные норы):**
- кол.1, ряд.1: Крыса
- кол.1, ряд.2: Паук
- кол.1, ряд.3: Змея

**Победа:** все враги мертвы
**Поражение:** все союзники мертвы

---

## ЧТО НЕ НУЖНО В ЭТОМ ЭТАПЕ

- Система монет и наград (этап 2)
- Свитки порталов и коллекция карт (этап 2)
- Карта мира (этап 3)
- Деревня и здания (этап 4)
- Артефакты и Храм (этап 4)
- Система прокачки/пыли (этап 2)
- Звуки и сложная анимация (этап 7)

Сначала **бой должен работать** — красиво и правильно.

---

## ПЕРВЫЙ ЗАПРОС К CURSOR

Скопируй и вставь в Cursor:

---

> Создай прототип боевой системы тактической карточной RPG.
> Используй HTML + CSS + JavaScript без фреймворков.
>
> Начни с файла `index.html` и папки `js/` и `css/`.
>
> **Первым делом реализуй:**
> 1. Структуру данных юнитов (по файлу js/data/units.js)
> 2. Рендер поля боя — 3 колонки союзников слева, 3 колонки врагов справа
> 3. Карточки юнитов с именем, HP баром, иконкой класса
> 4. Тестовый сценарий: 4 союзника vs 3 крысы/паука/змеи
>
> Стиль: яркое фэнтези, вдохновлён Brawl Stars — толстые контуры (#2a2a2a 3px),
> насыщенные цвета, закруглённые карточки, тени.
>
> Полное ТЗ прикреплено в файле cursor_prompt_fantasy_card_quest.md

---

*Документ версии 1.0 — Этап 1: Боевая система*
*Следующий этап: коллекция карт, монеты, свитки порталов*
