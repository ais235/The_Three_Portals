// ================================================================
// FANTASY CARD QUEST — КАРТЫ И ОРУЖИЕ v1.0
// ================================================================
// 50 союзников (стартовый ростер) + полная система оружия
// Передай этот файл Cursor как cards_and_weapons.js
// ================================================================

// ────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1: КОНСТАНТЫ И ФОРМУЛЫ
// ────────────────────────────────────────────────────────────────

const RACES = {
  human:      { label: 'Люди',           color: '#1a3a6b', bg: '#E6F1FB' },
  elf:        { label: 'Эльфы',          color: '#085041', bg: '#E1F5EE' },
  dwarf:      { label: 'Дворфы',         color: '#633806', bg: '#FAEEDA' },
  orc:        { label: 'Орки',           color: '#3B6D11', bg: '#EAF3DE' },
  goblin:     { label: 'Гоблины',        color: '#5F5E5A', bg: '#F1EFE8' },
  undead:     { label: 'Нежить',         color: '#444441', bg: '#F1EFE8' },
  beast:      { label: 'Звери',          color: '#712B13', bg: '#FAECE7' },
  magic_beast:{ label: 'Маг. звери',     color: '#3C3489', bg: '#EEEDFE' },
  construct:  { label: 'Конструкты',     color: '#2C2C2A', bg: '#F1EFE8' },
  spirit:     { label: 'Духи / Феи',     color: '#0F6E56', bg: '#E1F5EE' },
};

const CLASSES = {
  tank:        { label: 'Танк',        column: 1, attackType: 'melee',  weaponTypes: ['melee','acc_armor'] },
  spearman:    { label: 'Копейщик',    column: 1, attackType: 'melee',  weaponTypes: ['melee','acc_armor','acc_speed'] },
  damage:      { label: 'Дамагер',     column: 1, attackType: 'melee',  weaponTypes: ['melee','acc_armor','acc_speed'] },
  archer:      { label: 'Лучник',      column: 2, attackType: 'ranged', weaponTypes: ['ranged','acc_speed'] },
  crossbowman: { label: 'Арбалетчик',  column: 2, attackType: 'ranged', weaponTypes: ['ranged','acc_armor'] },
  mage_aoe:    { label: 'Маг АоЕ',     column: 3, attackType: 'magic',  weaponTypes: ['magic','acc_magic'] },
  mage_single: { label: 'Маг',         column: 3, attackType: 'magic',  weaponTypes: ['magic','acc_magic'] },
  mage_healer: { label: 'Хилер',       column: 3, attackType: 'magic',  weaponTypes: ['magic','acc_magic'] },
  mage_buffer: { label: 'Баффер',      column: 3, attackType: 'magic',  weaponTypes: ['magic','acc_magic'] },
  mage_debuff: { label: 'Дебаффер',    column: 3, attackType: 'magic',  weaponTypes: ['magic','acc_magic'] },
};

// Формула характеристик
function calcStat(base, stars, level) {
  return Math.round(base * (1 + stars * 0.2) * (1 + level * 0.05));
}

// Формула инициативы
function calcInitiative(base, stars, level) {
  return +( base + level * 0.1 + stars * 0.5 ).toFixed(1);
}

// Формула урона
function calcDamage(atk, def, modifier = 1.0) {
  const random = 0.9 + Math.random() * 0.2;
  return Math.max(1, Math.round((atk - def) * modifier * random));
}

// ────────────────────────────────────────────────────────────────
// РАЗДЕЛ 2: 50 СОЮЗНИКОВ
// Структура карточки:
//   id, name, race, class, starRange [min,max],
//   base { hp, meleeAtk, meleeDef, rangeAtk, rangeDef,
//          magic, magicDef, mana, manaRegen, initiative }
//   abilities[] { id, name, unlockedAt, type, desc }
//   lore { min_star: "текст", ... }
//   specialization { available[], bonusPerPoint{}, totalPoints }
// ────────────────────────────────────────────────────────────────

const ALLIES = [

  // ════════════════════════════════════════
  // ЛЮДИ (5 карт)
  // ════════════════════════════════════════

  {
    id: 'straznik', name: 'Стражник', race: 'human', class: 'tank',
    starRange: [1, 2], icon: '🛡️',
    base: { hp:65, meleeAtk:11, meleeDef:11, rangeDef:7, magicDef:5, initiative:4 },
    abilities: [
      { id:'guard_weak',  name:'Защита слабых',  unlockedAt:1, type:'passive',
        desc:'Союзник в кол.2 с HP < 30% → Стражник получает −20% урона.' },
      { id:'shield_wall', name:'Щитовой строй',  unlockedAt:2, type:'passive',
        desc:'Рядом с другим воином-танком — оба получают −15% урона.' },
    ],
    lore: { 1:'Молодой солдат городской стражи. Щит потёрт, но держится.', 2:'Ветеран. Шрамы на щите — его награды.' },
    specialization: { available:['meleeDef','rangeDef','magicDef'], bonusPerPoint:{meleeDef:2,rangeDef:2,magicDef:1}, totalPoints:5 },
  },

  {
    id: 'opolchenec', name: 'Ополченец', race: 'human', class: 'tank',
    starRange: [1, 3], icon: '🪵',
    base: { hp:70, meleeAtk:10, meleeDef:12, rangeDef:6, magicDef:4, initiative:3 },
    abilities: [
      { id:'solidarity',  name:'Солидарность',    unlockedAt:1, type:'passive', desc:'Рядом с ополченцем: оба +10% к атаке.' },
      { id:'bulwark',     name:'Вал стойкости',   unlockedAt:2, type:'aura',    desc:'Пока жив — все союзники +5% к дальней защите.' },
      { id:'rally',       name:'Народный клич',   unlockedAt:3, type:'active',  desc:'Раз в 4 хода: все союзники +15% к атаке на 2 хода.' },
    ],
    lore: { 1:'Фермер с дубиной. Деревня его снарядила.', 2:'Щит теперь железный.', 3:'Ведёт за собой соседей.' },
    specialization: { available:['hp','meleeDef','rangeDef'], bonusPerPoint:{hp:8,meleeDef:2,rangeDef:2}, totalPoints:5 },
  },

  {
    id: 'kopeyshik', name: 'Копейщик', race: 'human', class: 'spearman',
    starRange: [1, 2], icon: '🗡️',
    attackColumns: [1, 2], // достаёт до стрелков
    base: { hp:60, meleeAtk:12, meleeDef:10, rangeDef:8, magicDef:5, initiative:4 },
    abilities: [
      { id:'spear_reach', name:'Досягаемость копья', unlockedAt:1, type:'passive', desc:'Атакует врагов в колонках 1 и 2.' },
      { id:'spear_row',   name:'Копейный ряд',       unlockedAt:2, type:'passive', desc:'Рядом с копейщиком: оба +20% урона.' },
    ],
    lore: { 1:'Копьё досталось от деда. Неловкий, но упорный.', 2:'Научился держать строй.' },
    specialization: { available:['meleeAtk','meleeDef','initiative'], bonusPerPoint:{meleeAtk:3,meleeDef:2,initiative:0.3}, totalPoints:5 },
  },

  {
    id: 'luchnik', name: 'Лучник', race: 'human', class: 'archer',
    starRange: [1, 2], icon: '🏹',
    attackMode: { shots:2 },
    rangeModifiers: { 1:1.0, 2:0.75, 3:null },
    base: { hp:45, meleeAtk:5, meleeDef:5, rangeAtk:14, rangeDef:4, magicDef:4, initiative:6 },
    abilities: [
      { id:'double_shot',   name:'Двойной выстрел', unlockedAt:1, type:'passive', desc:'2 выстрела за ход, каждый в разную цель.' },
      { id:'precise_shot',  name:'Точный выстрел',  unlockedAt:2, type:'active',  desc:'Раз в 3 хода — выстрел без штрафа дальности.' },
    ],
    lore: { 1:'Охотничий лук, самодельные стрелы.', 2:'Первые турниры выиграны.' },
    specialization: { available:['rangeAtk','rangeDef','initiative'], bonusPerPoint:{rangeAtk:3,rangeDef:2,initiative:0.3}, totalPoints:5 },
  },

  {
    id: 'poslushnik', name: 'Послушник света', race: 'human', class: 'mage_healer',
    starRange: [1, 2], icon: '✨',
    base: { hp:40, meleeAtk:4, meleeDef:4, magic:12, magicDef:8, mana:80, manaRegen:20, initiative:4 },
    spells: [
      { id:'minor_heal', name:'Малый лекарь',  cost:25, target:'lowest_hp_ally', heal:{min:20,max:30} },
      { id:'blessing',   name:'Благословение', cost:35, target:'all_allies',     heal:{min:15,max:20}, unlockedAt:2 },
    ],
    abilities: [],
    lore: { 1:'Ещё учится. Исцеления иногда пахнут лавандой.', 2:'Принял сан. Стал сильнее.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:2,mana:15,magicDef:2}, totalPoints:5 },
  },

  // ════════════════════════════════════════
  // ЭЛЬФЫ (5 карт)
  // ════════════════════════════════════════

  {
    id: 'forest_elf', name: 'Лесной эльф', race: 'elf', class: 'archer',
    starRange: [2, 4], icon: '🧝',
    attackMode: { shots:2 },
    rangeModifiers: { 1:1.0, 2:0.75, 3:null },
    base: { hp:50, meleeAtk:6, meleeDef:6, rangeAtk:16, rangeDef:5, magicDef:6, initiative:8 },
    abilities: [
      { id:'forest_sense', name:'Лесное чутьё',   unlockedAt:2, type:'passive', desc:'+20% уклонение в первые 2 хода боя.' },
      { id:'elven_aim',    name:'Эльфийский прицел', unlockedAt:3, type:'passive', desc:'Штраф по кол.2 снижен: 75% → 90%.' },
      { id:'storm_arrows', name:'Ливень стрел',    unlockedAt:4, type:'active',  desc:'Раз в 5 ходов: 70% урона всем врагам выбранной колонки.' },
    ],
    lore: { 2:'Тысячу лет его народ охранял лес.', 3:'Первый лучник отряда.', 4:'Стрелы летят быстрее мысли.' },
    specialization: { available:['rangeAtk','initiative','rangeDef'], bonusPerPoint:{rangeAtk:3,initiative:0.4,rangeDef:2}, totalPoints:5 },
  },

  {
    id: 'elf_mage', name: 'Маг-эльф', race: 'elf', class: 'mage_single',
    starRange: [2, 4], icon: '🌿',
    base: { hp:42, meleeAtk:4, meleeDef:3, magic:20, magicDef:10, mana:75, manaRegen:22, initiative:7 },
    spells: [
      { id:'nature_bolt',  name:'Природный снаряд', cost:18, target:'single', damage:{min:20,max:28} },
      { id:'root',         name:'Корни',             cost:35, target:'single', effect:'stun_1',      unlockedAt:3 },
      { id:'nature_surge', name:'Природный прилив',  cost:50, target:'single', damage:{min:40,max:55}, unlockedAt:4 },
    ],
    abilities: [],
    lore: { 2:'Древняя магия природы течёт в его крови.', 3:'Умеет остановить врага в его следах.', 4:'Природа сама защищает его.' },
    specialization: { available:['magic','mana','initiative'], bonusPerPoint:{magic:3,mana:12,initiative:0.4}, totalPoints:5 },
  },

  {
    id: 'elf_healer', name: 'Жрица природы', race: 'elf', class: 'mage_healer',
    starRange: [2, 4], icon: '🌸',
    base: { hp:45, meleeAtk:4, meleeDef:5, magic:14, magicDef:9, mana:90, manaRegen:22, initiative:5 },
    spells: [
      { id:'natures_touch', name:'Прикосновение природы', cost:22, target:'lowest_hp_ally', heal:{min:25,max:35} },
      { id:'rejuvenate',    name:'Обновление',            cost:40, target:'single_ally',    effect:'regen_3turns', unlockedAt:3 },
      { id:'mass_rejuv',    name:'Массовое обновление',   cost:65, target:'all_allies',     effect:'regen_2turns', unlockedAt:4 },
    ],
    abilities: [
      { id:'forest_bond', name:'Связь с лесом', unlockedAt:2, type:'passive', desc:'Регенерация маны +5% если хотя бы один союзник — зверь.' },
    ],
    lore: { 2:'Природа лечит через её руки.', 3:'Исцелит даже безнадёжного.', 4:'Лес оживает вокруг неё.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:2,mana:15,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'elf_warrior', name: 'Эльфийский воин', race: 'elf', class: 'damage',
    starRange: [2, 3], icon: '⚔️',
    base: { hp:55, meleeAtk:16, meleeDef:8, rangeDef:6, magicDef:8, initiative:7 },
    abilities: [
      { id:'swift_strike', name:'Стремительный удар', unlockedAt:2, type:'passive', desc:'Первый ход: атака дважды (второй удар −30% урона).' },
      { id:'grace',        name:'Эльфийская грация', unlockedAt:3, type:'passive', desc:'15% уклонение от ближних атак.' },
    ],
    lore: { 2:'Сражается как танцует.', 3:'Противники бьют воздух.' },
    specialization: { available:['meleeAtk','initiative','meleeDef'], bonusPerPoint:{meleeAtk:3,initiative:0.4,meleeDef:2}, totalPoints:5 },
  },

  {
    id: 'elf_scout', name: 'Эльфийский разведчик', race: 'elf', class: 'archer',
    starRange: [1, 3], icon: '👁️',
    attackMode: { shots:2 },
    rangeModifiers: { 1:1.0, 2:0.75, 3:0.5 },
    base: { hp:40, meleeAtk:5, meleeDef:4, rangeAtk:15, rangeDef:5, magicDef:6, initiative:9 },
    abilities: [
      { id:'first_strike', name:'Первый выстрел', unlockedAt:1, type:'passive', desc:'Если инициатива выше всех — первый выстрел +25% урона.' },
      { id:'far_sight',    name:'Дальнозоркость', unlockedAt:2, type:'passive', desc:'Штраф по кол.3 снижен: недоступно → 60% урона.' },
      { id:'mark_target',  name:'Пометить цель',  unlockedAt:3, type:'active',  desc:'Помеченный враг получает +20% от всех атак на 3 хода.' },
    ],
    lore: { 1:'Видит дальше всех.', 2:'Первым стреляет — последним падает.', 3:'Его метка — приговор.' },
    specialization: { available:['rangeAtk','initiative','rangeDef'], bonusPerPoint:{rangeAtk:3,initiative:0.5,rangeDef:2}, totalPoints:5 },
  },

  // ════════════════════════════════════════
  // ДВОРФЫ (5 карт)
  // ════════════════════════════════════════

  {
    id: 'dwarf_tank', name: 'Дворф-щитоносец', race: 'dwarf', class: 'tank',
    starRange: [2, 4], icon: '⛏️',
    base: { hp:90, meleeAtk:12, meleeDef:16, rangeDef:10, magicDef:7, initiative:3 },
    abilities: [
      { id:'mountain_stance', name:'Горная стойка',  unlockedAt:2, type:'passive', desc:'Не может быть оглушён или замедлён.' },
      { id:'taunt',           name:'Вызов на бой',   unlockedAt:3, type:'active',  desc:'Раз в бой: все враги атакуют его 2 хода.' },
      { id:'dwarf_fortress',  name:'Дворфийская крепость', unlockedAt:4, type:'passive', desc:'Получает не более 25% maxHP за один удар.' },
    ],
    lore: { 2:'Гора не сдвинется.', 3:'Берёт огонь на себя.', 4:'Его не пробить.' },
    specialization: { available:['meleeDef','hp','magicDef'], bonusPerPoint:{meleeDef:3,hp:10,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'dwarf_berserk', name: 'Дворф-берсерк', race: 'dwarf', class: 'damage',
    starRange: [3, 5], icon: '⚒️',
    base: { hp:85, meleeAtk:22, meleeDef:10, rangeDef:8, magicDef:6, initiative:5 },
    abilities: [
      { id:'berserk',       name:'Берсерк',         unlockedAt:3, type:'passive', desc:'При HP < 40% — иммунитет к оглушению и +25% урона.' },
      { id:'axe_whirl',     name:'Топор-вихрь',     unlockedAt:4, type:'active',  desc:'Раз в 4 хода: АоЕ по кол.1 врагов, 80% урона.' },
      { id:'death_or_glory',name:'Смерть или слава', unlockedAt:5, type:'passive', desc:'При HP < 15% — атакует дважды за ход.' },
    ],
    lore: { 3:'Три кружки эля — и он уже в бою.', 4:'Топор не останавливается.', 5:'Последний удар — самый сильный.' },
    specialization: { available:['meleeAtk','hp','initiative'], bonusPerPoint:{meleeAtk:4,hp:8,initiative:0.3}, totalPoints:5 },
  },

  {
    id: 'dwarf_engineer', name: 'Гном-инженер', race: 'dwarf', class: 'crossbowman',
    starRange: [3, 4], icon: '🔧',
    attackMode: { shots:1, damageModifier:1.4 },
    rangeModifiers: { 1:1.0, 2:0.75, 3:0.5 },
    base: { hp:60, meleeAtk:5, meleeDef:8, rangeAtk:18, rangeDef:5, magicDef:5, initiative:5 },
    abilities: [
      { id:'steam_cannon',  name:'Паровая пушка',  unlockedAt:3, type:'active',  desc:'Раз в 3 хода: +40% урона, без штрафов дальности.' },
      { id:'auto_turret',   name:'Авто-турель',    unlockedAt:4, type:'active',  desc:'Раз в 6 ходов: турель атакует случайного врага 3 хода (10 урона/ход).' },
    ],
    lore: { 3:'Изобрёл паровую пушку в 50 лет.', 4:'Турель строит за 6 секунд.' },
    specialization: { available:['rangeAtk','meleeDef','hp'], bonusPerPoint:{rangeAtk:4,meleeDef:2,hp:6}, totalPoints:5 },
  },

  {
    id: 'dwarf_shaman', name: 'Дворфийский шаман', race: 'dwarf', class: 'mage_buffer',
    starRange: [2, 4], icon: '🪨',
    base: { hp:58, meleeAtk:5, meleeDef:8, magic:16, magicDef:9, mana:70, manaRegen:20, initiative:4 },
    spells: [
      { id:'stone_skin',    name:'Каменная кожа',  cost:30, target:'single_ally',  effect:'meleeDef_up_30pct_2turns' },
      { id:'forge_blessing',name:'Благословение горна', cost:45, target:'all_warriors', effect:'meleeAtk_up_20pct_3turns', unlockedAt:3 },
      { id:'earthquake',    name:'Землетрясение',  cost:60, target:'all_enemies',  damage:{min:15,max:25}, effect:'slow_2turns', unlockedAt:4 },
    ],
    abilities: [],
    lore: { 2:'Горы слышат его молитвы.', 3:'Благословляет оружие союзников.', 4:'Земля дрожит под его словом.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:2,mana:12,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'dwarf_crossbow', name: 'Дворф-арбалетчик', race: 'dwarf', class: 'crossbowman',
    starRange: [1, 3], icon: '🎯',
    attackMode: { shots:1, damageModifier:1.2 },
    rangeModifiers: { 1:1.0, 2:0.75, 3:0.5 },
    base: { hp:58, meleeAtk:5, meleeDef:7, rangeAtk:17, rangeDef:5, magicDef:4, initiative:4 },
    abilities: [
      { id:'heavy_bolt',    name:'Тяжёлый болт',   unlockedAt:2, type:'active',  desc:'Раз в 4 хода: +50% урона, пробивает 20% защиты.' },
      { id:'crush_bolt',    name:'Дробящий болт',  unlockedAt:3, type:'active',  desc:'Раз в 3 хода: цель −20% к физ. защите на 3 хода.' },
    ],
    lore: { 1:'Арбалет дороже трёх луков.', 2:'Болты считает поштучно.', 3:'Осадное оружие в руках пехотинца.' },
    specialization: { available:['rangeAtk','meleeDef','hp'], bonusPerPoint:{rangeAtk:4,meleeDef:2,hp:6}, totalPoints:5 },
  },

  // ════════════════════════════════════════
  // ОРКИ И ГОБЛИНЫ (5 карт)
  // ════════════════════════════════════════

  {
    id: 'orc_warrior', name: 'Орк-воин', race: 'orc', class: 'damage',
    starRange: [1, 3], icon: '👊',
    base: { hp:75, meleeAtk:18, meleeDef:9, rangeDef:6, magicDef:4, initiative:5 },
    abilities: [
      { id:'blood_rage',  name:'Кровавая ярость', unlockedAt:1, type:'passive', desc:'За каждые 20% потерянного HP: +8% к атаке.' },
      { id:'war_cry',     name:'Боевой клич',     unlockedAt:2, type:'active',  desc:'Раз в 5 ходов: все орки и гоблины в отряде +20% атаки на 2 хода.' },
      { id:'cleave',      name:'Рубящий удар',    unlockedAt:3, type:'active',  desc:'Раз в 3 хода: удар по всем врагам кол.1 (70% урона).' },
    ],
    lore: { 1:'Сражается чтобы жить. Живёт чтобы сражаться.', 2:'Ведёт орков в бой.', 3:'Клинок не знает пощады.' },
    specialization: { available:['meleeAtk','hp','initiative'], bonusPerPoint:{meleeAtk:3,hp:8,initiative:0.3}, totalPoints:5 },
  },

  {
    id: 'orc_tank', name: 'Орк-берсерк танк', race: 'orc', class: 'tank',
    starRange: [2, 4], icon: '🦍',
    base: { hp:95, meleeAtk:14, meleeDef:13, rangeDef:8, magicDef:5, initiative:4 },
    abilities: [
      { id:'iron_skin',    name:'Железная шкура',  unlockedAt:2, type:'passive', desc:'Первые 5 урона каждого удара поглощаются.' },
      { id:'intimidate',   name:'Устрашение',      unlockedAt:3, type:'active',  desc:'Раз в 4 хода: все враги кол.1 −15% к атаке на 2 хода (страх).' },
      { id:'warlord_aura', name:'Аура воителя',    unlockedAt:4, type:'aura',    desc:'Все союзники-орки в отряде +10% к HP.' },
    ],
    lore: { 2:'Шкура толще доспехов.', 3:'Один вид его пугает врагов.', 4:'Настоящий воитель орды.' },
    specialization: { available:['hp','meleeDef','meleeAtk'], bonusPerPoint:{hp:10,meleeDef:3,meleeAtk:2}, totalPoints:5 },
  },

  {
    id: 'orc_shaman', name: 'Орк-шаман', race: 'orc', class: 'mage_buffer',
    starRange: [2, 4], icon: '🧌',
    base: { hp:62, meleeAtk:6, meleeDef:6, magic:18, magicDef:9, mana:70, manaRegen:20, initiative:4 },
    spells: [
      { id:'war_ritual',   name:'Боевой ритуал',   cost:40, target:'all_allies',   effect:'meleeAtk_up_20pct_2turns' },
      { id:'totem_heal',   name:'Тотем исцеления', cost:50, target:'place_totem',  effect:'heal_12_per_turn_3turns', unlockedAt:3 },
      { id:'spirit_summon',name:'Призыв духа',     cost:70, target:'summon',       effect:'wolf_spirit_3turns', unlockedAt:4 },
    ],
    abilities: [],
    lore: { 2:'Племя изгнало его за дружбу с людьми.', 3:'Духи предков слышат его.', 4:'Вызывает духов войны.' },
    specialization: { available:['magic','mana','hp'], bonusPerPoint:{magic:2,mana:12,hp:6}, totalPoints:5 },
  },

  {
    id: 'goblin_warrior', name: 'Гоблин-боец', race: 'goblin', class: 'damage',
    starRange: [2, 4], icon: '👺',
    base: { hp:68, meleeAtk:20, meleeDef:10, rangeDef:8, magicDef:4, initiative:7 },
    abilities: [
      { id:'bloodthirst',  name:'Жажда крови',    unlockedAt:2, type:'passive', desc:'За каждого убитого врага: +5% к атаке (стак до 30%).' },
      { id:'poison_blade', name:'Ядовитый клинок',unlockedAt:3, type:'on_hit',  desc:'20% шанс яда: 4 урона/ход × 3 хода.' },
      { id:'frenzy_kill',  name:'Бешенство',      unlockedAt:4, type:'passive', desc:'Убил врага → немедленно ещё одна атака (раз за ход).' },
    ],
    lore: { 2:'Маленький. Злой. Быстрый.', 3:'Клинок пропитан ядом болот.', 4:'Не останавливается пока есть враги.' },
    specialization: { available:['meleeAtk','initiative','hp'], bonusPerPoint:{meleeAtk:3,initiative:0.4,hp:6}, totalPoints:5 },
  },

  {
    id: 'goblin_archer', name: 'Гоблин-лучник', race: 'goblin', class: 'archer',
    starRange: [1, 3], icon: '🏹',
    attackMode: { shots:3 }, // три выстрела — особенность
    rangeModifiers: { 1:1.0, 2:0.6, 3:null }, // слабее лучника по точности
    base: { hp:38, meleeAtk:4, meleeDef:3, rangeAtk:11, rangeDef:3, magicDef:3, initiative:8 },
    abilities: [
      { id:'triple_shot',  name:'Тройной залп',   unlockedAt:1, type:'passive', desc:'3 выстрела за ход (каждый −40% от базы, но по разным целям).' },
      { id:'sneak_shot',   name:'Предательский выстрел', unlockedAt:2, type:'passive', desc:'+30% урона по врагам с HP > 80%.' },
      { id:'volley',       name:'Залп',            unlockedAt:3, type:'active',  desc:'Раз в 5 ходов: все три выстрела в одну цель (+60% суммарного).' },
    ],
    lore: { 1:'Стреляет часто. Иногда попадает.', 2:'Бьёт тех кто не ожидает.', 3:'Залп из трёх стрел убивает любого.' },
    specialization: { available:['rangeAtk','initiative','rangeDef'], bonusPerPoint:{rangeAtk:2,initiative:0.5,rangeDef:2}, totalPoints:5 },
  },

  // ════════════════════════════════════════
  // НЕЖИТЬ (5 карт)
  // ════════════════════════════════════════

  {
    id: 'skeleton_warrior', name: 'Скелет-воин', race: 'undead', class: 'damage',
    starRange: [2, 3], icon: '💀',
    base: { hp:80, meleeAtk:18, meleeDef:10, rangeDef:4, magicDef:2, initiative:4 },
    abilities: [
      { id:'bone_armor',    name:'Костяная броня',  unlockedAt:2, type:'passive', desc:'Иммунитет к яду и кровотечению.' },
      { id:'cursed_blade',  name:'Проклятый клинок',unlockedAt:3, type:'on_hit',  desc:'−10% к защите цели на 2 хода.' },
    ],
    lore: { 2:'Кто-то поднял его. Ему всё равно кто.', 3:'Проклятие усилило его клинок.' },
    specialization: { available:['meleeAtk','meleeDef','hp'], bonusPerPoint:{meleeAtk:3,meleeDef:2,hp:6}, totalPoints:5 },
  },

  {
    id: 'skeleton_archer', name: 'Скелет-лучник', race: 'undead', class: 'archer',
    starRange: [2, 3], icon: '🦴',
    attackMode: { shots:2 },
    rangeModifiers: { 1:1.0, 2:0.75, 3:null },
    base: { hp:52, meleeAtk:4, meleeDef:4, rangeAtk:15, rangeDef:3, magicDef:2, initiative:6 },
    abilities: [
      { id:'bone_arrow',    name:'Костяная стрела', unlockedAt:2, type:'on_hit',  desc:'20% шанс снизить инициативу цели на 2.' },
      { id:'undying_aim',   name:'Нетленный прицел',unlockedAt:3, type:'passive', desc:'Штраф по дальности снижен на 10%.' },
    ],
    lore: { 2:'Кости не устают. Стрелы не кончаются.', 3:'Мёртвые не промахиваются.' },
    specialization: { available:['rangeAtk','initiative','hp'], bonusPerPoint:{rangeAtk:3,initiative:0.3,hp:6}, totalPoints:5 },
  },

  {
    id: 'death_knight_ally', name: 'Рыцарь смерти', race: 'undead', class: 'tank',
    starRange: [4, 5], icon: '⚔️',
    base: { hp:150, meleeAtk:28, meleeDef:18, rangeDef:12, magicDef:10, initiative:5 },
    abilities: [
      { id:'death_aura_ally', name:'Аура смерти',     unlockedAt:4, type:'aura',    desc:'Все враги рядом −10% к атаке (страх).' },
      { id:'soul_drain',      name:'Похищение души',  unlockedAt:4, type:'active',  desc:'Раз в 3 хода: 20-30 урона, исцеляет себя на столько же.' },
      { id:'undying',         name:'Нетленный',       unlockedAt:5, type:'passive', desc:'Один раз за бой воскрешается с 25% HP.' },
    ],
    lore: { 4:'Когда-то был героем. Теперь — кое-что лучше.', 5:'Смерть лишь сделала его сильнее.' },
    specialization: { available:['meleeDef','hp','meleeAtk'], bonusPerPoint:{meleeDef:3,hp:12,meleeAtk:2}, totalPoints:5 },
  },

  {
    id: 'lich_ally', name: 'Лич', race: 'undead', class: 'mage_single',
    starRange: [4, 5], icon: '💜',
    base: { hp:75, meleeAtk:5, meleeDef:5, magic:32, magicDef:16, mana:110, manaRegen:28, initiative:7 },
    spells: [
      { id:'death_ray',    name:'Луч смерти',   cost:40, target:'single', damage:{min:38,max:52} },
      { id:'bone_shield',  name:'Костяной щит', cost:35, target:'self',   effect:'phys_immune_2turns', unlockedAt:4 },
      { id:'mass_curse',   name:'Массовое проклятие', cost:60, target:'all_enemies', effect:'atk_def_down_25pct_2turns', unlockedAt:5 },
    ],
    abilities: [
      { id:'phylactery',   name:'Филактерий',   unlockedAt:5, type:'passive', desc:'Раз за бой воскрешается с 30% HP и маны.' },
    ],
    lore: { 4:'Архимаг отказался умирать.', 5:'Смерть — просто другое состояние.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:4,mana:15,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'necromancer_ally', name: 'Некромант', race: 'undead', class: 'mage_debuff',
    starRange: [3, 5], icon: '🖤',
    base: { hp:55, meleeAtk:4, meleeDef:4, magic:22, magicDef:12, mana:85, manaRegen:24, initiative:5 },
    spells: [
      { id:'curse',        name:'Проклятие',     cost:25, target:'single', effect:'atk_def_down_20pct_3turns' },
      { id:'shadow_bolt',  name:'Теневой снаряд',cost:20, target:'single', damage:{min:16,max:24} },
      { id:'raise_skeleton',name:'Поднять скелета',cost:55,target:'summon',  effect:'skeleton_2turns', unlockedAt:4 },
      { id:'death_mark',   name:'Метка смерти',  cost:45, target:'single', effect:'instakill_below_20pct', unlockedAt:5 },
    ],
    abilities: [],
    lore: { 3:'Продал душу. Торг оказался выгодным.', 4:'Поднимает мёртвых из врагов.', 5:'Смерть — его оружие.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:3,mana:12,magicDef:2}, totalPoints:5 },
  },

  // ════════════════════════════════════════
  // ЗВЕРИ ОБЫЧНЫЕ (5 карт)
  // ════════════════════════════════════════

  {
    id: 'wolf', name: 'Волк-охотник', race: 'beast', class: 'damage',
    starRange: [2, 3], icon: '🐺',
    base: { hp:80, meleeAtk:22, meleeDef:8, rangeDef:6, magicDef:4, initiative:7 },
    abilities: [
      { id:'pack_attack',  name:'Стайная атака', unlockedAt:2, type:'passive', desc:'Рядом с другим зверем: +20% урона.' },
      { id:'lunge',        name:'Рывок',         unlockedAt:2, type:'passive', desc:'Первый ход: атакует дважды.' },
      { id:'howl',         name:'Вой',           unlockedAt:3, type:'active',  desc:'Раз в 4 хода: все союзники-звери +15% к инициативе на 2 хода.' },
    ],
    lore: { 2:'Принял людей как свою стаю.', 3:'Вой слышен за три локации.' },
    specialization: { available:['meleeAtk','initiative','hp'], bonusPerPoint:{meleeAtk:3,initiative:0.4,hp:6}, totalPoints:5 },
  },

  {
    id: 'bear', name: 'Медведь-страж', race: 'beast', class: 'tank',
    starRange: [3, 4], icon: '🐻',
    base: { hp:160, meleeAtk:26, meleeDef:18, rangeDef:12, magicDef:8, initiative:3 },
    abilities: [
      { id:'roar',         name:'Рёв',           unlockedAt:3, type:'active',  desc:'Раз в 4 хода: все враги −10% атаки на 2 хода.' },
      { id:'bear_skin',    name:'Медвежья шкура', unlockedAt:3, type:'passive', desc:'Первые 30 урона каждого удара поглощаются.' },
      { id:'hibernation',  name:'Спячка',        unlockedAt:4, type:'active',  desc:'Раз в бой: уходит в защиту на 1 ход, восстанавливает 25% HP.' },
    ],
    lore: { 3:'Три охотника пытались его поймать.', 4:'Теперь он их охраняет.' },
    specialization: { available:['hp','meleeDef','meleeAtk'], bonusPerPoint:{hp:12,meleeDef:3,meleeAtk:2}, totalPoints:5 },
  },

  {
    id: 'ohotnik', name: 'Охотник', race: 'human', class: 'archer',
    starRange: [1, 2], icon: '🏹',
    attackMode: { shots:2 },
    rangeModifiers: { 1:1.0, 2:0.75, 3:null },
    base: { hp:50, meleeAtk:6, meleeDef:4, rangeAtk:13, rangeDef:5, magicDef:3, initiative:7 },
    abilities: [
      { id:'beast_grip',   name:'Звериная хватка',  unlockedAt:1, type:'passive', desc:'+30% урона против зверей-врагов.' },
      { id:'trap',         name:'Расставной капкан',unlockedAt:2, type:'active',  desc:'Раз в 4 хода: −3 инициативы врагу навсегда.' },
    ],
    lore: { 1:'Зверей знает лучше чем людей.', 2:'Следы читает как книгу.' },
    specialization: { available:['rangeAtk','initiative','rangeDef'], bonusPerPoint:{rangeAtk:3,initiative:0.4,rangeDef:2}, totalPoints:5 },
  },

  {
    id: 'boar', name: 'Кабан-таран', race: 'beast', class: 'damage',
    starRange: [1, 2], icon: '🐗',
    base: { hp:85, meleeAtk:20, meleeDef:12, rangeDef:7, magicDef:3, initiative:5 },
    abilities: [
      { id:'charge',       name:'Таранный удар',  unlockedAt:1, type:'active',  desc:'Раз в 4 хода: атака с 40% шансом оглушить на 1 ход.' },
      { id:'thick_hide',   name:'Толстая шкура',  unlockedAt:2, type:'passive', desc:'Иммунитет к ядам.' },
    ],
    lore: { 1:'Таранит первым.', 2:'Яд его не берёт.' },
    specialization: { available:['meleeAtk','hp','meleeDef'], bonusPerPoint:{meleeAtk:3,hp:8,meleeDef:2}, totalPoints:5 },
  },

  {
    id: 'eagle', name: 'Орёл-разведчик', race: 'beast', class: 'archer',
    starRange: [2, 3], icon: '🦅',
    attackMode: { shots:1, damageModifier:1.3 },
    rangeModifiers: { 1:1.0, 2:0.9, 3:0.7 }, // лучший дальнобойщик среди зверей
    base: { hp:44, meleeAtk:8, meleeDef:5, rangeAtk:18, rangeDef:5, magicDef:5, initiative:9 },
    abilities: [
      { id:'aerial_view',  name:'Вид с высоты',  unlockedAt:2, type:'passive', desc:'Штрафы дальности снижены на 15%.' },
      { id:'talons',       name:'Когти',         unlockedAt:2, type:'on_hit',  desc:'15% шанс наложить кровотечение: 4 урона/ход × 3.' },
      { id:'dive_bomb',    name:'Пике',          unlockedAt:3, type:'active',  desc:'Раз в 4 хода: атака без штрафов дальности + оглушение 30%.' },
    ],
    lore: { 2:'Видит всё поле боя сверху.', 3:'Пике — последнее что видит враг.' },
    specialization: { available:['rangeAtk','initiative','rangeDef'], bonusPerPoint:{rangeAtk:3,initiative:0.5,rangeDef:2}, totalPoints:5 },
  },

  // ════════════════════════════════════════
  // МАГИЧЕСКИЕ ЗВЕРИ (5 карт)
  // ════════════════════════════════════════

  {
    id: 'fire_fox', name: 'Огненная лиса', race: 'magic_beast', class: 'mage_single',
    starRange: [2, 4], icon: '🦊',
    base: { hp:55, meleeAtk:8, meleeDef:6, magic:22, magicDef:10, mana:65, manaRegen:22, initiative:9 },
    spells: [
      { id:'fire_tail',    name:'Огненный хвост',  cost:28, target:'single', damage:{min:22,max:30}, effect:'burn_5_3turns' },
      { id:'fox_fire',     name:'Лисий огонь',     cost:45, target:'random_2', damage:{min:20,max:28}, unlockedAt:3 },
      { id:'inferno',      name:'Инферно',         cost:65, target:'col1_enemies', damage:{min:35,max:50}, unlockedAt:4 },
    ],
    abilities: [
      { id:'dodge_fox',    name:'Уклонение',       unlockedAt:2, type:'passive', desc:'20% шанс полностью избежать атаки.' },
    ],
    lore: { 2:'Дух огня принял облик лисы.', 3:'Говорит только на древнем языке.', 4:'Огонь повинуется ей.' },
    specialization: { available:['magic','initiative','mana'], bonusPerPoint:{magic:3,initiative:0.4,mana:10}, totalPoints:5 },
  },

  {
    id: 'fairy', name: 'Лесная фея', race: 'spirit', class: 'mage_healer',
    starRange: [1, 3], icon: '🧚',
    base: { hp:32, meleeAtk:3, meleeDef:3, magic:10, magicDef:7, mana:70, manaRegen:25, initiative:9 },
    spells: [
      { id:'sleep_dust',   name:'Пыльца сна',      cost:28, target:'single', effect:'stun_1', chance:30 },
      { id:'nature_heal',  name:'Исцеление природой', cost:20, target:'lowest_hp_ally', heal:{min:12,max:18} },
      { id:'fairy_ring',   name:'Круг фей',        cost:50, target:'all_allies', heal:{min:10,max:15}, unlockedAt:3 },
    ],
    abilities: [],
    lore: { 1:'Маленькая. Быстрая. Злится если назовёшь маленькой.', 2:'Крылья несут быстрее ветра.', 3:'Кольцо фей лечит всех.' },
    specialization: { available:['mana','magic','magicDef'], bonusPerPoint:{mana:14,magic:2,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'unicorn', name: 'Единорог', race: 'magic_beast', class: 'mage_healer',
    starRange: [3, 5], icon: '🦄',
    base: { hp:75, meleeAtk:10, meleeDef:10, magic:16, magicDef:14, mana:90, manaRegen:22, initiative:6 },
    spells: [
      { id:'holy_light',   name:'Священный свет', cost:38, target:'lowest_hp_ally', heal:{min:35,max:48}, effect:'cleanse' },
      { id:'purity_aura',  name:'Аура чистоты',   cost:0,  target:'passive', effect:'poison_immune_all' },
      { id:'horn_strike',  name:'Удар рогом',     cost:35, target:'single', damage:{min:25,max:35}, effect:'stun_30pct', unlockedAt:4 },
    ],
    abilities: [
      { id:'purity',       name:'Чистота',        unlockedAt:3, type:'aura', desc:'Все союзники иммунны к яду и проклятиям.' },
    ],
    lore: { 3:'Последний единорог. Решил помочь.', 4:'Его рог лечит любую болезнь.', 5:'Легенда оказалась живой.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:2,mana:14,magicDef:3}, totalPoints:5 },
  },

  {
    id: 'stone_golem_ally', name: 'Голем-страж', race: 'construct', class: 'tank',
    starRange: [4, 4], icon: '🗿', // фиксированная 4★
    base: { hp:260, meleeAtk:30, meleeDef:38, rangeDef:30, magicDef:10, initiative:2 },
    abilities: [
      { id:'stone_immune', name:'Каменное тело',   unlockedAt:4, type:'passive', desc:'Иммунитет к яду, параличу, оглушению, замедлению.' },
      { id:'seismic',      name:'Сейсмический удар',unlockedAt:4, type:'active',  desc:'Раз в 5 ходов: АоЕ по кол.1 врагов, 40-55 урона.' },
    ],
    lore: { 4:'Создан гномами тысячу лет назад. Теперь охраняет тебя.' },
    specialization: { available:['meleeDef','hp','rangeDef'], bonusPerPoint:{meleeDef:4,hp:14,rangeDef:3}, totalPoints:5 },
  },

  {
    id: 'dragon_hatchling', name: 'Дракончик', race: 'magic_beast', class: 'mage_aoe',
    starRange: [4, 5], icon: '🐲',
    base: { hp:130, meleeAtk:18, meleeDef:16, magic:28, magicDef:16, mana:80, manaRegen:20, initiative:6 },
    spells: [
      { id:'fire_breath',  name:'Огненное дыхание', cost:50, target:'col1_and_col2', damage:{min:45,max:60} },
      { id:'dragon_roar',  name:'Рёв дракона',      cost:35, target:'all_enemies',   effect:'fear_20pct_atk_2turns', unlockedAt:4 },
      { id:'scales_shed',  name:'Стальная чешуя',   cost:0,  target:'passive',       effect:'phys_def_plus_30pct', unlockedAt:5 },
    ],
    abilities: [],
    lore: { 4:'Ещё не дракон. Уже не яйцо. Очень злой по этому поводу.', 5:'Настоящий дракон просыпается.' },
    specialization: { available:['magic','hp','magicDef'], bonusPerPoint:{magic:4,hp:10,magicDef:2}, totalPoints:5 },
  },

  // ════════════════════════════════════════
  // ДУХИ / ФЕИ (5 карт)
  // ════════════════════════════════════════

  {
    id: 'fire_spirit', name: 'Дух огня', race: 'spirit', class: 'mage_aoe',
    starRange: [2, 4], icon: '🔥',
    base: { hp:40, meleeAtk:4, meleeDef:3, magic:20, magicDef:9, mana:70, manaRegen:24, initiative:7 },
    spells: [
      { id:'flame_wave',   name:'Волна огня',    cost:30, target:'all_enemies', damage:{min:14,max:20} },
      { id:'immolate',     name:'Поджог',        cost:20, target:'single',      damage:{min:8,max:12}, effect:'burn_6_3turns' },
      { id:'firestorm',    name:'Огненный шторм',cost:70, target:'all_enemies', damage:{min:20,max:30}, effect:'burn_4_2turns', unlockedAt:4 },
    ],
    abilities: [
      { id:'fire_immune',  name:'Иммунитет к огню', unlockedAt:2, type:'passive', desc:'Иммунитет к горению и огненному урону.' },
    ],
    lore: { 2:'Огонь принял форму.', 3:'Жаждет сжечь всё.', 4:'Шторм не остановить.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:3,mana:12,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'water_spirit', name: 'Дух воды', race: 'spirit', class: 'mage_healer',
    starRange: [2, 3], icon: '💧',
    base: { hp:48, meleeAtk:4, meleeDef:5, magic:13, magicDef:10, mana:85, manaRegen:26, initiative:6 },
    spells: [
      { id:'heal_wave',    name:'Волна лечения',  cost:28, target:'all_allies',     heal:{min:12,max:18} },
      { id:'cleanse',      name:'Очищение',       cost:20, target:'single_ally',    effect:'remove_debuffs' },
      { id:'tidal_surge',  name:'Прилив',         cost:55, target:'all_allies',     heal:{min:20,max:28}, unlockedAt:3 },
    ],
    abilities: [],
    lore: { 2:'Вода смывает всё — даже проклятия.', 3:'Прилив не знает поражений.' },
    specialization: { available:['mana','magic','magicDef'], bonusPerPoint:{mana:16,magic:2,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'wind_spirit', name: 'Дух ветра', race: 'spirit', class: 'mage_debuff',
    starRange: [1, 3], icon: '🌪️',
    base: { hp:38, meleeAtk:4, meleeDef:3, magic:15, magicDef:8, mana:65, manaRegen:22, initiative:10 },
    spells: [
      { id:'gust',         name:'Порыв ветра',   cost:18, target:'single_enemy', effect:'initiative_down_4',
        desc:'Снижает инициативу выбранного врага.' },
      { id:'tornado',      name:'Торнадо',       cost:40, target:'single_enemy', damage:{min:18,max:25}, effect:'stun_1', unlockedAt:2,
        area: { shape:'cross', scope:'enemy' },
        desc:'Магический урон и оглушение по кресту (ряд + колонка) вокруг клетки цели.' },
      { id:'wind_wall',    name:'Стена ветра',   cost:50, target:'all_allies', effect:'ranged_dmg_reduce_40pct', unlockedAt:3,
        desc:'Все живые союзники получают защиту от дальнего боя на 3 хода.' },
    ],
    abilities: [
      { id:'wind_step',    name:'Шаг ветра',     unlockedAt:1, type:'passive', desc:'Самая высокая инициатива в игре (база 10).' },
    ],
    lore: { 1:'Быстрее всех. Замедляет врагов.', 2:'Торнадо несёт смерть.', 3:'Стена ветра защищает отряд.' },
    specialization: { available:['magic','initiative','mana'], bonusPerPoint:{magic:2,initiative:0.5,mana:12}, totalPoints:5 },
  },

  {
    id: 'earth_spirit', name: 'Дух земли', race: 'spirit', class: 'tank',
    starRange: [2, 4], icon: '🪨',
    base: { hp:120, meleeAtk:16, meleeDef:20, rangeDef:15, magicDef:12, initiative:2 },
    abilities: [
      { id:'stone_wall',   name:'Каменная стена', unlockedAt:2, type:'active',  desc:'Раз в 4 хода: все союзники +20% к защите на 2 хода.' },
      { id:'quake',        name:'Толчок земли',   unlockedAt:3, type:'active',  desc:'Раз в 5 ходов: все враги кол.1 получают 20-30 урона + оглушение 25%.' },
      { id:'immovable',    name:'Незыблемый',     unlockedAt:4, type:'passive', desc:'Никогда не может быть перемещён или отброшен.' },
    ],
    lore: { 2:'Земля держит его.', 3:'Толчок чувствуется на километр.', 4:'Его не сдвинуть.' },
    specialization: { available:['meleeDef','hp','rangeDef'], bonusPerPoint:{meleeDef:3,hp:12,rangeDef:2}, totalPoints:5 },
  },

  {
    id: 'shadow_spirit', name: 'Дух тени', race: 'spirit', class: 'damage',
    starRange: [3, 5], icon: '🌑',
    base: { hp:70, meleeAtk:28, meleeDef:10, rangeDef:10, magicDef:12, initiative:9 },
    abilities: [
      { id:'shadow_strike', name:'Удар тени',      unlockedAt:3, type:'passive', desc:'Первый удар за бой: ×2.5 урона (выходит из тени).' },
      { id:'phasing',       name:'Нематериальность',unlockedAt:4, type:'active', desc:'Раз в 4 хода: следующий физический удар по нему промахивается.' },
      { id:'shadow_clone',  name:'Двойник тени',   unlockedAt:5, type:'active', desc:'Раз в бой: создаёт копию с 50% статами на 3 хода.' },
    ],
    lore: { 3:'Тень не видна пока не поздно.', 4:'Нельзя ударить то чего нет.', 5:'Два духа тени — армия.' },
    specialization: { available:['meleeAtk','initiative','hp'], bonusPerPoint:{meleeAtk:4,initiative:0.4,hp:6}, totalPoints:5 },
  },

  // ════════════════════════════════════════
  // ТЁМНЫЕ МАГИ / КОЛДУНЫ (5 карт)
  // ════════════════════════════════════════

  {
    id: 'uchenik_ognya', name: 'Ученик огня', race: 'human', class: 'mage_aoe',
    starRange: [1, 2], icon: '🔥',
    base: { hp:35, meleeAtk:4, meleeDef:3, magic:15, magicDef:6, mana:60, manaRegen:20, initiative:5 },
    spells: [
      { id:'fire_flash',   name:'Огненная вспышка', cost:20, target:'all_enemies',  damage:{min:10,max:15} },
      { id:'fireball',     name:'Пламенный шар',    cost:40, target:'single',       damage:{min:25,max:35} },
      { id:'fire_pillar',  name:'Огненный столп',   cost:60, target:'col1_enemies', damage:{min:45,max:60}, unlockedAt:2 },
    ],
    abilities: [],
    lore: { 1:'Поджёг три стола. Отчислен из академии.', 2:'Теперь поджигает врагов.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:3,mana:10,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'elektrik', name: 'Электрик', race: 'human', class: 'mage_single',
    starRange: [1, 3], icon: '⚡',
    base: { hp:38, meleeAtk:4, meleeDef:3, magic:18, magicDef:7, mana:70, manaRegen:20, initiative:6 },
    spells: [
      { id:'discharge',    name:'Разряд',          cost:15, target:'single',     damage:{min:18,max:22} },
      { id:'chain_light',  name:'Цепная молния',   cost:35, target:'random_3',   damage:{min:12,max:18} },
      { id:'paralysis',    name:'Паралич',         cost:40, target:'single',     damage:{min:10,max:15}, effect:'stun_1', unlockedAt:2 },
      { id:'ball_light',   name:'Шаровая молния',  cost:55, target:'bounce_3_5', damage:{min:15,max:22}, unlockedAt:3 },
    ],
    abilities: [],
    lore: { 1:'Молния в детстве. Говорит — было приятно.', 2:'Паралич останавливает любого.', 3:'Шаровая молния прыгает между врагами.' },
    specialization: { available:['magic','initiative','mana'], bonusPerPoint:{magic:3,initiative:0.4,mana:12}, totalPoints:5 },
  },

  {
    id: 'dark_witch', name: 'Тёмная ведьма', race: 'human', class: 'mage_debuff',
    starRange: [3, 5], icon: '🧙‍♀️',
    base: { hp:52, meleeAtk:4, meleeDef:4, magic:24, magicDef:11, mana:80, manaRegen:22, initiative:7 },
    spells: [
      { id:'hex',          name:'Порча',           cost:25, target:'single',     effect:'atk_def_down_20pct_3turns' },
      { id:'dark_bolt',    name:'Тёмный снаряд',   cost:22, target:'single',     damage:{min:18,max:26} },
      { id:'doom',         name:'Рок',             cost:60, target:'single',     effect:'double_dmg_taken_2turns', unlockedAt:4 },
      { id:'dark_form',    name:'Тёмная форма',    cost:0,  target:'passive',    effect:'magic_up_50pct_below_30hp', unlockedAt:5 },
    ],
    abilities: [],
    lore: { 3:'Продала душу. Торг выгодный.', 4:'Проклятие удваивает урон по цели.', 5:'Тьма питает её силу.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:3,mana:12,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'ice_mage', name: 'Ледяной маг', race: 'human', class: 'mage_debuff',
    starRange: [2, 4], icon: '❄️',
    base: { hp:48, meleeAtk:4, meleeDef:4, magic:20, magicDef:9, mana:75, manaRegen:20, initiative:5 },
    spells: [
      { id:'ice_arrow',    name:'Ледяная стрела', cost:22, target:'single',     damage:{min:16,max:22}, effect:'stun_1' },
      { id:'blizzard',     name:'Метель',         cost:45, target:'all_enemies', effect:'initiative_down_3_2turns' },
      { id:'frost_nova',   name:'Взрыв льда',     cost:60, target:'col1_enemies', damage:{min:25,max:35}, effect:'frozen_1', unlockedAt:4 },
    ],
    abilities: [
      { id:'cold_immunity', name:'Иммунитет к холоду', unlockedAt:2, type:'passive', desc:'Иммунитет к замедлению и заморозке.' },
    ],
    lore: { 2:'Горы — его дом.', 3:'Метель останавливает армию.', 4:'Взрыв льда раскалывает броню.' },
    specialization: { available:['magic','mana','magicDef'], bonusPerPoint:{magic:3,mana:12,magicDef:2}, totalPoints:5 },
  },

  {
    id: 'shadow_rogue', name: 'Тёмный разведчик', race: 'human', class: 'damage',
    starRange: [3, 5], icon: '🗡️',
    base: { hp:85, meleeAtk:28, meleeDef:12, rangeDef:10, magicDef:10, initiative:9 },
    abilities: [
      { id:'shadow_stab',  name:'Удар из тени',   unlockedAt:3, type:'passive', desc:'Первый удар за бой: ×2.5 урона.' },
      { id:'poison_blade', name:'Яд клинка',      unlockedAt:4, type:'on_hit',  desc:'15% шанс: 6 урона/ход × 4 хода.' },
      { id:'execute',      name:'Казнь',          unlockedAt:5, type:'active',  desc:'Раз в бой: мгновенно убивает врага с HP < 20%.' },
    ],
    lore: { 3:'Имя неизвестно. Ценник — известен.', 4:'Яд клинка не слышит оправданий.', 5:'Одного удара всегда хватает.' },
    specialization: { available:['meleeAtk','initiative','hp'], bonusPerPoint:{meleeAtk:4,initiative:0.4,hp:6}, totalPoints:5 },
  },

];

// ────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3: СИСТЕМА ОРУЖИЯ
// ────────────────────────────────────────────────────────────────

// Типы оружия и совместимость с классами
const WEAPON_TYPES = {
  melee:      { label: 'Ближнее оружие',    compatibleClasses: ['tank','spearman','damage'] },
  ranged:     { label: 'Дальнее оружие',    compatibleClasses: ['archer','crossbowman'] },
  magic:      { label: 'Магическое оружие', compatibleClasses: ['mage_aoe','mage_single','mage_healer','mage_buffer','mage_debuff'] },
  acc_armor:  { label: 'Броня/щит',         compatibleClasses: ['tank','spearman','damage','crossbowman'] },
  acc_magic:  { label: 'Магический акс.',   compatibleClasses: ['mage_aoe','mage_single','mage_healer','mage_buffer','mage_debuff','magic_beast'] },
  acc_speed:  { label: 'Акс. скорости',     compatibleClasses: ['archer','damage','spearman'] },
  universal:  { label: 'Универсальный',     compatibleClasses: ['tank','spearman','damage','archer','crossbowman','mage_aoe','mage_single','mage_healer','mage_buffer','mage_debuff'] },
};

const RARITIES = {
  common:    { label: 'Обычное',    color: '#888780', dropZones: [1,2] },
  rare:      { label: 'Редкое',     color: '#185FA5', dropZones: [2,3] },
  epic:      { label: 'Эпическое',  color: '#534AB7', dropZones: [3,4] },
  legendary: { label: 'Легендарное',color: '#854F0B', dropZones: [4,5] },
};

// Полный каталог оружия
const WEAPONS = [

  // ── ОБЫЧНОЕ (Зоны 1-2) ──────────────────────────────────────

  {
    id: 'short_sword', name: 'Короткий меч', icon: '⚔️',
    type: 'melee', slot: 'weapon', rarity: 'common',
    bonuses: { meleeAtk: 7 },
    special: null,
    compatibleClasses: ['tank','spearman','damage'],
    dropZones: [1,2], dropChance: 0.45,
    lore: 'Первое оружие любого воина.',
  },
  {
    id: 'long_sword', name: 'Длинный меч', icon: '⚔️',
    type: 'melee', slot: 'weapon', rarity: 'common',
    bonuses: { meleeAtk: 10 },
    special: null,
    compatibleClasses: ['tank','spearman','damage'],
    dropZones: [1,2], dropChance: 0.40,
    lore: 'Надёжный клинок для надёжных рук.',
  },
  {
    id: 'wooden_shield', name: 'Деревянный щит', icon: '🛡',
    type: 'acc_armor', slot: 'accessory', rarity: 'common',
    bonuses: { meleeDef: 6 },
    special: null,
    compatibleClasses: ['tank','spearman','damage'],
    dropZones: [1], dropChance: 0.50,
    lore: 'Дерево держит удар лучше чем кажется.',
  },
  {
    id: 'iron_shield', name: 'Железный щит', icon: '🛡',
    type: 'acc_armor', slot: 'accessory', rarity: 'common',
    bonuses: { meleeDef: 9, rangeDef: 3 },
    special: null,
    compatibleClasses: ['tank','spearman','damage','crossbowman'],
    dropZones: [2], dropChance: 0.40,
    lore: 'Железо надёжнее дерева.',
  },
  {
    id: 'hunting_bow', name: 'Охотничий лук', icon: '🏹',
    type: 'ranged', slot: 'weapon', rarity: 'common',
    bonuses: { rangeAtk: 8 },
    special: null,
    compatibleClasses: ['archer'],
    dropZones: [1,2], dropChance: 0.45,
    lore: 'Лук охотника. Простой и надёжный.',
  },
  {
    id: 'short_crossbow', name: 'Лёгкий арбалет', icon: '⚙️',
    type: 'ranged', slot: 'weapon', rarity: 'common',
    bonuses: { rangeAtk: 10 },
    special: null,
    compatibleClasses: ['crossbowman'],
    dropZones: [1,2], dropChance: 0.40,
    lore: 'Лёгкий. Быстрый. Не самый мощный.',
  },
  {
    id: 'apprentice_staff', name: 'Посох ученика', icon: '🪄',
    type: 'magic', slot: 'weapon', rarity: 'common',
    bonuses: { magic: 7 },
    special: null,
    compatibleClasses: ['mage_aoe','mage_single','mage_healer','mage_buffer','mage_debuff'],
    dropZones: [1,2], dropChance: 0.45,
    lore: 'Первый посох. Часто ломается.',
  },
  {
    id: 'leather_gloves', name: 'Кожаные перчатки', icon: '🧤',
    type: 'acc_speed', slot: 'accessory', rarity: 'common',
    bonuses: { initiative: 0.8 },
    special: null,
    compatibleClasses: ['archer','damage','spearman'],
    dropZones: [1,2], dropChance: 0.35,
    lore: 'Лёгкие. Позволяют двигаться быстрее.',
  },

  // ── РЕДКОЕ (Зоны 2-3) ──────────────────────────────────────

  {
    id: 'battle_axe', name: 'Боевой топор', icon: '🪓',
    type: 'melee', slot: 'weapon', rarity: 'rare',
    bonuses: { meleeAtk: 16 },
    special: { desc: 'Критический удар: 8% шанс ×1.8 урона.', effect: 'crit_8pct' },
    compatibleClasses: ['damage','spearman'],
    dropZones: [2,3], dropChance: 0.25,
    lore: 'Тяжёлый. Медленный. Безжалостный.',
  },
  {
    id: 'crusader_sword', name: 'Меч крестоносца', icon: '✝️',
    type: 'melee', slot: 'weapon', rarity: 'rare',
    bonuses: { meleeAtk: 14, magicDef: 5 },
    special: { desc: '+10% урона по нежити и демонам.', effect: 'holy_dmg_undead' },
    compatibleClasses: ['tank','damage'],
    dropZones: [2,3], dropChance: 0.20,
    lore: 'Освящён в храме. Нежить его боится.',
  },
  {
    id: 'battle_shield', name: 'Боевой щит', icon: '🛡',
    type: 'acc_armor', slot: 'accessory', rarity: 'rare',
    bonuses: { meleeDef: 12, hp: 10 },
    special: null,
    compatibleClasses: ['tank','spearman','damage'],
    dropZones: [2,3], dropChance: 0.25,
    lore: 'Щит ветерана. Держал тысячи ударов.',
  },
  {
    id: 'elven_bow', name: 'Эльфийский лук', icon: '🌿',
    type: 'ranged', slot: 'weapon', rarity: 'rare',
    bonuses: { rangeAtk: 14, initiative: 0.5 },
    special: { desc: 'Раз в 3 хода: третий выстрел бесплатно.', effect: 'bonus_shot_3turns' },
    compatibleClasses: ['archer'],
    dropZones: [2,3], dropChance: 0.20,
    lore: 'Тысячелетняя эльфийская работа.',
  },
  {
    id: 'crossbow_heavy', name: 'Тяжёлый арбалет', icon: '⚙️',
    type: 'ranged', slot: 'weapon', rarity: 'rare',
    bonuses: { rangeAtk: 16 },
    special: { desc: 'Тяжёлый болт: пробивает 25% защиты.', effect: 'armor_pierce_25' },
    compatibleClasses: ['crossbowman'],
    dropZones: [2,3], dropChance: 0.20,
    lore: 'Болт пробьёт любой доспех.',
  },
  {
    id: 'mage_wand', name: 'Волшебная палочка', icon: '🪄',
    type: 'magic', slot: 'weapon', rarity: 'rare',
    bonuses: { magic: 12, mana: 15 },
    special: null,
    compatibleClasses: ['mage_aoe','mage_single','mage_healer','mage_buffer','mage_debuff'],
    dropZones: [2,3], dropChance: 0.25,
    lore: 'Усиливает магию и запас маны.',
  },
  {
    id: 'healers_focus', name: 'Фокус целителя', icon: '💎',
    type: 'magic', slot: 'weapon', rarity: 'rare',
    bonuses: { magic: 8, mana: 20 },
    special: { desc: 'Заклинания лечения +15% эффективности.', effect: 'heal_boost_15' },
    compatibleClasses: ['mage_healer'],
    dropZones: [2,3], dropChance: 0.18,
    lore: 'Создан только для целителей.',
  },
  {
    id: 'magic_ring', name: 'Кольцо магии', icon: '💍',
    type: 'acc_magic', slot: 'accessory', rarity: 'rare',
    bonuses: { magicDef: 8, mana: 20 },
    special: null,
    compatibleClasses: ['mage_aoe','mage_single','mage_healer','mage_buffer','mage_debuff','magic_beast'],
    dropZones: [2,3], dropChance: 0.22,
    lore: 'Кольцо щитит от магии.',
  },
  {
    id: 'iron_helm', name: 'Железный шлем', icon: '⛑️',
    type: 'acc_armor', slot: 'accessory', rarity: 'rare',
    bonuses: { meleeDef: 10, hp: 12 },
    special: null,
    compatibleClasses: ['tank','damage'],
    dropZones: [2,3], dropChance: 0.22,
    lore: 'Защищает голову. Это важнее всего.',
  },
  {
    id: 'swift_boots', name: 'Быстрые сапоги', icon: '👟',
    type: 'acc_speed', slot: 'accessory', rarity: 'rare',
    bonuses: { initiative: 1.2 },
    special: { desc: 'Первый ход боя: +2 к инициативе.', effect: 'first_turn_init_plus2' },
    compatibleClasses: ['archer','damage','spearman'],
    dropZones: [2,3], dropChance: 0.18,
    lore: 'Лёгкие как ветер.',
  },

  // ── ЭПИЧЕСКОЕ (Зоны 3-4, боссы) ───────────────────────────

  {
    id: 'war_hammer', name: 'Боевой молот', icon: '🔨',
    type: 'melee', slot: 'weapon', rarity: 'epic',
    bonuses: { meleeAtk: 20 },
    special: { desc: '20% шанс оглушить цель на 1 ход.', effect: 'stun_20pct' },
    compatibleClasses: ['tank','damage'],
    dropZones: [3,4], dropChance: 0.15, bossOnly: false,
    lore: 'Удар молота оглушает даже троллей.',
  },
  {
    id: 'spear_master', name: 'Копьё мастера', icon: '🗡️',
    type: 'melee', slot: 'weapon', rarity: 'epic',
    bonuses: { meleeAtk: 18 },
    special: { desc: 'Копейщик теперь достаёт до колонки 3 (маги врага).', effect: 'reach_col3' },
    compatibleClasses: ['spearman'],
    dropZones: [4], dropChance: 0.12, bossOnly: true,
    lore: 'Самое длинное копьё в мире.',
  },
  {
    id: 'chaos_orb', name: 'Шар хаоса', icon: '🔮',
    type: 'magic', slot: 'weapon', rarity: 'epic',
    bonuses: { magic: 18, mana: 10 },
    special: { desc: 'Все заклинания стоят на 10% меньше маны.', effect: 'spell_cost_reduce_10' },
    compatibleClasses: ['mage_aoe','mage_single','mage_debuff'],
    dropZones: [3,4], dropChance: 0.14, bossOnly: false,
    lore: 'Хаос внутри. Сила снаружи.',
  },
  {
    id: 'spirit_staff', name: 'Посох духов', icon: '🌀',
    type: 'magic', slot: 'weapon', rarity: 'epic',
    bonuses: { magic: 14, mana: 25 },
    special: { desc: 'Заклинания лечения +25% эффективности.', effect: 'heal_boost_25' },
    compatibleClasses: ['mage_healer','mage_buffer'],
    dropZones: [3,4], dropChance: 0.12, bossOnly: false,
    lore: 'Духи предков говорят через него.',
  },
  {
    id: 'dragonscale_armor', name: 'Чешуйчатый доспех', icon: '🐉',
    type: 'acc_armor', slot: 'accessory', rarity: 'epic',
    bonuses: { meleeDef: 15, rangeDef: 12, magicDef: 8 },
    special: { desc: '+15% к физической защите от любых источников.', effect: 'phys_def_plus_15pct' },
    compatibleClasses: ['tank','damage'],
    dropZones: [4], dropChance: 0.10, bossOnly: true,
    lore: 'Чешуя настоящего дракона.',
  },
  {
    id: 'speed_boots_epic', name: 'Сапоги скорости', icon: '⚡',
    type: 'acc_speed', slot: 'accessory', rarity: 'epic',
    bonuses: { initiative: 1.8 },
    special: { desc: 'При HP > 70% — +1 дополнительная инициатива.', effect: 'init_bonus_high_hp' },
    compatibleClasses: ['archer','damage','spearman'],
    dropZones: [3,4], dropChance: 0.12, bossOnly: false,
    lore: 'Быстрее молнии.',
  },
  {
    id: 'amulet_fortitude', name: 'Амулет стойкости', icon: '📿',
    type: 'acc_magic', slot: 'accessory', rarity: 'epic',
    bonuses: { hp: 22, magicDef: 8 },
    special: { desc: 'Восстанавливает 4 HP в начале каждого хода.', effect: 'regen_4_per_turn' },
    compatibleClasses: ['tank','mage_healer','mage_buffer'],
    dropZones: [3,4], dropChance: 0.11, bossOnly: false,
    lore: 'Амулет не даст умереть быстро.',
  },
  {
    id: 'sniper_crossbow', name: 'Снайперский арбалет', icon: '🎯',
    type: 'ranged', slot: 'weapon', rarity: 'epic',
    bonuses: { rangeAtk: 22 },
    special: { desc: 'Штрафы дальности вдвое меньше. Кол.3 теперь −25% вместо −50%.', effect: 'range_penalty_half' },
    compatibleClasses: ['crossbowman'],
    dropZones: [3,4], dropChance: 0.12, bossOnly: false,
    lore: 'Снайпер бьёт откуда не ждут.',
  },

  // ── ЛЕГЕНДАРНОЕ (Зона 5, финальный босс) ──────────────────

  {
    id: 'dragon_bow', name: 'Лук Дракона', icon: '🐲',
    type: 'ranged', slot: 'weapon', rarity: 'legendary',
    bonuses: { rangeAtk: 28, initiative: 1.0 },
    special: { desc: '10% шанс: выстрел поджигает цель — 10 урона/ход × 3 хода.', effect: 'fire_arrow_10pct' },
    compatibleClasses: ['archer','crossbowman'],
    dropZones: [5], dropChance: 0.08, bossOnly: true,
    lore: 'Тетива из жилы дракона. Не рвётся никогда.',
  },
  {
    id: 'necro_staff', name: 'Посох Некроманта', icon: '💀',
    type: 'magic', slot: 'weapon', rarity: 'legendary',
    bonuses: { magic: 26, mana: 30 },
    special: { desc: 'Каждое заклинание лечит мага на 12% нанесённого урона.', effect: 'spell_lifesteal_12' },
    compatibleClasses: ['mage_aoe','mage_single','mage_debuff'],
    dropZones: [5], dropChance: 0.07, bossOnly: true,
    lore: 'Посох самого некроманта. Пропитан тёмной силой.',
  },
  {
    id: 'legend_crown', name: 'Корона героя', icon: '👑',
    type: 'universal', slot: 'accessory', rarity: 'legendary',
    bonuses: { hp: 30, magicDef: 10, initiative: 1.0 },
    special: { desc: 'Подходит любому классу. +8 ко всем видам защиты.', effect: 'all_def_plus_8' },
    compatibleClasses: ['tank','spearman','damage','archer','crossbowman','mage_aoe','mage_single','mage_healer','mage_buffer','mage_debuff'],
    dropZones: [5], dropChance: 0.06, bossOnly: true,
    lore: 'Корона финального босса. Символ победы.',
  },
  {
    id: 'ancient_spear', name: 'Древнее копьё', icon: '✨',
    type: 'melee', slot: 'weapon', rarity: 'legendary',
    bonuses: { meleeAtk: 28 },
    special: { desc: 'Копейщик атакует все три колонки врагов. Пронзает до 30% защиты.', effect: 'reach_all_cols_pierce30' },
    compatibleClasses: ['spearman'],
    dropZones: [5], dropChance: 0.06, bossOnly: true,
    lore: 'Выковано богами в начале времён.',
  },
  {
    id: 'guardian_armor', name: 'Доспех Хранителя', icon: '⚜️',
    type: 'acc_armor', slot: 'accessory', rarity: 'legendary',
    bonuses: { meleeDef: 20, rangeDef: 16, hp: 35 },
    special: { desc: 'Получает не более 20% maxHP за один удар.', effect: 'dmg_cap_20pct_max_hp' },
    compatibleClasses: ['tank','damage'],
    dropZones: [5], dropChance: 0.06, bossOnly: true,
    lore: 'Доспех легендарного Хранителя Цитадели.',
  },

];

// ────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4: ТАБЛИЦА ДРОПА ОРУЖИЯ ПО ЛОКАЦИЯМ
// ────────────────────────────────────────────────────────────────

const WEAPON_DROP_TABLE = {

  // Зона 1: Крысиные норы / Паутинные туннели / Змеиные гнёзда
  zone1: {
    name: 'Зона 1 (локации 1-3)',
    dropChancePerBattle: 0.20, // 20% шанс дропа оружия за бой
    rarityWeights: { common: 0.90, rare: 0.10, epic: 0.00, legendary: 0.00 },
    availableWeapons: ['short_sword','wooden_shield','hunting_bow','apprentice_staff','leather_gloves'],
    note: 'Только обычное снаряжение',
  },

  zone1_boss: {
    name: 'Зона 1 (боссы)',
    dropChancePerBattle: 0.70,
    rarityWeights: { common: 0.40, rare: 0.55, epic: 0.05, legendary: 0.00 },
    availableWeapons: ['long_sword','iron_shield','hunting_bow','short_crossbow','mage_wand'],
    note: 'Боссы зоны 1 гарантированно дают что-то полезное',
  },

  // Зона 2: Опушка леса / Лесная тропа / Разбойный стан
  zone2: {
    name: 'Зона 2 (локации 4-6)',
    dropChancePerBattle: 0.25,
    rarityWeights: { common: 0.60, rare: 0.35, epic: 0.05, legendary: 0.00 },
    availableWeapons: ['long_sword','iron_shield','elven_bow','crossbow_heavy','mage_wand','magic_ring','iron_helm','swift_boots'],
    note: 'Появляются редкие предметы',
  },

  zone2_boss: {
    name: 'Зона 2 (боссы)',
    dropChancePerBattle: 0.85,
    rarityWeights: { common: 0.10, rare: 0.60, epic: 0.28, legendary: 0.02 },
    availableWeapons: ['battle_axe','crusader_sword','battle_shield','elven_bow','healers_focus','swift_boots'],
    note: 'Высокий шанс редкого, первые эпические',
  },

  // Зона 3: Заброшенный храм / Горное ущелье
  zone3: {
    name: 'Зона 3 (локации 7-8)',
    dropChancePerBattle: 0.28,
    rarityWeights: { common: 0.30, rare: 0.50, epic: 0.20, legendary: 0.00 },
    availableWeapons: ['battle_axe','crusader_sword','battle_shield','crossbow_heavy','mage_wand','healers_focus','iron_helm','magic_ring'],
    note: 'Эпическое уже реально',
  },

  zone3_boss: {
    name: 'Зона 3 (боссы)',
    dropChancePerBattle: 0.90,
    rarityWeights: { common: 0.00, rare: 0.40, epic: 0.55, legendary: 0.05 },
    availableWeapons: ['war_hammer','chaos_orb','spirit_staff','speed_boots_epic','amulet_fortitude','sniper_crossbow'],
    note: 'Эпическое основной дроп, первое легендарное возможно',
  },

  // Зона 4: Пещера троллей / Крепость бандитов
  zone4: {
    name: 'Зона 4 (локации 9-10)',
    dropChancePerBattle: 0.30,
    rarityWeights: { common: 0.00, rare: 0.25, epic: 0.70, legendary: 0.05 },
    availableWeapons: ['war_hammer','chaos_orb','spirit_staff','speed_boots_epic','amulet_fortitude','sniper_crossbow'],
    note: 'Эпическое доминирует',
  },

  zone4_boss: {
    name: 'Зона 4 (боссы)',
    dropChancePerBattle: 0.95,
    rarityWeights: { common: 0.00, rare: 0.10, epic: 0.60, legendary: 0.30 },
    availableWeapons: ['spear_master','dragonscale_armor','sniper_crossbow','amulet_fortitude'],
    note: 'Первые легендарные предметы',
  },

  // Зона 5: Тёмный лес / Замок некроманта
  zone5: {
    name: 'Зона 5 (локации 11-12)',
    dropChancePerBattle: 0.32,
    rarityWeights: { common: 0.00, rare: 0.05, epic: 0.65, legendary: 0.30 },
    availableWeapons: ['war_hammer','dragonscale_armor','chaos_orb','speed_boots_epic'],
    note: 'Легендарное реально с боёв',
  },

  zone5_boss: {
    name: 'Финальный босс (гарантия)',
    dropChancePerBattle: 1.00, // гарантированный дроп
    rarityWeights: { common: 0.00, rare: 0.00, epic: 0.00, legendary: 1.00 },
    availableWeapons: ['dragon_bow','necro_staff','legend_crown','ancient_spear','guardian_armor'],
    note: '100% легендарный предмет. По одному за прохождение.',
  },

};

// ────────────────────────────────────────────────────────────────
// РАЗДЕЛ 5: ФУНКЦИЯ ГЕНЕРАЦИИ ДРОПА (логика для движка)
// ────────────────────────────────────────────────────────────────

function rollWeaponDrop(zoneKey, playerInventory = []) {
  const table = WEAPON_DROP_TABLE[zoneKey];
  if (!table) return null;

  // Шанс дропа
  if (Math.random() > table.dropChancePerBattle) return null;

  // Определяем редкость
  const rand = Math.random();
  let cumulative = 0;
  let chosenRarity = 'common';
  for (const [rarity, weight] of Object.entries(table.rarityWeights)) {
    cumulative += weight;
    if (rand <= cumulative) { chosenRarity = rarity; break; }
  }

  // Фильтруем оружие по редкости и зоне
  const pool = WEAPONS.filter(w =>
    w.rarity === chosenRarity &&
    table.availableWeapons.includes(w.id)
  );

  if (pool.length === 0) return null;

  // Случайный предмет из пула (с небольшим бонусом для новых)
  const owned = playerInventory.map(i => i.id);
  const newItems = pool.filter(w => !owned.includes(w.id));
  const pickFrom = newItems.length > 0 ? newItems : pool;

  return pickFrom[Math.floor(Math.random() * pickFrom.length)];
}

// Проверка совместимости оружия с юнитом
function canEquip(weapon, unitClass) {
  return weapon.compatibleClasses.includes(unitClass) ||
         weapon.type === 'universal';
}

// Применить бонусы оружия к юниту
function applyWeaponBonuses(unit, weapon) {
  if (!weapon) return unit;
  const result = { ...unit, stats: { ...unit.stats } };
  for (const [stat, value] of Object.entries(weapon.bonuses)) {
    if (result.stats[stat] !== undefined) {
      result.stats[stat] += value;
    }
  }
  return result;
}

// ────────────────────────────────────────────────────────────────
// ЭКСПОРТ
// ────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined') {
  module.exports = {
    ALLIES,
    WEAPONS,
    WEAPON_TYPES,
    RARITIES,
    WEAPON_DROP_TABLE,
    RACES,
    CLASSES,
    calcStat,
    calcInitiative,
    calcDamage,
    rollWeaponDrop,
    canEquip,
    applyWeaponBonuses,
  };
}
