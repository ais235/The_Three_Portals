// ================================================================
// LOCATIONS — Карта мира Fantasy Card Quest
// ================================================================
// pos.row / pos.col  — старая сетка (для совместимости, UI карты не использует)
//
// mapX, mapY — позиция узла на экране карты зоны (внутри области #zone-nodes):
//   mapUnit: 'percent' (по умолчанию) — 0–100, от левого и верхнего края области;
//   mapUnit: 'px' — смещение в пикселях от левого верхнего угла области.
// Узел центрируется в точке (mapX, mapY). Если mapX/mapY не заданы — узлы
// выстраиваются в ряд по центру (fallback по orderX).

const LOCATIONS = [

  // ════════════════════════════════════════════════════════════
  // ЗОНА 1 — Лесные предместья (rows 0-4)
  // ════════════════════════════════════════════════════════════

  {
    id: 'loc_1', name: 'Крысиные норы', zone: 1, enemyThemes: ['swarm', 'basic'],
    orderX: 1, icon: '🐀',
    mapX: 10, mapY: 30, mapUnit: 'percent',
    maxStars: 3, maxUnits: 3,
    pos: { row: 0, col: 1 },
    requires: [], requiresAny: false,
    enemies: ['rat', 'large_rat'], enemyCount: [1, 2], enemyBudget: [1, 2],
    encounters: [
      { id: 'duo_rats', enemies: ['rat', 'rat'] },
      { id: 'mixed', enemies: ['rat', 'large_rat'] },
      { id: 'duo_rats_alt', enemies: ['rat', 'rat'] },
      { id: 'mixed_alt', enemies: ['rat', 'large_rat'] },
    ],
    targetPower: [200, 280],
    rewards: { coins: [75, 75], weaponChance: 0.10, scrollChance: 0.05, scrollType: 'bronze' },
    clearsRequired: 9,
    bossEncounter: {
      id: 'boss_rat_king',
      name: 'Крысиный Король',
      enemies: ['rat_king', 'large_rat', 'large_rat'],
      targetPower: [450, 600],
    },
    isBoss: false,
    desc: 'Подземные норы кишат крысами-переростками. Идеальное место для первой тренировки.',
    zoneLabel: 'Зона 1: Лесные предместья',
  },

  {
    id: 'loc_2', name: 'Паутинные туннели', zone: 1, enemyThemes: ['poison', 'swarm'],
    orderX: 2, icon: '🕷️',
    mapX: 26, mapY: 38, mapUnit: 'percent',
    maxStars: 1, maxUnits: 3,
    pos: { row: 1, col: 1 },
    requires: ['loc_1'], requiresAny: false,
    enemies: ['spider', 'spider', 'large_rat'], enemyCount: [2, 3], enemyBudget: [2, 3],
    encounters: [
      { id: 'rat_spider', enemies: ['rat', 'spider'] },
      { id: 'double_spider', enemies: ['spider', 'spider'] },
      { id: 'spider_hunt', enemies: ['spider', 'spider', 'rat'] },
    ],
    targetPower: [280, 380],
    rewards: { coins: [70, 90], weaponChance: 0.15, scrollChance: 0.05, scrollType: 'bronze' },
    clearsRequired: 9,
    bossEncounter: {
      id: 'boss_spider_queen',
      name: 'Паучиха-матриарх',
      enemies: ['spider_queen', 'spider', 'spider'],
      targetPower: [450, 600],
    },
    isBoss: false,
    desc: 'Старые туннели оплетены паутиной. Пауки атакуют ядовитыми укусами.',
    zoneLabel: 'Зона 1: Лесные предместья',
  },

  {
    id: 'loc_3a', name: 'Змеиные гнёзда', zone: 1, enemyThemes: ['poison', 'evasion'],
    orderX: 3, icon: '🐍',
    mapX: 42, mapY: 65, mapUnit: 'percent',
    maxStars: 1, maxUnits: 4,
    pos: { row: 2, col: 0 },
    requires: ['loc_2'], requiresAny: false,
    enemies: ['snake', 'viper'], enemyCount: [2, 3], enemyBudget: [2, 4],
    encounters: [
      { id: 'twin_vipers', enemies: ['viper', 'viper'] },
      { id: 'triple_snakes', enemies: ['snake', 'snake', 'snake'] },
      { id: 'two_snakes_viper', enemies: ['snake', 'snake', 'viper'] },
    ],
    targetPower: [350, 450],
    rewards: { coins: [90, 110], weaponChance: 0.20, scrollChance: 0.08, scrollType: 'bronze' },
    clearsRequired: 9,
    bossEncounter: {
      id: 'boss_snake_king',
      name: 'Змеегор',
      enemies: ['snake_king', 'viper', 'viper'],
      targetPower: [450, 600],
    },
    isBoss: false,
    desc: 'Гнёзда ядовитых змей в корнях древних деревьев. Остерегайтесь яда!',
    zoneLabel: 'Зона 1: Лесные предместья',
  },

  {
    id: 'loc_3b', name: 'Опушка леса', zone: 1, enemyThemes: ['ranged', 'basic'],
    orderX: 4, icon: '🌿',
    mapX: 52, mapY: 44, mapUnit: 'percent',
    maxStars: 2, maxUnits: 4,
    pos: { row: 2, col: 2 },
    requires: ['loc_2'], requiresAny: false,
    enemies: ['bandit_club', 'bandit_bow'], enemyCount: [2, 3], enemyBudget: [3, 5],
    encounters: [
      { id: 'club_bow', enemies: ['bandit_club', 'bandit_bow'] },
      { id: 'double_bow', enemies: ['bandit_bow', 'bandit_bow'] },
      { id: 'trio_bandits', enemies: ['bandit_club', 'bandit_club', 'bandit_bow'] },
    ],
    targetPower: [350, 450],
    rewards: { coins: [100, 130], weaponChance: 0.15, scrollChance: 0.15, scrollType: 'bronze' },
    clearsRequired: 9,
    bossEncounter: {
      id: 'boss_bandit_ataman',
      name: 'Атаман разбойников',
      enemies: ['bandit_warlord', 'bandit_captain', 'bandit_bow'],
      targetPower: [450, 600],
    },
    isBoss: false,
    desc: 'Бандиты захватили опушку. Смешанный отряд — есть и лучники.',
    zoneLabel: 'Зона 1: Лесные предместья',
  },

  {
    id: 'loc_4', name: 'Лесная тропа', zone: 1, enemyThemes: ['ranged', 'control'],
    orderX: 5, icon: '🌲',
    mapX: 66, mapY: 52, mapUnit: 'percent',
    maxStars: 2, maxUnits: 5,
    pos: { row: 3, col: 1 },
    requires: ['loc_3a', 'loc_3b'], requiresAny: true,
    enemies: ['bandit_club', 'bandit_bow', 'hypnotist'], enemyCount: [2, 3], enemyBudget: [4, 6],
    encounters: [
      { id: 'balanced', enemies: ['bandit_club', 'bandit_bow'] },
      { id: 'backline_threat', enemies: ['bandit_club', 'spider'] },
      { id: 'range_pressure', enemies: ['bandit_bow', 'bandit_bow'] },
    ],
    targetPower: [420, 550],
    rewards: { coins: [110, 150], weaponChance: 0.15, scrollChance: 0.15, scrollType: 'bronze' },
    clearsRequired: 9,
    bossEncounter: {
      id: 'boss_forest_horror',
      name: 'Лесной ужас',
      enemies: ['forest_horror', 'troll', 'ghost'],
      targetPower: [450, 600],
    },
    isBoss: false,
    desc: 'Главная дорога в лесу перекрыта бандитами с гипнотизёром. Будьте осторожны.',
    zoneLabel: 'Зона 1: Лесные предместья',
  },

  {
    id: 'boss_z1', name: 'Атаман Кровавый Кулак', zone: 1, enemyThemes: ['boss', 'melee'],
    orderX: 6, icon: '👊',
    mapX: 86, mapY: 42, mapUnit: 'percent',
    maxStars: 2, maxUnits: 5,
    pos: { row: 4, col: 1 },
    requires: ['loc_4'], requiresAny: false,
    enemies: ['bandit_warlord', 'bandit_captain'], enemyCount: [1, 1], enemyBudget: [99, 99],
    targetPower: [600, 800],
    rewards: {
      coins: [200, 250], weaponChance: 1.0, scrollChance: 1.0, scrollType: 'silver',
      artifact: 'warlord_pauldron',
    },
    isBoss: true,
    desc: 'Атаман всех лесных разбойников. Огромный и сильный, но туповатый. Ключ к зоне 2.',
    zoneLabel: 'Зона 1: Босс',
  },

  // ════════════════════════════════════════════════════════════
  // ЗОНА 2 — Разрушенные руины (rows 5-7)
  // ════════════════════════════════════════════════════════════

  {
    id: 'loc_5', name: 'Разбойный стан', zone: 2, enemyThemes: ['ranged', 'control'],
    orderX: 1, icon: '⚔️',
    mapX: 14, mapY: 60, mapUnit: 'percent',
    maxStars: 2, maxUnits: 5,
    pos: { row: 5, col: 0 },
    requires: ['boss_z1'], requiresAny: false,
    enemies: ['bandit_captain', 'bandit_bow', 'hypnotist'], enemyCount: [2, 4], enemyBudget: [5, 7],
    rewards: { coins: [130, 180], weaponChance: 0.25, scrollChance: 0.15, scrollType: 'silver' },
    isBoss: false,
    desc: 'Укреплённый лагерь оставшихся бандитов с опытным командованием.',
    zoneLabel: 'Зона 2: Разрушенные руины',
  },

  {
    id: 'loc_6', name: 'Заброшенный храм', zone: 2, enemyThemes: ['magic', 'undead'],
    orderX: 2, icon: '🏚️',
    mapX: 40, mapY: 50, mapUnit: 'percent',
    maxStars: 3, maxUnits: 6,
    pos: { row: 5, col: 2 },
    requires: ['boss_z1'], requiresAny: false,
    enemies: ['skeleton', 'ghost', 'dark_mage'], enemyCount: [2, 4], enemyBudget: [6, 9],
    rewards: { coins: [150, 200], weaponChance: 0.25, scrollChance: 0.20, scrollType: 'silver' },
    isBoss: false,
    desc: 'Древний храм, охраняемый духами и нежитью. Магическая защита высока.',
    zoneLabel: 'Зона 2: Разрушенные руины',
  },

  {
    id: 'loc_7', name: 'Горный перевал', zone: 2, enemyThemes: ['tank', 'ranged'],
    orderX: 3, icon: '⛰️',
    mapX: 54, mapY: 54, mapUnit: 'percent',
    maxStars: 3, maxUnits: 6,
    pos: { row: 6, col: 1 },
    requires: ['loc_5', 'loc_6'], requiresAny: true,
    enemies: ['troll', 'mountain_bandit', 'skeleton_archer'], enemyCount: [2, 4], enemyBudget: [6, 10],
    rewards: { coins: [170, 220], weaponChance: 0.30, scrollChance: 0.20, scrollType: 'silver' },
    isBoss: false,
    desc: 'Узкий перевал с троллями и горными бандитами. Опасное, но выгодное место.',
    zoneLabel: 'Зона 2: Разрушенные руины',
  },

  {
    id: 'boss_z2', name: 'Страж Храма', zone: 2, enemyThemes: ['boss', 'tank'],
    orderX: 4, icon: '🗿',
    mapX: 84, mapY: 44, mapUnit: 'percent',
    maxStars: 3, maxUnits: 6,
    pos: { row: 7, col: 1 },
    requires: ['loc_7'], requiresAny: false,
    enemies: ['temple_guardian', 'skeleton', 'ghost'], enemyCount: [1, 1], enemyBudget: [99, 99],
    rewards: {
      coins: [300, 380], weaponChance: 1.0, scrollChance: 1.0, scrollType: 'silver',
      artifact: 'temple_rune',
    },
    isBoss: true,
    desc: 'Каменный колосс, хранящий проход в тёмное подземелье. Стойкий и неумолимый.',
    zoneLabel: 'Зона 2: Босс',
  },

  // ════════════════════════════════════════════════════════════
  // ЗОНА 3 — Тёмное подземелье (rows 8-10)
  // ════════════════════════════════════════════════════════════

  {
    id: 'loc_8', name: 'Пещера троллей', zone: 3, enemyThemes: ['tank', 'heal'],
    orderX: 1, icon: '🪨',
    mapX: 18, mapY: 50, mapUnit: 'percent',
    maxStars: 3, maxUnits: 6,
    pos: { row: 8, col: 0 },
    requires: ['boss_z2'], requiresAny: false,
    enemies: ['troll', 'troll_chief', 'orc'], enemyCount: [2, 4], enemyBudget: [7, 11],
    rewards: { coins: [180, 240], weaponChance: 0.30, scrollChance: 0.25, scrollType: 'silver' },
    isBoss: false,
    desc: 'Глубокая пещера, заполненная троллями и орками. Они восстанавливают HP!',
    zoneLabel: 'Зона 3: Тёмное подземелье',
  },

  {
    id: 'loc_9', name: 'Логово нежити', zone: 3, enemyThemes: ['undead', 'magic'],
    orderX: 2, icon: '💀',
    mapX: 42, mapY: 38, mapUnit: 'percent',
    maxStars: 4, maxUnits: 6,
    pos: { row: 8, col: 2 },
    requires: ['boss_z2'], requiresAny: false,
    enemies: ['dark_knight', 'skeleton', 'necromancer_acolyte'], enemyCount: [2, 4], enemyBudget: [8, 12],
    rewards: { coins: [200, 260], weaponChance: 0.35, scrollChance: 0.25, scrollType: 'gold' },
    isBoss: false,
    desc: 'Обитель тёмных рыцарей и послушников некроманта. Высокая магическая опасность.',
    zoneLabel: 'Зона 3: Тёмное подземелье',
  },

  {
    id: 'loc_10', name: 'Крепость орков', zone: 3, enemyThemes: ['melee', 'tank'],
    orderX: 3, icon: '🏰',
    mapX: 62, mapY: 56, mapUnit: 'percent',
    maxStars: 4, maxUnits: 6,
    pos: { row: 9, col: 1 },
    requires: ['loc_8', 'loc_9'], requiresAny: true,
    enemies: ['orc', 'orc_shaman', 'stone_golem', 'dark_knight'], enemyCount: [3, 5], enemyBudget: [10, 15],
    rewards: { coins: [230, 300], weaponChance: 0.40, scrollChance: 0.30, scrollType: 'gold' },
    isBoss: false,
    desc: 'Укреплённая крепость орков с магами и каменными големами на страже.',
    zoneLabel: 'Зона 3: Тёмное подземелье',
  },

  {
    id: 'boss_z3', name: 'Командир крепости', zone: 3, enemyThemes: ['boss', 'melee'],
    orderX: 4, icon: '⚔️',
    mapX: 86, mapY: 44, mapUnit: 'percent',
    maxStars: 4, maxUnits: 6,
    pos: { row: 10, col: 1 },
    requires: ['loc_10'], requiresAny: false,
    enemies: ['fortress_commander', 'dark_knight', 'orc_shaman'], enemyCount: [1, 1], enemyBudget: [99, 99],
    rewards: {
      coins: [450, 550], weaponChance: 1.0, scrollChance: 1.0, scrollType: 'gold',
      artifact: 'fortress_banner',
    },
    isBoss: true,
    desc: 'Элитный командир орков — ветеран сотни битв. Переходит в ярость при потере половины HP.',
    zoneLabel: 'Зона 3: Босс',
  },

  // ════════════════════════════════════════════════════════════
  // ЗОНА 4 — Тёмный мир (rows 11-12)
  // ════════════════════════════════════════════════════════════

  {
    id: 'loc_11', name: 'Тёмный лес', zone: 4, enemyThemes: ['undead', 'evasion'],
    orderX: 1, icon: '🌑',
    mapX: 40, mapY: 90, mapUnit: 'percent',
    maxStars: 4, maxUnits: 6,
    pos: { row: 11, col: 0 },
    requires: ['boss_z3'], requiresAny: false,
    enemies: ['vampire', 'ghost', 'death_knight'], enemyCount: [3, 5], enemyBudget: [12, 18],
    rewards: { coins: [280, 360], weaponChance: 0.45, scrollChance: 0.35, scrollType: 'gold' },
    isBoss: false,
    desc: 'Проклятый лес, где не бывает дня. Вампиры и рыцари смерти рыщут в темноте.',
    zoneLabel: 'Зона 4: Тёмный мир',
  },

  {
    id: 'loc_12', name: 'Замок некроманта', zone: 4, enemyThemes: ['magic', 'summon'],
    orderX: 2, icon: '🏯',
    mapX: 60, mapY: 70, mapUnit: 'percent',
    maxStars: 5, maxUnits: 6,
    pos: { row: 11, col: 2 },
    requires: ['boss_z3'], requiresAny: false,
    enemies: ['lich', 'necromancer_acolyte', 'death_knight'], enemyCount: [3, 5], enemyBudget: [15, 20],
    rewards: { coins: [300, 400], weaponChance: 0.50, scrollChance: 0.40, scrollType: 'gold' },
    isBoss: false,
    desc: 'Цитадель тьмы, где личи и аколиты некроманта охраняют последний рубеж.',
    zoneLabel: 'Зона 4: Тёмный мир',
  },

  {
    id: 'loc_gateway', name: 'Тронный зал', zone: 4, enemyThemes: ['boss', 'magic'],
    orderX: 3, icon: '👑',
    mapX: 76, mapY: 52, mapUnit: 'percent',
    maxStars: 5, maxUnits: 6,
    pos: { row: 12, col: 1 },
    requires: ['loc_11', 'loc_12'], requiresAny: true,
    enemies: ['lich', 'vampire', 'death_knight', 'necromancer_acolyte'], enemyCount: [3, 5], enemyBudget: [18, 25],
    rewards: { coins: [350, 480], weaponChance: 0.60, scrollChance: 0.50, scrollType: 'gold' },
    isBoss: false,
    desc: 'Предпокой некроманта. Последний бой перед финальным испытанием.',
    zoneLabel: 'Зона 4: Тёмный мир',
  },

  // ════════════════════════════════════════════════════════════
  // ЗОНА 5 — Финальный босс (row 13)
  // ════════════════════════════════════════════════════════════

  {
    id: 'boss_final', name: 'Некромант Морт', zone: 5, enemyThemes: ['boss', 'summon'],
    orderX: 1, icon: '☠️',
    mapX: 50, mapY: 46, mapUnit: 'percent',
    maxStars: 5, maxUnits: 6,
    pos: { row: 13, col: 1 },
    requires: ['loc_gateway'], requiresAny: false,
    enemies: ['necromancer', 'lich', 'death_knight'], enemyCount: [1, 1], enemyBudget: [99, 99],
    rewards: {
      coins: [800, 1000], weaponChance: 1.0, scrollChance: 1.0, scrollType: 'gold',
      artifact: 'necromancer_staff',
    },
    isBoss: true,
    desc: 'Могущественный некромант, повелитель смерти. Финальное испытание.',
    zoneLabel: 'Зона 5: Финальный Боссс',
  },
];

// ── Вспомогательные функции ────────────────────────────────────

function getLocation(id) {
  return LOCATIONS.find(l => l.id === id) || null;
}

function getAvailableLocations(completedIds) {
  return LOCATIONS.filter(loc => {
    if (!loc.requires.length) return true;
    if (loc.requiresAny) return loc.requires.some(r => completedIds.includes(r));
    return loc.requires.every(r => completedIds.includes(r));
  });
}

// Zone metadata for styling
const ZONE_META = {
  1: { label: 'Зона 1',  color: '#1a4a1a', borderColor: '#3a8a3a', icon: '🌲' },
  2: { label: 'Зона 2',  color: '#2a2a1a', borderColor: '#7a7a3a', icon: '🏚️' },
  3: { label: 'Зона 3',  color: '#1a1a2a', borderColor: '#5a3a8a', icon: '⛏️' },
  4: { label: 'Зона 4',  color: '#2a0a0a', borderColor: '#8a2a4a', icon: '💀' },
  5: { label: 'Зона 5',  color: '#1a0018', borderColor: '#9a00aa', icon: '☠️' },
};

// ── Temple bonus aggregator ────────────────────────────────────
function getTempleBonus() {
  if (typeof GameState === 'undefined') return {};
  const collected = GameState.getArtifacts ? GameState.getArtifacts() : [];
  const bonus = {};
  collected.forEach(id => {
    const art = ARTIFACTS[id];
    if (!art || !art.bonus) return;
    Object.entries(art.bonus).forEach(([stat, val]) => {
      bonus[stat] = (bonus[stat] || 0) + val;
    });
  });
  return bonus;
}

// Artifact descriptions
const ARTIFACTS = {
  warlord_pauldron: {
    id: 'warlord_pauldron', name: 'Наплечник Атамана', icon: '🏅',
    from: 'Атаман Кровавый Кулак',
    desc: 'Тяжёлый наплечник лесного атамана. Дарует +8 к ближней защите.',
    bonus: { meleeDef: 8 },
    bonuses: ['+8 Ближн. защита'],
  },
  temple_rune: {
    id: 'temple_rune', name: 'Руна Стража', icon: '🔮',
    from: 'Страж Храма',
    desc: 'Древняя руна каменного стража. +10 к защите от магии.',
    bonus: { magicDef: 10 },
    bonuses: ['+10 Маг. защита'],
  },
  fortress_banner: {
    id: 'fortress_banner', name: 'Знамя Крепости', icon: '🚩',
    from: 'Командир Крепости',
    desc: 'Боевое знамя орочьей крепости. +12 к ближней атаке.',
    bonus: { meleeAtk: 12 },
    bonuses: ['+12 Ближн. атака'],
  },
  necromancer_staff: {
    id: 'necromancer_staff', name: 'Посох Некроманта', icon: '🪄',
    from: 'Некромант Морт',
    desc: 'Тёмный посох повелителя смерти. +15 магии, +30 HP, +8 к атаке.',
    bonus: { hp: 30, meleeAtk: 8, magic: 15 },
    bonuses: ['+30 HP', '+8 Ближн. атака', '+15 Магия'],
  },
  hero_crown: {
    id: 'hero_crown', name: 'Корона Героя', icon: '👑',
    from: 'Легендарный подвиг',
    desc: 'Золотая корона, венчающая истинного героя. Даёт +20 ко всем атакам.',
    bonus: { meleeAtk: 20, rangeAtk: 20, magic: 20 },
    bonuses: ['+20 Ближн. атака', '+20 Дальн. атака', '+20 Магия'],
  },
};
