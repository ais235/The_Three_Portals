// ================================================================
// ENEMY TEMPLATES — Противники для локаций карты мира
// ================================================================
// Все шаблоны врагов, доступных в LOCATIONS.
// Используют calcStat / calcInitiative из cards_and_weapons.js

const ENEMY_TEMPLATES = {

  // ── Зона 1: Лесные твари ─────────────────────────────────────

  rat: {
    id: 'rat', name: 'Крыса', icon: '🐀',
    class: 'beast', race: 'beast',
    base: { hp:22, meleeAtk:7, meleeDef:2, rangeDef:1, magicDef:1, initiative:7 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_lowest_hp',
    role: 'swarm', aiPattern: 'aggressive',
    abilities: [],
  },

  large_rat: {
    id: 'large_rat', name: 'Огромная крыса', icon: '🐀',
    class: 'beast', race: 'beast',
    base: { hp:38, meleeAtk:10, meleeDef:4, rangeDef:2, magicDef:2, initiative:5 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'bruiser', aiPattern: 'front_pressure',
    abilities: [
      { id:'gnaw', name:'Грызня', type:'on_hit', chance:0.15,
        desc:'15% шанс нанести доп. 3 урона.' },
    ],
  },

  spider: {
    id: 'spider', name: 'Паук', icon: '🕷️',
    class: 'beast', race: 'beast',
    base: { hp:28, meleeAtk:7, meleeDef:3, rangeDef:2, magicDef:2, initiative:6 },
    attackColumns: [2, 3], attackType: 'melee', ai: 'attack_lowest_hp',
    role: 'assassin', aiPattern: 'focus_backline',
    abilities: [
      { id:'poison_bite', name:'Ядовитый укус', type:'on_hit',
        chance:0.20, poisonDmg:3, poisonDuration:3,
        desc:'20% шанс яда: 3 урона/ход × 3 хода.' },
    ],
  },

  snake: {
    id: 'snake', name: 'Змея', icon: '🐍',
    class: 'beast', race: 'beast',
    base: { hp:26, meleeAtk:8, meleeDef:2, rangeDef:2, magicDef:1, initiative:8 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'swarm', aiPattern: 'front_pressure',
    abilities: [
      { id:'dodge', name:'Уклонение', type:'passive', dodgeChance:0.15,
        desc:'15% шанс избежать атаки.' },
    ],
  },

  viper: {
    id: 'viper', name: 'Гадюка', icon: '🐍',
    class: 'beast', race: 'beast',
    base: { hp:32, meleeAtk:10, meleeDef:3, rangeDef:3, magicDef:2, initiative:7 },
    attackColumns: [2, 3], attackType: 'melee', ai: 'attack_lowest_hp',
    role: 'assassin', aiPattern: 'aggressive',
    abilities: [
      { id:'venom', name:'Яд', type:'on_hit', chance:0.30,
        poisonDmg:4, poisonDuration:3,
        desc:'30% шанс сильного яда: 4 урона/ход × 3 хода.' },
    ],
  },

  // ── Зона 1: Бандиты ──────────────────────────────────────────

  bandit_club: {
    id: 'bandit_club', name: 'Бандит с дубиной', icon: '🪓',
    class: 'damage', race: 'human',
    base: { hp:50, meleeAtk:13, meleeDef:6, rangeDef:4, magicDef:3, initiative:5 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'bruiser', aiPattern: 'front_pressure',
    abilities: [],
  },

  bandit_bow: {
    id: 'bandit_bow', name: 'Бандит-лучник', icon: '🏹',
    class: 'archer', race: 'human',
    base: { hp:38, meleeAtk:6, meleeDef:4, rangeAtk:11, rangeDef:4, magicDef:3, initiative:6 },
    attackColumns: [1,2], attackType: 'ranged', ai: 'attack_lowest_hp',
    role: 'archer', aiPattern: 'sniper',
    rangeModifiers: { 1:1.0, 2:0.75, 3:0.5 },
    abilities: [],
  },

  hypnotist: {
    id: 'hypnotist', name: 'Гипнотизёр', icon: '👁️',
    class: 'mage_debuff', race: 'human',
    base: { hp:35, meleeAtk:4, meleeDef:3, magic:13, magicDef:8,
            mana:60, manaRegen:20, initiative:5 },
    attackColumns: [1,2,3], attackType: 'magic', ai: 'attack_lowest_hp',
    role: 'control', aiPattern: 'disable_priority',
    abilities: [],
    spells: [
      { id:'stun_bolt', name:'Оцепенение', cost:20, target:'single_enemy',
        damage:{min:5, max:8}, desc:'Оглушает цель на 1 ход.' },
    ],
  },

  bandit_captain: {
    id: 'bandit_captain', name: 'Капитан бандитов', icon: '⚔️',
    class: 'damage', race: 'human',
    base: { hp:70, meleeAtk:17, meleeDef:10, rangeDef:7, magicDef:5, initiative:5 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'bruiser', aiPattern: 'front_pressure',
    abilities: [
      { id:'battle_cry', name:'Боевой клич', type:'passive',
        desc:'Атака усилена на 20%.' },
    ],
  },

  bandit_warlord: {
    id: 'bandit_warlord', name: 'Атаман Кровавый Кулак', icon: '👊',
    class: 'damage', race: 'human',
    isBossUnit: true,
    base: { hp:140, meleeAtk:20, meleeDef:16, rangeDef:10, magicDef:8, initiative:4 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'boss', aiPattern: 'front_pressure',
    abilities: [
      { id:'crushing_blow', name:'Сокрушительный удар', type:'passive',
        desc:'Пробивает 30% защиты.' },
      { id:'rage', name:'Ярость', type:'passive',
        desc:'При HP < 50%: +30% урона.' },
    ],
  },

  // ── Зона 2: Руины ────────────────────────────────────────────

  troll: {
    id: 'troll', name: 'Тролль', icon: '👹',
    class: 'tank', race: 'beast',
    base: { hp:90, meleeAtk:16, meleeDef:12, rangeDef:8, magicDef:4, initiative:3 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'tank', aiPattern: 'front_pressure',
    abilities: [
      { id:'regen', name:'Регенерация', type:'passive',
        desc:'Восстанавливает 5 HP в начале каждого хода.' },
    ],
  },

  mountain_bandit: {
    id: 'mountain_bandit', name: 'Горный бандит', icon: '🗡️',
    class: 'damage', race: 'human',
    base: { hp:65, meleeAtk:19, meleeDef:9, rangeDef:6, magicDef:5, initiative:5 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_lowest_hp',
    role: 'bruiser', aiPattern: 'aggressive',
    abilities: [],
  },

  skeleton: {
    id: 'skeleton', name: 'Скелет', icon: '💀',
    class: 'damage', race: 'undead',
    base: { hp:42, meleeAtk:12, meleeDef:8, rangeDef:5, magicDef:2, initiative:4 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'swarm', aiPattern: 'front_pressure',
    abilities: [
      { id:'undead_resist', name:'Стойкость нежити', type:'passive',
        desc:'−50% урон от яда, горения.' },
    ],
  },

  skeleton_archer: {
    id: 'skeleton_archer', name: 'Скелет-лучник', icon: '🏹',
    class: 'archer', race: 'undead',
    base: { hp:32, meleeAtk:5, meleeDef:4, rangeAtk:14, rangeDef:4, magicDef:2, initiative:6 },
    attackColumns: [1,2], attackType: 'ranged', ai: 'attack_lowest_hp',
    role: 'archer', aiPattern: 'sniper',
    rangeModifiers: { 1:1.0, 2:0.75, 3:0.5 },
    abilities: [],
  },

  ghost: {
    id: 'ghost', name: 'Призрак', icon: '👻',
    class: 'mage_single', race: 'undead',
    base: { hp:38, meleeAtk:4, meleeDef:2, magic:16, magicDef:12,
            mana:50, manaRegen:25, initiative:7 },
    attackColumns: [1,2,3], attackType: 'magic', ai: 'attack_lowest_hp',
    role: 'control', aiPattern: 'disable_priority',
    abilities: [
      { id:'phase_shift', name:'Фазовый сдвиг', type:'passive',
        desc:'30% шанс полностью избежать атаки.' },
    ],
    spells: [
      { id:'soul_drain', name:'Поглощение души', cost:20, target:'single_enemy',
        damage:{min:12, max:18}, desc:'Магический урон.' },
    ],
  },

  dark_mage: {
    id: 'dark_mage', name: 'Тёмный маг', icon: '🧙',
    class: 'mage_aoe', race: 'human',
    base: { hp:45, meleeAtk:4, meleeDef:3, magic:18, magicDef:10,
            mana:80, manaRegen:22, initiative:5 },
    attackColumns: [1,2,3], attackType: 'magic', ai: 'attack_lowest_hp',
    role: 'control', aiPattern: 'disable_priority',
    abilities: [],
    spells: [
      { id:'dark_bolt', name:'Тёмный заряд', cost:18, target:'single_enemy',
        damage:{min:10, max:16}, desc:'Магический одиночный урон.' },
      { id:'curse', name:'Проклятье', cost:30, target:'single_enemy',
        damage:{min:6, max:10}, desc:'Накладывает слабость.' },
    ],
  },

  temple_guardian: {
    id: 'temple_guardian', name: 'Страж Храма', icon: '🗿',
    class: 'tank', race: 'construct',
    isBossUnit: true,
    base: { hp:200, meleeAtk:20, meleeDef:22, rangeDef:15, magicDef:12, initiative:3 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'boss', aiPattern: 'front_pressure',
    abilities: [
      { id:'stone_skin', name:'Каменная шкура', type:'passive',
        desc:'Принимает на 25% меньше физического урона.' },
      { id:'earthquake', name:'Землетрясение', type:'passive',
        desc:'Каждые 3 хода — оглушает всех врагов в кол.1.' },
    ],
  },

  // ── Зона 3: Тёмное подземелье ────────────────────────────────

  orc: {
    id: 'orc', name: 'Орк', icon: '👺',
    class: 'damage', race: 'orc',
    base: { hp:72, meleeAtk:21, meleeDef:11, rangeDef:7, magicDef:4, initiative:4 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'bruiser', aiPattern: 'front_pressure',
    abilities: [],
  },

  orc_shaman: {
    id: 'orc_shaman', name: 'Шаман орков', icon: '🔮',
    class: 'mage_buffer', race: 'orc',
    base: { hp:48, meleeAtk:6, meleeDef:5, magic:17, magicDef:9,
            mana:70, manaRegen:20, initiative:5 },
    attackColumns: [1,2,3], attackType: 'magic', ai: 'attack_lowest_hp',
    role: 'control', aiPattern: 'disable_priority',
    abilities: [],
    spells: [
      { id:'war_curse', name:'Проклятье воинов', cost:25, target:'single_enemy',
        damage:{min:8, max:14}, desc:'Снижает защиту цели.' },
    ],
  },

  dark_knight: {
    id: 'dark_knight', name: 'Тёмный рыцарь', icon: '🖤',
    class: 'tank', race: 'undead',
    base: { hp:95, meleeAtk:22, meleeDef:18, rangeDef:12, magicDef:8, initiative:4 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'tank', aiPattern: 'front_pressure',
    abilities: [
      { id:'dark_aura', name:'Тёмная аура', type:'passive',
        desc:'Враги в кол.1 получают −2 атаки.' },
    ],
  },

  stone_golem: {
    id: 'stone_golem', name: 'Каменный голем', icon: '🪨',
    class: 'tank', race: 'construct',
    base: { hp:110, meleeAtk:18, meleeDef:20, rangeDef:14, magicDef:6, initiative:2 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'tank', aiPattern: 'front_pressure',
    abilities: [
      { id:'immovable', name:'Неподвижность', type:'passive',
        desc:'Не может быть оглушён или сдвинут.' },
    ],
  },

  troll_chief: {
    id: 'troll_chief', name: 'Вождь троллей', icon: '👹',
    class: 'damage', race: 'beast',
    base: { hp:85, meleeAtk:25, meleeDef:13, rangeDef:9, magicDef:5, initiative:4 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'bruiser', aiPattern: 'front_pressure',
    abilities: [
      { id:'regen', name:'Регенерация', type:'passive',
        desc:'Восстанавливает 8 HP в начале каждого хода.' },
    ],
  },

  fortress_commander: {
    id: 'fortress_commander', name: 'Командир крепости', icon: '🎖️',
    class: 'damage', race: 'human',
    isBossUnit: true,
    base: { hp:180, meleeAtk:28, meleeDef:20, rangeDef:14, magicDef:10, initiative:5 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'boss', aiPattern: 'front_pressure',
    abilities: [
      { id:'rallying_cry', name:'Боевой клич', type:'passive',
        desc:'При HP < 60% — переходит в режим ярости.' },
      { id:'tactical_strike', name:'Тактический удар', type:'passive',
        desc:'Пробивает 40% защиты.' },
    ],
  },

  // ── Зона 4: Тёмный мир ───────────────────────────────────────

  death_knight: {
    id: 'death_knight', name: 'Рыцарь смерти', icon: '💀',
    class: 'tank', race: 'undead',
    base: { hp:115, meleeAtk:26, meleeDef:20, rangeDef:14, magicDef:10, initiative:5 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_front_first',
    role: 'tank', aiPattern: 'front_pressure',
    abilities: [
      { id:'death_aura', name:'Аура смерти', type:'on_hit', chance:0.20,
        poisonDmg:5, poisonDuration:2,
        desc:'20% шанс наложить яд на 2 хода.' },
    ],
  },

  vampire: {
    id: 'vampire', name: 'Вампир', icon: '🧛',
    class: 'damage', race: 'undead',
    base: { hp:80, meleeAtk:28, meleeDef:12, rangeDef:9, magicDef:10, initiative:7 },
    attackColumns: [1], attackType: 'melee', ai: 'attack_lowest_hp',
    role: 'assassin', aiPattern: 'aggressive',
    abilities: [
      { id:'life_drain', name:'Кражa жизни', type:'on_hit', chance:1.0,
        desc:'Восстанавливает 30% нанесённого урона.' },
    ],
  },

  lich: {
    id: 'lich', name: 'Лич', icon: '💀',
    class: 'mage_aoe', race: 'undead',
    base: { hp:70, meleeAtk:5, meleeDef:4, magic:30, magicDef:18,
            mana:100, manaRegen:30, initiative:6 },
    attackColumns: [1,2,3], attackType: 'magic', ai: 'attack_lowest_hp',
    role: 'control', aiPattern: 'disable_priority',
    abilities: [
      { id:'undead_mastery', name:'Власть нежити', type:'passive',
        desc:'Скелеты рядом получают +15% урона.' },
    ],
    spells: [
      { id:'death_ray', name:'Луч смерти', cost:25, target:'single_enemy',
        damage:{min:22, max:32}, desc:'Мощный магический урон.' },
      { id:'mass_curse', name:'Массовое проклятье', cost:40, target:'all_enemies',
        damage:{min:10, max:15}, desc:'Урон по всем союзникам.' },
    ],
  },

  necromancer_acolyte: {
    id: 'necromancer_acolyte', name: 'Послушник некроманта', icon: '🧙',
    class: 'mage_single', race: 'undead',
    base: { hp:55, meleeAtk:4, meleeDef:3, magic:22, magicDef:12,
            mana:80, manaRegen:25, initiative:6 },
    attackColumns: [1,2,3], attackType: 'magic', ai: 'attack_lowest_hp',
    role: 'control', aiPattern: 'disable_priority',
    abilities: [],
    spells: [
      { id:'shadow_bolt', name:'Теневой заряд', cost:20, target:'single_enemy',
        damage:{min:16, max:24}, desc:'Тёмная магия.' },
    ],
  },

  // ── Зона 5: Финальный босс ────────────────────────────────────

  necromancer: {
    id: 'necromancer', name: 'Некромант Морт', icon: '💀',
    class: 'mage_aoe', race: 'undead',
    isBossUnit: true,
    base: { hp:280, meleeAtk:8, meleeDef:6, magic:42, magicDef:25,
            mana:150, manaRegen:40, initiative:5 },
    attackColumns: [1,2,3], attackType: 'magic', ai: 'attack_lowest_hp',
    role: 'boss', aiPattern: 'disable_priority',
    abilities: [
      { id:'lich_king', name:'Власть личей', type:'passive',
        desc:'Восстанавливает 12 HP в начале каждого хода.' },
      { id:'mass_death', name:'Массовая смерть', type:'passive',
        desc:'При HP < 40%: заклинания наносят +50% урона.' },
    ],
    spells: [
      { id:'plague', name:'Чума', cost:30, target:'all_enemies',
        damage:{min:15, max:22}, desc:'Заражает всех союзников чумой.' },
      { id:'soul_storm', name:'Буря душ', cost:50, target:'all_enemies',
        damage:{min:30, max:45}, desc:'Сокрушительный удар по всем врагам.' },
      { id:'raise_dead', name:'Воскрешение', cost:40, target:'lowest_hp_ally',
        heal:{min:40, max:60}, desc:'Восстанавливает HP союзника.' },
    ],
  },
};
