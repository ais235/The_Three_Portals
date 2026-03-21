// ============================================================
// FANTASY CARD QUEST — ПОЛНАЯ БАЗА ДАННЫХ ЮНИТОВ v1.0
// ============================================================
// Структура: allies (союзники) + enemies (враги по локациям)
// Формула: Значение = База × (1 + звёздность×0.2) × (1 + уровень×0.05)
// Инициатива = базовая + (уровень×0.1) + (звёздность×0.5)
// ============================================================

// ─────────────────────────────────────────
// УТИЛИТЫ
// ─────────────────────────────────────────
function calcStat(base, stars, level) {
  return Math.round(base * (1 + stars * 0.2) * (1 + level * 0.05));
}
function calcInitiative(baseInit, stars, level) {
  return +(baseInit + level * 0.1 + stars * 0.5).toFixed(1);
}

// ─────────────────────────────────────────
// СОЮЗНИКИ
// ─────────────────────────────────────────

const ALLIES = {

  // ══════════════════════════════
  // ВОИНЫ — ТАНКИ (колонка 1)
  // ══════════════════════════════

  straznik: {
    id: "straznik",
    name: "Стражник",
    class: "warrior",
    subclass: "tank",
    column: 1,
    color: "#1a3a6b",

    base: { hp: 65, meleeAtk: 11, meleeDef: 11, rangeDef: 7, magicDef: 5, initiative: 4 },

    // Описание по звёздам
    lore: {
      1: {
        title: "Стражник",
        use: "Базовый танк. Ставь в колонку 1, он держит удар пока остальные атакуют.",
        flavor: "Молодой солдат городской стражи. Щит потёрт, но держится крепко."
      },
      2: {
        title: "Стражник ветеран",
        use: "Щитовой строй делает двух стражников очень выгодной парой. Ставь их рядом.",
        flavor: "Прошёл десяток стычек. Шрамы на щите — его награды."
      },
      3: {
        title: "Страж Цитадели",
        use: "Контратака делает его опасным. Враги начнут бояться атаковать его.",
        flavor: "Элита городской обороны. Его имя знают в трёх провинциях."
      },
      4: {
        title: "Железный Страж",
        use: "Вызов — игровое умение. Активируй в нужный момент чтобы спасти хилера.",
        flavor: "Говорят, его доспехи выплавлены из осколков древнего голема."
      },
      5: {
        title: "Легендарный Страж",
        use: "Несокрушимый — страховка в самом важном бою. Береги его для боссов.",
        flavor: "Легенды говорят — он падал много раз. Но не умер ни разу."
      }
    },

    // Прирост статов при повышении звёзд
    starBonuses: {
      2: { hp: +32, meleeAtk: +4, meleeDef: +4 },
      3: { hp: +50, meleeDef: +8 },
      4: { hp: +80, meleeDef: +12 },
      5: { hp: +130, meleeDef: +20 }
    },

    // Способности по звёздам
    abilities: [
      {
        id: "guard_weak",
        name: "Защита слабых",
        unlockedAt: 1,
        type: "passive",
        description: "Если союзник в колонке 2 имеет HP < 30% — Стражник получает −20% урона.",
        tacticalNote: "Следи за HP лучников. Как только они краснеют — Стражник автоматически стает крепче."
      },
      {
        id: "shield_wall",
        name: "Щитовой строй",
        unlockedAt: 2,
        type: "passive",
        description: "Если рядом (в той же колонке) стоит другой воин-танк — оба получают −15% урона.",
        tacticalNote: "Два стражника вместе = сокращение урона на 15%. Выгоднее чем один сильный танк."
      },
      {
        id: "counter_strike",
        name: "Контратака",
        unlockedAt: 3,
        type: "on_hit",
        description: "30% шанс ответить на ближний удар (наносит 50% от своей атаки).",
        tacticalNote: "Не управляемое — просто случается. Хорошо против быстрых дамагеров."
      },
      {
        id: "provoke",
        name: "Вызов",
        unlockedAt: 4,
        type: "active",
        cooldown: "1 раз за бой",
        duration: "2 хода",
        description: "Все враги обязаны атаковать только Стражника в течение 2 ходов.",
        tacticalNote: "АКТИВНОЕ умение. Используй когда маг или хилер под угрозой смерти."
      },
      {
        id: "unbreakable",
        name: "Несокрушимый",
        unlockedAt: 5,
        type: "passive",
        description: "Один раз за бой, вместо смерти, остаётся с 1 HP.",
        tacticalNote: "Страховка для решающего боя. Делает его фактически unkillable в первый удар."
      }
    ],

    // Специализация (очки игрок распределяет сам)
    specialization: {
      available: ["meleeDef", "rangeDef", "magicDef"],
      bonusPerPoint: { meleeDef: 2, rangeDef: 2, magicDef: 1 },
      maxPointsPerStat: 3,
      totalPoints: 5,
      note: "Танк качает защиту. Выбор: стать неуязвимым к физике или сбалансировать все виды защиты."
    }
  },

  // ──────────────────────────────
  opolchenec: {
    id: "opolchenec",
    name: "Ополченец",
    class: "warrior",
    subclass: "tank",
    column: 1,
    color: "#2d4a1e",

    base: { hp: 70, meleeAtk: 10, meleeDef: 12, rangeDef: 6, magicDef: 4, initiative: 3 },

    lore: {
      1: {
        title: "Ополченец",
        use: "Самый высокий базовый HP среди 1★ танков. Просто стоит и держит.",
        flavor: "Фермер с дубиной и деревянным щитом. Деревня сама его снарядила."
      },
      2: {
        title: "Ополченец-щитоносец",
        use: "Командный игрок. Лучший вместе с другим ополченцем.",
        flavor: "Обучился у старого ветерана. Щит теперь железный."
      },
      3: {
        title: "Народный защитник",
        use: "Вал стойкости даёт всей команде временную защиту — уникальная АоЕ способность у танка.",
        flavor: "За ним идут соседи. Его не победить одному."
      },
      4: {
        title: "Ополченный капитан",
        use: "Боевой клич — баффер. Активируй перед тяжёлым раундом.",
        flavor: "Стал лидером. Теперь сам обучает новых бойцов."
      },
      5: {
        title: "Воин народа",
        use: "Жертвенная защита — уникальная механика: поглощает урон вместо союзника.",
        flavor: "Легенда деревни. Говорят, его не берут стрелы — уходят в сторону."
      }
    },

    starBonuses: {
      2: { hp: +35, meleeDef: +5 },
      3: { hp: +55, meleeDef: +7 },
      4: { hp: +85, meleeAtk: +8 },
      5: { hp: +140, meleeDef: +18 }
    },

    abilities: [
      {
        id: "solidarity",
        name: "Солидарность",
        unlockedAt: 1,
        type: "passive",
        description: "Если рядом другой ополченец — оба получают +10% к атаке.",
        tacticalNote: "Синергия с парным размещением. Слабее щитового строя, зато даёт атаку."
      },
      {
        id: "bulwark",
        name: "Вал стойкости",
        unlockedAt: 2,
        type: "passive",
        description: "Пока Ополченец жив — все союзники получают +5% к защите от дальнего боя.",
        tacticalNote: "Пассивный аурный бафф. Особенно ценен против локаций с лучниками."
      },
      {
        id: "rally",
        name: "Народный клич",
        unlockedAt: 3,
        type: "active",
        cooldown: "каждые 4 хода",
        description: "Все союзники получают +15% к атаке на 2 хода.",
        tacticalNote: "АКТИВНОЕ. Синхронизируй с ходом мага или лучника для максимального взрыва урона."
      },
      {
        id: "sacrifice_shield",
        name: "Жертвенный щит",
        unlockedAt: 4,
        type: "active",
        cooldown: "1 раз за бой",
        description: "Выбираешь союзника — следующий удар по нему поглощает Ополченец.",
        tacticalNote: "Спасает хилера или мага от критического удара. Требует ручного управления."
      },
      {
        id: "indomitable",
        name: "Несгибаемый",
        unlockedAt: 5,
        type: "passive",
        description: "Получает не более 30% максимального HP за один удар.",
        tacticalNote: "Пассивный кап урона. Делает его невозможно убить одним залпом."
      }
    ],

    specialization: {
      available: ["hp", "meleeDef", "rangeDef"],
      bonusPerPoint: { hp: 8, meleeDef: 2, rangeDef: 2 },
      maxPointsPerStat: 3,
      totalPoints: 5,
      note: "Ополченец — живучесть. Качай HP или защиту в зависимости от локации."
    }
  },

  // ══════════════════════════════
  // ВОИНЫ — ДАМАГЕРЫ (колонка 1)
  // ══════════════════════════════

  kopeyshik: {
    id: "kopeyshik",
    name: "Копейщик",
    class: "spearman",
    subclass: "damage",
    column: 1,
    color: "#5c3a1e",

    base: { hp: 60, meleeAtk: 12, meleeDef: 10, rangeDef: 8, magicDef: 5, initiative: 4 },

    attackColumns: [1, 2], // КЛЮЧЕВАЯ МЕХАНИКА: достаёт до стрелков

    lore: {
      1: {
        title: "Копейщик-новичок",
        use: "Единственный ближник который достаёт до колонки 2 врагов (стрелков). Используй это.",
        flavor: "Длинное копьё досталось ему от деда. Пока неловкий, но упорный."
      },
      2: {
        title: "Копейщик",
        use: "Копейный ряд: +20% урона рядом с другим копейщиком. Ставь их парой.",
        flavor: "Научился держать строй. Теперь копьё — продолжение руки."
      },
      3: {
        title: "Ветеран-копейщик",
        use: "Пронзающий удар игнорирует часть защиты — идеален против бронированных врагов.",
        flavor: "Прошёл три войны. Копьё сменил, но руки помнят всё."
      },
      4: {
        title: "Копьеносец",
        use: "Вихрь копья — АоЕ по всей колонке 1 и 2 врагов одновременно.",
        flavor: "Его имя кричат перед атакой. Враги уже бегут."
      },
      5: {
        title: "Легендарный пикинёр",
        use: "Прорыв позволяет атаковать ВСЕ три колонки врагов. Уникально для ближника.",
        flavor: "Говорят, его копьё видели одновременно в двух местах битвы."
      }
    },

    starBonuses: {
      2: { meleeAtk: +5, hp: +10 },
      3: { meleeAtk: +8, hp: +20 },
      4: { meleeAtk: +12, hp: +30 },
      5: { meleeAtk: +18, hp: +50 }
    },

    abilities: [
      {
        id: "spear_reach",
        name: "Досягаемость копья",
        unlockedAt: 1,
        type: "passive",
        description: "Может атаковать врагов в колонке 1 и колонке 2 (стрелки).",
        tacticalNote: "Главная фишка класса. Убивай лучников врага раньше чем они убьют твоих."
      },
      {
        id: "spear_row",
        name: "Копейный ряд",
        unlockedAt: 2,
        type: "passive",
        description: "Если рядом другой копейщик — оба получают +20% к урону.",
        tacticalNote: "Синергия сильнее чем у щитового строя, но даёт атаку а не защиту."
      },
      {
        id: "pierce",
        name: "Пронзающий удар",
        unlockedAt: 3,
        type: "active",
        cooldown: "каждые 3 хода",
        description: "Удар игнорирует 30% физической защиты цели.",
        tacticalNote: "АКТИВНОЕ. Используй против тяжёлых танков врага."
      },
      {
        id: "spear_whirl",
        name: "Вихрь копья",
        unlockedAt: 4,
        type: "active",
        cooldown: "каждые 5 ходов",
        description: "Атакует всех врагов в колонках 1 и 2 (70% от обычного урона).",
        tacticalNote: "АоЕ по двум колонкам. Шикарно когда у врага плотный строй."
      },
      {
        id: "breakthrough",
        name: "Прорыв",
        unlockedAt: 5,
        type: "passive",
        description: "Теперь может атаковать все три колонки врагов включая магов.",
        tacticalNote: "Единственный ближник с доступом к колонке 3. Убийца магов."
      }
    ],

    specialization: {
      available: ["meleeAtk", "meleeDef", "initiative"],
      bonusPerPoint: { meleeAtk: 3, meleeDef: 2, initiative: 0.3 },
      maxPointsPerStat: 3,
      totalPoints: 5,
      note: "Дамагер качает атаку. Инициатива позволяет ходить раньше и убивать стрелков до их хода."
    }
  },

  // ══════════════════════════════
  // ЛУЧНИКИ (колонка 2)
  // ══════════════════════════════

  luchnik: {
    id: "luchnik",
    name: "Лучник",
    class: "archer",
    subclass: null,
    column: 2,
    color: "#1e4d2b",

    base: { hp: 45, meleeAtk: 5, meleeDef: 5, rangeAtk: 14, rangeDef: 4, magicDef: 4, initiative: 6 },

    attackMode: {
      shots: 2,
      damageModifier: 1.0,  // базовый урон × 1.0 за выстрел (до штрафа дальности)
    },

    rangeModifiers: { col1: 1.0, col2: 0.75, col3: null }, // null = недоступно

    lore: {
      1: {
        title: "Лучник-новичок",
        use: "Два выстрела за ход. Выгодно против слабых врагов — добивает двух разных.",
        flavor: "Охотничий лук, самодельные стрелы. Мечтает стать стрелком королевской гвардии."
      },
      2: {
        title: "Лучник",
        use: "Точный выстрел раз в 3 хода даёт полный урон по колонке 2 — снайпер по стрелкам.",
        flavor: "Лук уже боевой. Первые турниры выиграны."
      },
      3: {
        title: "Меткий стрелок",
        use: "Двойной залп — оба выстрела в одну цель. Убивает одного врага быстро.",
        flavor: "Стреляет не думая. Тело само знает куда."
      },
      4: {
        title: "Дозорный лучник",
        use: "Дождь стрел — АоЕ по всем врагам одной колонки. Шикарно против стаи.",
        flavor: "Патрулирует лесные тропы. За его плечами — сотни километров."
      },
      5: {
        title: "Мастер-лучник",
        use: "Орлиный глаз убирает все штрафы дальности. Теперь бьёт по магам с полным уроном.",
        flavor: "Говорят, он попадает в монету с трёхсот шагов. Монета не соглашается."
      }
    },

    starBonuses: {
      2: { rangeAtk: +6, hp: +5 },
      3: { rangeAtk: +9, hp: +10 },
      4: { rangeAtk: +13, hp: +15 },
      5: { rangeAtk: +18, hp: +25 }
    },

    abilities: [
      {
        id: "double_shot",
        name: "Двойной выстрел",
        unlockedAt: 1,
        type: "passive",
        description: "Делает 2 выстрела за ход. Каждый выстрел можно направить в разные цели.",
        tacticalNote: "Главный плюс класса. Два выстрела = два шанса применить штраф по зонам умно."
      },
      {
        id: "precise_shot",
        name: "Точный выстрел",
        unlockedAt: 2,
        type: "active",
        cooldown: "каждые 3 хода",
        description: "Один выстрел без штрафа дальности (полный урон по любой колонке).",
        tacticalNote: "Используй чтобы добить стрелка врага в колонке 2 без штрафа 25%."
      },
      {
        id: "power_shot",
        name: "Двойной залп",
        unlockedAt: 3,
        type: "active",
        cooldown: "каждые 4 хода",
        description: "Оба выстрела за ход направляются в одну цель (+40% суммарного урона).",
        tacticalNote: "Фокус-огонь. Убивает одного врага очень быстро."
      },
      {
        id: "rain_of_arrows",
        name: "Дождь стрел",
        unlockedAt: 4,
        type: "active",
        cooldown: "каждые 5 ходов",
        description: "Стреляет в ВСЕХ врагов выбранной колонки (70% урона каждому).",
        tacticalNote: "АоЕ лучника. Работает по колонке 1 (100%) или колонке 2 (75% × 0.7)."
      },
      {
        id: "eagles_eye",
        name: "Орлиный глаз",
        unlockedAt: 5,
        type: "passive",
        description: "Все штрафы дальности сняты. Бьёт по всем трём колонкам с полным уроном.",
        tacticalNote: "Теперь доступна колонка 3 (маги врага). Приоритет убийства магов."
      }
    ],

    specialization: {
      available: ["rangeAtk", "rangeDef", "initiative"],
      bonusPerPoint: { rangeAtk: 3, rangeDef: 2, initiative: 0.3 },
      maxPointsPerStat: 3,
      totalPoints: 5,
      note: "Лучник качает дальнюю атаку. Инициатива позволяет ходить до врага."
    }
  },

  // ──────────────────────────────
  ohotnik: {
    id: "ohotnik",
    name: "Охотник",
    class: "archer",
    subclass: null,
    column: 2,
    color: "#2d5a27",

    base: { hp: 50, meleeAtk: 6, meleeDef: 4, rangeAtk: 13, rangeDef: 5, magicDef: 3, initiative: 7 },

    attackMode: { shots: 2, damageModifier: 1.0 },
    rangeModifiers: { col1: 1.0, col2: 0.75, col3: null },

    lore: {
      1: {
        title: "Охотник",
        use: "Самая высокая инициатива среди стрелков (7). Ходит первым и убивает до ответа.",
        flavor: "Месяцами живёт в лесу. Зверей знает лучше чем людей."
      },
      2: {
        title: "Лесной охотник",
        use: "Звериная хватка +30% по зверям. Обязательный юнит для зон 1-3 (крысы, пауки, змеи).",
        flavor: "Следы на земле читает как книгу. Зверь не уйдёт."
      },
      3: {
        title: "Следопыт",
        use: "Расставной капкан замедляет врага — снижает его инициативу. Тактический контроль.",
        flavor: "Ставит ловушки с закрытыми глазами."
      },
      4: {
        title: "Мастер-охотник",
        use: "Слабое место — находит уязвимость врага, +50% урона против помеченного.",
        flavor: "Его метка — приговор. Помеченный зверь не убегает."
      },
      5: {
        title: "Легендарный следопыт",
        use: "Инстинкт хищника даёт второй ход если убил врага. Цепные убийства.",
        flavor: "Лес — его дом. Он не охотится в нём. Он управляет им."
      }
    },

    starBonuses: {
      2: { rangeAtk: +5, hp: +10 },
      3: { rangeAtk: +8, hp: +15, initiative: +1 },
      4: { rangeAtk: +11, hp: +20 },
      5: { rangeAtk: +16, hp: +30 }
    },

    abilities: [
      {
        id: "beast_grip",
        name: "Звериная хватка",
        unlockedAt: 1,
        type: "passive",
        description: "+30% урона против зверей (крысы, пауки, змеи, волки, медведи).",
        tacticalNote: "Обязателен в зонах 1-3. Против разбойников — обычный юнит."
      },
      {
        id: "trap",
        name: "Расставной капкан",
        unlockedAt: 2,
        type: "active",
        cooldown: "каждые 4 хода",
        description: "Помечает врага — его инициатива снижается на 3 до конца боя.",
        tacticalNote: "Помеченный враг ходит позже. Замедли самого опасного."
      },
      {
        id: "weak_spot",
        name: "Слабое место",
        unlockedAt: 3,
        type: "active",
        cooldown: "каждые 3 хода",
        description: "Следующий удар по помеченному врагу наносит +50% урона.",
        tacticalNote: "Комбо с капканом: сначала метка, потом слабое место = смерть врага."
      },
      {
        id: "pursuit",
        name: "Преследование",
        unlockedAt: 4,
        type: "passive",
        description: "Если враг пытается отступить (его передний ряд пуст) — получает +20% урона.",
        tacticalNote: "Карает врага за потерю танков. Стрелки врага без защиты страдают вдвойне."
      },
      {
        id: "predator_instinct",
        name: "Инстинкт хищника",
        unlockedAt: 5,
        type: "passive",
        description: "Если убивает врага — немедленно делает ещё один выстрел.",
        tacticalNote: "Цепные убийства. В удачный раунд может выстрелить 4 раза."
      }
    ],

    specialization: {
      available: ["rangeAtk", "initiative", "rangeDef"],
      bonusPerPoint: { rangeAtk: 3, initiative: 0.4, rangeDef: 2 },
      maxPointsPerStat: 3,
      totalPoints: 5,
      note: "Охотник — скорость и первый удар. Качай инициативу чтобы всегда бить первым."
    }
  },

  // ──────────────────────────────
  arbaletchik: {
    id: "arbaletchik",
    name: "Арбалетчик",
    class: "crossbowman",
    subclass: null,
    column: 2,
    color: "#3d2b1e",

    base: { hp: 55, meleeAtk: 5, meleeDef: 6, rangeAtk: 16, rangeDef: 4, magicDef: 3, initiative: 4 },

    attackMode: {
      shots: 1,
      damageModifier: 1.2,  // один мощный выстрел +20%
    },
    rangeModifiers: { col1: 1.0, col2: 0.75, col3: 0.50 }, // достаёт до магов

    lore: {
      1: {
        title: "Арбалетчик",
        use: "Самый высокий урон за выстрел. Один выстрел но мощный. Единственный стрелок кто бьёт по магам (−50%).",
        flavor: "Арбалет стоит как три лука. Зато отдача у него одна — назад."
      },
      2: {
        title: "Арбалетчик бывалый",
        use: "Тяжёлый болт раз в 4 хода — +50% урона и пробивает 20% защиты. Убийца танков.",
        flavor: "Носит болты в специальном колчане. Каждый пронумерован."
      },
      3: {
        title: "Осадный арбалетчик",
        use: "Дробящий болт накладывает -20% к защите. Открывает врага для всей команды.",
        flavor: "Его арбалет пробивал городские ворота. Теперь пробивает доспехи."
      },
      4: {
        title: "Стрелок-снайпер",
        use: "Снайперский прицел — игнорирует все штрафы дальности. Бьёт магов с полным уроном.",
        flavor: "Три часа лежит неподвижно. Один выстрел. Цель упала."
      },
      5: {
        title: "Легендарный арбалетчик",
        use: "Разрывной болт — АоЕ урон вокруг цели. Один выстрел = несколько жертв.",
        flavor: "Его болты говорят сами за себя. Очень громко."
      }
    },

    starBonuses: {
      2: { rangeAtk: +7, hp: +5 },
      3: { rangeAtk: +10, hp: +15 },
      4: { rangeAtk: +14, hp: +20 },
      5: { rangeAtk: +20, hp: +35 }
    },

    abilities: [
      {
        id: "heavy_bolt",
        name: "Тяжёлый болт",
        unlockedAt: 2,
        type: "active",
        cooldown: "каждые 4 хода",
        description: "+50% урона и пробивает 20% физической защиты цели.",
        tacticalNote: "Лучший выстрел в игре на одиночную цель. Берёт танков."
      },
      {
        id: "crushing_bolt",
        name: "Дробящий болт",
        unlockedAt: 3,
        type: "active",
        cooldown: "каждые 3 хода",
        description: "Цель получает −20% к физической защите на 3 хода (дебафф).",
        tacticalNote: "Открывает врага для копейщика или другого арбалетчика. Командная тактика."
      },
      {
        id: "sniper_scope",
        name: "Снайперский прицел",
        unlockedAt: 4,
        type: "passive",
        description: "Штрафы дальности снижены вдвое (колонка 2: −12.5%, колонка 3: −25%).",
        tacticalNote: "На 5★ вместе с улучшением даст полный урон везде."
      },
      {
        id: "explosive_bolt",
        name: "Разрывной болт",
        unlockedAt: 5,
        type: "active",
        cooldown: "каждые 6 ходов",
        description: "Удар по цели наносит 60% урона всем врагам рядом с ней (та же колонка).",
        tacticalNote: "АоЕ через одиночный выстрел. Уничтожает плотный строй врага."
      }
    ],

    specialization: {
      available: ["rangeAtk", "meleeDef", "hp"],
      bonusPerPoint: { rangeAtk: 4, meleeDef: 2, hp: 6 },
      maxPointsPerStat: 3,
      totalPoints: 5,
      note: "Стеклянная пушка. Качай атаку — или дай ему немного живучести если часто гибнет."
    }
  },

  // ══════════════════════════════
  // МАГИ (колонка 3)
  // ══════════════════════════════

  uchenik_ognya: {
    id: "uchenik_ognya",
    name: "Ученик огня",
    class: "mage_aoe",
    subclass: null,
    column: 3,
    color: "#7a1f0a",

    base: { hp: 35, meleeAtk: 4, meleeDef: 3, magic: 15, magicDef: 6, mana: 60, manaRegen: 20, initiative: 5 },

    lore: {
      1: {
        title: "Ученик огня",
        use: "АоЕ маг. Огненная вспышка бьёт ВСЕХ врагов. Хуже против боссов, лучше против стай.",
        flavor: "Поджёг три стола в академии пока учился. Отчислен. Нанят авантюристами."
      },
      2: {
        title: "Пиромант",
        use: "Огненный столп — элитное АоЕ по всей передней колонке. Уничтожает строй танков.",
        flavor: "Академия была не права. Огонь — это не опасность. Это инструмент."
      },
      3: {
        title: "Повелитель пламени",
        use: "Горящая земля — постоянный урон по зоне. Враги получают урон просто стоя.",
        flavor: "Теперь огонь слушается его. Иногда слишком охотно."
      },
      4: {
        title: "Архипиромант",
        use: "Метеоритный дождь — финальный АоЕ, бьёт все три колонки врагов.",
        flavor: "Небо слушается его. Хотя бы иногда."
      },
      5: {
        title: "Воплощение огня",
        use: "Феникс-форма даёт иммунитет к смерти один раз — воскресает с 50% HP и маны.",
        flavor: "Огонь нельзя убить. Он просто ждёт нового топлива."
      }
    },

    starBonuses: {
      2: { hp: +15, mana: +20, magic: +8 },
      3: { hp: +20, mana: +30, magic: +12 },
      4: { hp: +30, mana: +40, magic: +16 },
      5: { hp: +45, mana: +60, magic: +22 }
    },

    spells: [
      { id: "fire_flash", name: "Огненная вспышка", cost: 20, unlockAt: 1,
        damage: { min: 10, max: 15 }, target: "all_enemies",
        desc: "Магический урон всем врагам." },
      { id: "fireball", name: "Пламенный шар", cost: 40, unlockAt: 1,
        damage: { min: 25, max: 35 }, target: "single",
        desc: "Концентрированный урон одной цели." },
      { id: "fire_pillar", name: "Огненный столп", cost: 60, unlockAt: 2,
        damage: { min: 45, max: 60 }, target: "col1_enemies",
        desc: "Уничтожает всю переднюю линию врагов." },
      { id: "burning_ground", name: "Горящая земля", cost: 50, unlockAt: 3,
        damage: { min: 8, max: 12 }, target: "all_enemies", duration: 3,
        desc: "Враги получают урон каждый ход в течение 3 ходов." },
      { id: "meteor_rain", name: "Метеоритный дождь", cost: 80, unlockAt: 4,
        damage: { min: 20, max: 30 }, target: "all_enemies_all_cols",
        desc: "Удар по ВСЕМ врагам всех колонок." },
      { id: "phoenix_form", name: "Феникс-форма", cost: 0, unlockAt: 5,
        type: "passive", desc: "Один раз за бой воскресает с 50% HP и маны." }
    ],

    specialization: {
      available: ["magic", "mana", "magicDef"],
      bonusPerPoint: { magic: 3, mana: 10, magicDef: 2 },
      maxPointsPerStat: 3,
      totalPoints: 5,
      note: "Качай магию для урона или ману чтобы чаще кастовать АоЕ."
    }
  },

  // ──────────────────────────────
  elektrik: {
    id: "elektrik",
    name: "Электрик",
    class: "mage_single",
    subclass: null,
    column: 3,
    color: "#1a4a6b",

    base: { hp: 38, meleeAtk: 4, meleeDef: 3, magic: 18, magicDef: 7, mana: 70, manaRegen: 20, initiative: 6 },

    lore: {
      1: {
        title: "Электрик",
        use: "Точечный высокий урон. Разряд — самое дешёвое заклинание (15 маны), спам каждый ход.",
        flavor: "В детстве его ударила молния. Говорит — это было приятно."
      },
      2: {
        title: "Маг-ионизатор",
        use: "Паралич оглушает врага на ход. Единственный контроль в ранней игре.",
        flavor: "Научился направлять молнию туда куда надо. Почти всегда."
      },
      3: {
        title: "Грозовой маг",
        use: "Статический заряд накапливается — каждый следующий удар по цели сильнее.",
        flavor: "Воздух вокруг него всегда пахнет грозой."
      },
      4: {
        title: "Мастер молний",
        use: "Шаровая молния — снаряд который отскакивает между врагами (3-5 целей).",
        flavor: "Управляет молнией как пальцами. Немного страшно смотреть."
      },
      5: {
        title: "Повелитель шторма",
        use: "Буря — пассивная аура. Каждый враг получает урон при атаке союзника.",
        flavor: "Туча следует за ним. Буквально."
      }
    },

    starBonuses: {
      2: { hp: +12, mana: +20, magic: +7 },
      3: { hp: +18, mana: +30, magic: +11 },
      4: { hp: +28, mana: +40, magic: +15 },
      5: { hp: +42, mana: +55, magic: +20 }
    },

    spells: [
      { id: "discharge", name: "Разряд", cost: 15, unlockAt: 1,
        damage: { min: 18, max: 22 }, target: "single",
        desc: "Быстрый точечный удар. Дешёвый — можно спамить." },
      { id: "chain_lightning", name: "Цепная молния", cost: 35, unlockAt: 1,
        damage: { min: 12, max: 18 }, target: "random_3",
        desc: "Бьёт 3 случайных врага." },
      { id: "paralysis", name: "Паралич", cost: 40, unlockAt: 2,
        damage: { min: 10, max: 15 }, target: "single", effect: "stun_1_turn",
        desc: "Оглушение врага на 1 ход + небольшой урон." },
      { id: "static_charge", name: "Статический заряд", cost: 30, unlockAt: 3,
        target: "single", effect: "mark_amplify",
        desc: "Помечает врага: каждый следующий удар по нему сильнее на 10% (стакается до 50%)." },
      { id: "ball_lightning", name: "Шаровая молния", cost: 55, unlockAt: 4,
        damage: { min: 15, max: 22 }, target: "bounce_3_5",
        desc: "Отскакивает между 3-5 врагами нанося урон каждому." },
      { id: "storm_aura", name: "Буря", cost: 0, unlockAt: 5,
        type: "passive",
        desc: "Аура: каждый раз когда союзник атакует врага, тот получает 5 магического урона." }
    ],

    specialization: {
      available: ["magic", "initiative", "mana"],
      bonusPerPoint: { magic: 3, initiative: 0.4, mana: 12 },
      maxPointsPerStat: 3,
      totalPoints: 5,
      note: "Точечный убийца. Инициатива позволяет парализовать врага до его хода."
    }
  },

  // ──────────────────────────────
  poslushnik_sveta: {
    id: "poslushnik_sveta",
    name: "Послушник света",
    class: "mage_healer",
    subclass: null,
    column: 3,
    color: "#5a4a1e",

    base: { hp: 40, meleeAtk: 4, meleeDef: 4, magic: 12, magicDef: 8, mana: 80, manaRegen: 20, initiative: 4 },

    lore: {
      1: {
        title: "Послушник света",
        use: "Единственный хилер в игре. Малый лекарь всегда лечит союзника с наименьшим HP. Незаменим.",
        flavor: "Ещё учится. Его исцеления иногда пахнут лавандой. Непонятно почему."
      },
      2: {
        title: "Жрец",
        use: "Благословение — лечит ВСЕХ союзников. Используй после тяжёлого АоЕ от врага.",
        flavor: "Принял сан. Лавандовый запах усилился. Напарники не жалуются."
      },
      3: {
        title: "Святой целитель",
        use: "Священный щит — временный иммунитет к урону для одного союзника. Спасает жизни.",
        flavor: "Его прикосновение останавливает кровь. Буквально."
      },
      4: {
        title: "Архижрец",
        use: "Воскрешение — возвращает одного погибшего союзника. Один раз за бой.",
        flavor: "Смерть — это просто пауза. Он умеет нажать кнопку возобновления."
      },
      5: {
        title: "Аватар Света",
        use: "Аура исцеления — пассивное лечение всем союзникам каждый ход. Армия стала бессмертной.",
        flavor: "Свет внутри него виден снаружи. Буквально светится. Привыкли."
      }
    },

    starBonuses: {
      2: { hp: +15, mana: +20, magic: +6 },
      3: { hp: +22, mana: +30, magic: +9 },
      4: { hp: +35, mana: +40, magic: +12 },
      5: { hp: +55, mana: +60, magic: +16 }
    },

    spells: [
      { id: "light_arrow", name: "Светлая стрела", cost: 12, unlockAt: 1,
        damage: { min: 8, max: 12 }, target: "single_enemy",
        desc: "Атакующее заклинание. Хилер может и бить." },
      { id: "minor_heal", name: "Малый лекарь", cost: 25, unlockAt: 1,
        heal: { min: 20, max: 30 }, target: "lowest_hp_ally",
        desc: "Автоматически лечит союзника с наименьшим HP." },
      { id: "blessing", name: "Благословение", cost: 35, unlockAt: 2,
        heal: { min: 15, max: 20 }, target: "all_allies",
        desc: "Лечит ВСЕХ союзников." },
      { id: "holy_shield", name: "Священный щит", cost: 40, unlockAt: 3,
        target: "single_ally", effect: "damage_immunity_1_turn",
        desc: "Выбранный союзник неуязвим к урону 1 ход." },
      { id: "resurrection", name: "Воскрешение", cost: 60, unlockAt: 4,
        target: "dead_ally", heal: "30%_max_hp",
        cooldown: "1 раз за бой",
        desc: "Возвращает одного погибшего союзника с 30% HP." },
      { id: "healing_aura", name: "Аура исцеления", cost: 0, unlockAt: 5,
        type: "passive",
        desc: "Каждый ход все союзники восстанавливают 3% от максимального HP." }
    ],

    specialization: {
      available: ["magic", "mana", "magicDef"],
      bonusPerPoint: { magic: 2, mana: 15, magicDef: 2 },
      maxPointsPerStat: 3,
      totalPoints: 5,
      note: "Хилер качает ману чтобы чаще лечить. Магия усиливает силу лечения и урон Светлой стрелы."
    }
  }

}; // конец ALLIES


// ─────────────────────────────────────────
// ВРАГИ ПО ЛОКАЦИЯМ
// ─────────────────────────────────────────

const ENEMIES = {

  // ══════════════════════════════
  // ЗОНА 1: Звери (локации 1-3)
  // ══════════════════════════════

  rat: {
    id: "rat", name: "Крыса", zone: 1, type: "beast",
    base: { hp: 25, meleeAtk: 8, meleeDef: 3, rangeDef: 2, magicDef: 1, initiative: 6 },
    ai: "attack_lowest_hp",
    lore: "Обычная крыса. Кусает больно. Умирает быстро.",
    abilities: [],
    locations: [1]
  },

  large_rat: {
    id: "large_rat", name: "Огромная крыса", zone: 1, type: "beast",
    base: { hp: 40, meleeAtk: 11, meleeDef: 5, rangeDef: 3, magicDef: 2, initiative: 5 },
    ai: "attack_front_first",
    lore: "Размером с кошку. Злая как собака.",
    abilities: [
      { id: "gnaw", name: "Грызня", type: "on_hit",
        desc: "10% шанс снизить защиту цели на 2 на 2 хода." }
    ],
    locations: [1, 2]
  },

  spider: {
    id: "spider", name: "Паук", zone: 1, type: "beast",
    base: { hp: 30, meleeAtk: 7, meleeDef: 4, rangeDef: 3, magicDef: 2, initiative: 5 },
    ai: "attack_lowest_hp",
    lore: "Тихий убийца. Яд его страшнее укуса.",
    abilities: [
      { id: "poison_bite", name: "Ядовитый укус", type: "on_hit",
        desc: "20% шанс отравить на 3 хода (3 урона/ход)." }
    ],
    locations: [2]
  },

  giant_spider: {
    id: "giant_spider", name: "Гигантский паук", zone: 1, type: "beast",
    base: { hp: 55, meleeAtk: 10, meleeDef: 6, rangeDef: 4, magicDef: 3, initiative: 4 },
    ai: "attack_lowest_hp",
    lore: "Паутина его удерживает добычу. Яд — заканчивает дело.",
    abilities: [
      { id: "poison_bite", name: "Ядовитый укус", type: "on_hit",
        desc: "30% шанс отравить на 3 хода (5 урона/ход)." },
      { id: "web", name: "Паутина", type: "active", cooldown: 3,
        desc: "Обездвиживает одного врага на 1 ход (пропускает следующий ход)." }
    ],
    locations: [2, 3]
  },

  snake: {
    id: "snake", name: "Змея", zone: 1, type: "beast",
    base: { hp: 28, meleeAtk: 9, meleeDef: 2, rangeDef: 2, magicDef: 1, initiative: 7 },
    ai: "attack_front_first",
    lore: "Быстрая. Опасная. Не терпит промахов.",
    abilities: [
      { id: "dodge", name: "Уклонение", type: "passive",
        desc: "15% шанс полностью избежать атаки." }
    ],
    locations: [3]
  },

  viper: {
    id: "viper", name: "Гадюка", zone: 1, type: "beast",
    base: { hp: 35, meleeAtk: 12, meleeDef: 3, rangeDef: 3, magicDef: 2, initiative: 8 },
    ai: "attack_front_first",
    lore: "Молниеносная атака. Яд сильнейший в роще.",
    abilities: [
      { id: "dodge", name: "Уклонение", type: "passive",
        desc: "20% шанс избежать атаки." },
      { id: "deadly_venom", name: "Смертельный яд", type: "on_hit",
        desc: "25% шанс сильного яда: 8 урона/ход на 3 хода." }
    ],
    locations: [3, 4]
  },

  // ══════════════════════════════
  // БОССЫ ЗОНЫ 1
  // ══════════════════════════════

  rat_king: {
    id: "rat_king", name: "Крысиный Король", zone: 1, type: "beast_boss",
    isBoss: true,
    base: { hp: 200, meleeAtk: 18, meleeDef: 8, rangeDef: 6, magicDef: 4, initiative: 5 },
    ai: "boss_aggressive",
    lore: "Огромная крыса в короне из костей. Управляет стаей.",
    abilities: [
      { id: "summon_rats", name: "Призыв стаи", type: "active", cooldown: 3,
        desc: "Призывает 2 обычных крысы на поле боя." },
      { id: "frenzy", name: "Ярость", type: "passive",
        desc: "При HP < 50% получает +30% к атаке." }
    ],
    artifact: "rat_crown",
    artifactName: "Корона Крысиного Короля",
    artifactBonus: "+8% к инициативе всех союзников",
    locations: ["boss_zone1"]
  },

  // ══════════════════════════════
  // ЗОНА 2: Разбойники (локации 4-6)
  // ══════════════════════════════

  bandit_club: {
    id: "bandit_club", name: "Разбойник с дубиной", zone: 2, type: "humanoid",
    base: { hp: 45, meleeAtk: 10, meleeDef: 5, rangeDef: 3, magicDef: 2, initiative: 5 },
    ai: "attack_front_first",
    lore: "Бывший работяга. Выбрал лёгкий путь. Пожалеет.",
    abilities: [],
    locations: [4, 5]
  },

  bandit_bow: {
    id: "bandit_bow", name: "Разбойник с луком", zone: 2, type: "humanoid",
    base: { hp: 35, meleeAtk: 4, meleeDef: 3, rangeAtk: 12, rangeDef: 2, magicDef: 2, initiative: 6 },
    ai: "attack_lowest_hp",
    column: 2,
    attackMode: { shots: 2 },
    rangeModifiers: { col1: 1.0, col2: 0.75, col3: null },
    lore: "Стреляет хорошо. Бегает ещё лучше.",
    abilities: [],
    locations: [4, 5, 6]
  },

  hypnotist: {
    id: "hypnotist", name: "Гипнотизёр", zone: 2, type: "humanoid",
    base: { hp: 30, meleeAtk: 3, meleeDef: 2, magic: 8, magicDef: 3, mana: 40, manaRegen: 25, initiative: 4 },
    ai: "support_enemy",
    column: 3,
    lore: "Говорит тихо. Слушаются все.",
    abilities: [
      { id: "sleep", name: "Усыпление", type: "active", cost: 20, cooldown: 3,
        desc: "Оглушает одного союзника на 1 ход." },
      { id: "confusion", name: "Замешательство", type: "active", cost: 35, cooldown: 5,
        desc: "Союзник атакует случайного союзника вместо врага." }
    ],
    locations: [5, 6]
  },

  bandit_captain: {
    id: "bandit_captain", name: "Капитан разбойников", zone: 2, type: "humanoid",
    base: { hp: 75, meleeAtk: 15, meleeDef: 10, rangeDef: 6, magicDef: 4, initiative: 5 },
    ai: "attack_front_first",
    lore: "Умный. Опытный. Даст приказ бежать если надо.",
    abilities: [
      { id: "battle_cry", name: "Боевой клич", type: "active", cooldown: 4,
        desc: "Все враги получают +20% к атаке на 2 хода." },
      { id: "parry", name: "Парирование", type: "passive",
        desc: "25% шанс блокировать ближний удар (0 урона)." }
    ],
    locations: [6]
  },

  // ══════════════════════════════
  // БОССЫ ЗОНЫ 2
  // ══════════════════════════════

  bandit_warlord: {
    id: "bandit_warlord", name: "Атаман Кровавый Кулак", zone: 2, type: "humanoid_boss",
    isBoss: true,
    base: { hp: 350, meleeAtk: 25, meleeDef: 15, rangeDef: 10, magicDef: 8, initiative: 6 },
    ai: "boss_tactical",
    lore: "Контролирует всё разбойничьё логово. Безжалостен и умён.",
    abilities: [
      { id: "reinforce", name: "Подкрепление", type: "active", cooldown: 4,
        desc: "Призывает 1 капитана разбойников." },
      { id: "battle_fury", name: "Боевая ярость", type: "passive",
        desc: "При HP < 40% атакует дважды за ход." },
      { id: "intimidate", name: "Устрашение", type: "active", cooldown: 5,
        desc: "Все союзники пропускают следующий ход (ужас)." }
    ],
    artifact: "warlord_pauldron",
    artifactName: "Наплечник Атамана",
    artifactBonus: "+6% к ближней атаке и +4% к HP всех воинов",
    locations: ["boss_zone2"]
  },

  // ══════════════════════════════
  // ЗОНА 3: Нежить / Тёмная магия (локации 7-9)
  // ══════════════════════════════

  skeleton: {
    id: "skeleton", name: "Скелет", zone: 3, type: "undead",
    base: { hp: 50, meleeAtk: 12, meleeDef: 8, rangeDef: 4, magicDef: 2, initiative: 4 },
    ai: "attack_front_first",
    lore: "Кости держатся вместе тёмной магией. Бить можно. Умрёт — соберётся снова.",
    abilities: [
      { id: "bone_armor", name: "Костяная броня", type: "passive",
        desc: "Иммунитет к яду и кровотечению." }
    ],
    locations: [7]
  },

  skeleton_archer: {
    id: "skeleton_archer", name: "Скелет-лучник", zone: 3, type: "undead",
    base: { hp: 38, meleeAtk: 4, meleeDef: 3, rangeAtk: 14, rangeDef: 2, magicDef: 2, initiative: 6 },
    ai: "attack_lowest_hp",
    column: 2,
    attackMode: { shots: 2 },
    rangeModifiers: { col1: 1.0, col2: 0.75, col3: null },
    lore: "Кости не устают. Стрелы не заканчиваются. Пальцев нет — но это не мешает.",
    abilities: [
      { id: "bone_arrow", name: "Костяная стрела", type: "on_hit",
        desc: "15% шанс снизить инициативу цели на 2." }
    ],
    locations: [7, 8]
  },

  ghost: {
    id: "ghost", name: "Призрак", zone: 3, type: "undead",
    base: { hp: 45, meleeAtk: 0, meleeDef: 2, magic: 14, magicDef: 10, mana: 60, manaRegen: 30, initiative: 7 },
    ai: "attack_lowest_hp",
    column: 3,
    lore: "Не живой. Не мёртвый. Просто злой.",
    abilities: [
      { id: "ethereal", name: "Эфирная форма", type: "passive",
        desc: "Получает только 50% от физического урона (ближнего и дальнего)." },
      { id: "drain_life", name: "Поглощение жизни", type: "spell", cost: 25,
        desc: "Наносит 12-18 магического урона и исцеляет себя на 50% нанесённого." }
    ],
    locations: [7, 8]
  },

  dark_mage: {
    id: "dark_mage", name: "Тёмный маг", zone: 3, type: "humanoid",
    base: { hp: 42, meleeAtk: 4, meleeDef: 3, magic: 20, magicDef: 9, mana: 80, manaRegen: 25, initiative: 5 },
    ai: "attack_lowest_hp",
    column: 3,
    lore: "Продал душу за силу. Торг оказался невыгодным — но назад дороги нет.",
    abilities: [
      { id: "curse", name: "Проклятие", type: "spell", cost: 25,
        desc: "Цель получает −20% к атаке и защите на 3 хода." },
      { id: "shadow_bolt", name: "Теневой снаряд", cost: 20,
        damage: { min: 15, max: 22 }, target: "single",
        desc: "Тёмный урон. Пробивает 10% магической защиты." },
      { id: "death_mark", name: "Метка смерти", cost: 45, cooldown: 5,
        desc: "Помечает цель — при HP < 20% умирает мгновенно." }
    ],
    locations: [8, 9]
  },

  // ══════════════════════════════
  // БОССЫ ЗОНЫ 3
  // ══════════════════════════════

  temple_guardian: {
    id: "temple_guardian", name: "Страж Храма", zone: 3, type: "undead_boss",
    isBoss: true,
    base: { hp: 500, meleeAtk: 30, meleeDef: 20, rangeDef: 15, magicDef: 12, initiative: 3 },
    ai: "boss_defensive",
    lore: "Тысячу лет охраняет Заброшенный Храм. Тысячу лет никто не уходил живым.",
    abilities: [
      { id: "stone_skin", name: "Каменная кожа", type: "passive",
        desc: "Получает не более 20 урона за один удар." },
      { id: "ground_slam", name: "Удар о землю", type: "active", cooldown: 3,
        desc: "АоЕ: все союзники в колонке 1 получают 25-35 урона и оглушение на 1 ход." },
      { id: "ancient_curse", name: "Древнее проклятие", type: "active", cooldown: 6,
        desc: "Случайный союзник получает −50% к атаке на 3 хода." }
    ],
    artifact: "temple_rune",
    artifactName: "Руна Храма",
    artifactBonus: "+10% к магической защите всего отряда",
    locations: ["boss_zone3"]
  },

  // ══════════════════════════════
  // ЗОНА 4: Горы / Тролли (локации 9-10)
  // ══════════════════════════════

  troll: {
    id: "troll", name: "Тролль", zone: 4, type: "giant",
    base: { hp: 120, meleeAtk: 22, meleeDef: 12, rangeDef: 8, magicDef: 5, initiative: 3 },
    ai: "attack_front_first",
    lore: "Медленный. Тупой. Бьёт как камнепад. Один удар может убить воина.",
    abilities: [
      { id: "regeneration", name: "Регенерация", type: "passive",
        desc: "Восстанавливает 5 HP в начале каждого хода." },
      { id: "crushing_blow", name: "Сокрушительный удар", type: "active", cooldown: 3,
        desc: "Удар с шансом 40% оглушить цель на 1 ход." }
    ],
    locations: [9]
  },

  mountain_bandit: {
    id: "mountain_bandit", name: "Горный бандит", zone: 4, type: "humanoid",
    base: { hp: 85, meleeAtk: 18, meleeDef: 12, rangeDef: 7, magicDef: 5, initiative: 5 },
    ai: "attack_front_first",
    lore: "Опытный боец. Горы сделали его выносливым.",
    abilities: [
      { id: "ambush", name: "Засада", type: "passive",
        desc: "В первый ход боя получает +30% к инициативе и атаке." }
    ],
    locations: [9, 10]
  },

  stone_golem: {
    id: "stone_golem", name: "Каменный голем", zone: 4, type: "construct",
    base: { hp: 180, meleeAtk: 28, meleeDef: 25, rangeDef: 20, magicDef: 8, initiative: 2 },
    ai: "attack_front_first",
    lore: "Создан некромантом. Не чувствует боли. Не устаёт. Не останавливается.",
    abilities: [
      { id: "stone_body", name: "Каменное тело", type: "passive",
        desc: "Иммунитет к яду, параличу и замедлению." },
      { id: "seismic_stomp", name: "Сейсмический топот", type: "active", cooldown: 4,
        desc: "Все юниты в колонке 1 союзников получают 30-40 урона." }
    ],
    locations: [10]
  },

  // ══════════════════════════════
  // БОССЫ ЗОНЫ 4
  // ══════════════════════════════

  bandit_fortress_lord: {
    id: "bandit_fortress_lord", name: "Владелец крепости", zone: 4, type: "humanoid_boss",
    isBoss: true,
    base: { hp: 700, meleeAtk: 35, meleeDef: 22, rangeDef: 16, magicDef: 12, initiative: 5 },
    ai: "boss_tactical",
    lore: "Построил свою маленькую империю из страха и золота. Защищает её зубами.",
    abilities: [
      { id: "fortress_guard", name: "Гвардия крепости", type: "active", cooldown: 4,
        desc: "Призывает 2 горных бандитов." },
      { id: "iron_will", name: "Железная воля", type: "passive",
        desc: "При HP < 30% — иммунитет к оглушению и замедлению." },
      { id: "siege_catapult", name: "Осадная катапульта", type: "active", cooldown: 6,
        damage: { min: 40, max: 60 },
        desc: "АоЕ удар по случайной линии союзников." }
    ],
    artifact: "fortress_banner",
    artifactName: "Знамя Крепости",
    artifactBonus: "+8% к атаке всего отряда и +5% к дальней защите",
    locations: ["boss_zone4"]
  },

  // ══════════════════════════════
  // ЗОНА 5: Замок некроманта (локации 11-12)
  // ══════════════════════════════

  death_knight: {
    id: "death_knight", name: "Рыцарь смерти", zone: 5, type: "undead",
    base: { hp: 160, meleeAtk: 32, meleeDef: 20, rangeDef: 12, magicDef: 10, initiative: 5 },
    ai: "attack_front_first",
    lore: "Когда-то был героем. Некромант предложил второй шанс. Герой согласился.",
    abilities: [
      { id: "death_aura", name: "Аура смерти", type: "passive",
        desc: "Союзники рядом с ним получают −10% к атаке (ужас)." },
      { id: "soul_drain", name: "Похищение души", type: "active", cooldown: 3,
        desc: "Наносит 20-30 урона и восстанавливает себе столько же HP." }
    ],
    locations: [11]
  },

  lich: {
    id: "lich", name: "Лич", zone: 5, type: "undead",
    base: { hp: 90, meleeAtk: 5, meleeDef: 5, magic: 35, magicDef: 18, mana: 120, manaRegen: 30, initiative: 7 },
    ai: "attack_lowest_hp",
    column: 3,
    lore: "Архимаг который отказался умирать. Стал чем-то хуже живого.",
    abilities: [
      { id: "bone_shield", name: "Костяной щит", type: "active", cooldown: 5,
        desc: "На 2 хода получает иммунитет к физическому урону." },
      { id: "mass_curse", name: "Массовое проклятие", type: "spell", cost: 60,
        desc: "Все союзники получают −25% к атаке на 2 хода." },
      { id: "death_ray", name: "Луч смерти", type: "spell", cost: 45,
        damage: { min: 40, max: 55 }, target: "single",
        desc: "Мощнейший одиночный магический удар." }
    ],
    locations: [11, 12]
  },

  // ══════════════════════════════
  // ФИНАЛЬНЫЙ БОСС
  // ══════════════════════════════

  necromancer: {
    id: "necromancer", name: "Некромант Мор'Залан", zone: 5, type: "final_boss",
    isBoss: true,
    isFinalBoss: true,
    base: { hp: 1200, meleeAtk: 20, meleeDef: 15, magic: 50, magicDef: 25, mana: 200, manaRegen: 40, initiative: 6 },
    ai: "boss_necromancer",
    lore: "Тысячу лет собирал армию мёртвых. Ждал достойного противника. Дождался.",
    phases: [
      {
        phase: 1, hpThreshold: 100,
        desc: "Обычный режим. Вызывает лича и рыцарей смерти.",
        abilities: ["raise_dead", "shadow_storm"]
      },
      {
        phase: 2, hpThreshold: 50,
        desc: "Вторая фаза при HP < 50%. Получает +50% к магии.",
        abilities: ["raise_dead", "shadow_storm", "death_coil", "corpse_explosion"]
      },
      {
        phase: 3, hpThreshold: 20,
        desc: "Финальная фаза при HP < 20%. Вызывает Рыцаря смерти-элиту.",
        abilities: ["raise_dead", "shadow_storm", "death_coil", "corpse_explosion", "lichform"]
      }
    ],
    abilities: [
      { id: "raise_dead", name: "Поднять мёртвых", type: "active", cooldown: 3,
        desc: "Возрождает одного погибшего врага с 50% HP." },
      { id: "shadow_storm", name: "Теневой шторм", type: "active", cooldown: 4,
        desc: "АоЕ: все союзники получают 25-40 тёмного урона." },
      { id: "death_coil", name: "Змей смерти", type: "active", cooldown: 3,
        desc: "Прыгает между союзниками 3 раза (30-40 урона каждый)." },
      { id: "corpse_explosion", name: "Взрыв трупа", type: "active", cooldown: 5,
        desc: "Взрывает погибшего союзника — АоЕ 50-70 урона." },
      { id: "lichform", name: "Личформа", type: "active", cooldown: "once",
        desc: "Одноразово: становится неуязвимым на 2 хода, восстанавливает 200 HP." }
    ],
    artifact: "necromancer_staff",
    artifactName: "Посох Мор'Залана",
    artifactBonus: "+15% к силе магии и +10% к регенерации маны всех магов отряда",
    locations: ["final_boss"]
  }

}; // конец ENEMIES


// ─────────────────────────────────────────
// ТАБЛИЦА АРТЕФАКТОВ ХРАМА
// ─────────────────────────────────────────

const ARTIFACTS = {
  rat_crown:         { name: "Корона Крысиного Короля", bonus: "+8% инициативы всему отряду", from: "rat_king" },
  warlord_pauldron:  { name: "Наплечник Атамана",       bonus: "+6% атаки воинам, +4% HP всем", from: "bandit_warlord" },
  temple_rune:       { name: "Руна Храма",              bonus: "+10% магической защиты всем",   from: "temple_guardian" },
  fortress_banner:   { name: "Знамя Крепости",          bonus: "+8% атаки всем, +5% дальней защиты", from: "bandit_fortress_lord" },
  necromancer_staff: { name: "Посох Мор'Залана",        bonus: "+15% силы магии магам, +10% реген маны", from: "necromancer" },
  // Дополнительные артефакты из случайных боссов (будущий контент)
  spider_fang:       { name: "Клык паука-матки",        bonus: "+10% урона по отравленным врагам", from: "special_boss" },
  troll_heart:       { name: "Сердце тролля",           bonus: "+5 HP регенерация/ход всем танкам", from: "troll_boss" },
  ghost_crystal:     { name: "Кристалл призрака",       bonus: "+12% магической атаки магам",       from: "ghost_boss" }
};


// ─────────────────────────────────────────
// ЭКСПОРТ
// ─────────────────────────────────────────

if (typeof module !== "undefined") {
  module.exports = { ALLIES, ENEMIES, ARTIFACTS, calcStat, calcInitiative };
}
