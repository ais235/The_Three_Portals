// ================================================================
// BATTLE UNITS — Test scenario data
// Тестовый сценарий: 4 союзника vs 3 зверя (Зона 1)
// ================================================================

// Uses calcStat / calcInitiative from cards_and_weapons.js (loaded first)

function createUnit(template, side, col, row, stars = 1, level = 1) {
  const b = template.base;
  const stats = {
    hp:       calcStat(b.hp       || 0, stars, level),
    maxHp:    calcStat(b.hp       || 0, stars, level),
    meleeAtk: calcStat(b.meleeAtk || 0, stars, level),
    meleeDef: calcStat(b.meleeDef || 0, stars, level),
    rangeAtk: calcStat(b.rangeAtk || 0, stars, level),
    rangeDef: calcStat(b.rangeDef || 0, stars, level),
    magic:    calcStat(b.magic    || 0, stars, level),
    magicDef: calcStat(b.magicDef || 0, stars, level),
    mana:     b.mana     ? calcStat(b.mana,     stars, level) : 0,
    maxMana:  b.mana     ? calcStat(b.mana,     stars, level) : 0,
    manaRegen: b.manaRegen || 0,
    initiative: calcInitiative(b.initiative, stars, level),
  };

  return {
    ...template,
    instanceId: `${template.id}_${side}_c${col}_r${row}`,
    side,
    column: col,
    row,
    stars,
    level,
    stats,
    statusEffects: [],  // { type, duration, value, ... }
    isAlive: true,
    abilityCooldowns: {},  // abilityId -> turnsRemaining
    hasActedThisTurn: false,
  };
}

// ── Templates ─────────────────────────────────────────────────

const T_STRAZNIK = {
  id: 'straznik', name: 'Стражник', icon: '🛡️',
  class: 'tank', race: 'human',
  base: { hp:65, meleeAtk:11, meleeDef:11, rangeDef:7, magicDef:5, initiative:4 },
  attackColumns: [1],
  attackType: 'melee',
  abilities: [
    { id:'guard_weak',  name:'Защита слабых',  type:'passive', unlockedAt:1,
      desc:'Союзник в кол.2 с HP < 30% → −20% входящего урона.' },
    { id:'shield_wall', name:'Щитовой строй',  type:'passive', unlockedAt:2,
      desc:'Рядом с танком — оба −15% урона.' },
  ],
};

const T_KOPEYSHIK = {
  id: 'kopeyshik', name: 'Копейщик', icon: '🗡️',
  class: 'spearman', race: 'human',
  base: { hp:60, meleeAtk:12, meleeDef:10, rangeDef:8, magicDef:5, initiative:4 },
  attackColumns: [1, 2],   // КЛЮЧЕВАЯ МЕХАНИКА
  attackType: 'melee',
  abilities: [
    { id:'spear_reach', name:'Досягаемость копья', type:'passive', unlockedAt:1,
      desc:'Атакует кол.1 и кол.2 врагов.' },
    { id:'spear_row',   name:'Копейный ряд',       type:'passive', unlockedAt:2,
      desc:'Рядом с копейщиком — оба +20% урона.' },
  ],
};

const T_LUCHNIK = {
  id: 'luchnik', name: 'Лучник-новичок', icon: '🏹',
  class: 'archer', race: 'human',
  base: { hp:45, meleeAtk:5, meleeDef:5, rangeAtk:14, rangeDef:4, magicDef:4, initiative:6 },
  attackType: 'ranged',
  attackColumns: [1, 2],
  rangeModifiers: { 1:1.0, 2:0.75, 3:0.5 },
  attackMode: { shots: 2 },
  abilities: [
    { id:'double_shot',  name:'Двойной выстрел', type:'passive', unlockedAt:1,
      desc:'2 выстрела за ход.' },
    { id:'precise_shot', name:'Точный выстрел',  type:'active',  unlockedAt:2,
      desc:'Раз в 3 хода — без штрафа дальности.', cooldown:3 },
  ],
};

const T_POSLUSHNIK = {
  id: 'poslushnik', name: 'Послушник света', icon: '✨',
  class: 'mage_healer', race: 'human',
  base: { hp:40, meleeAtk:4, meleeDef:4, magic:12, magicDef:8, mana:80, manaRegen:20, initiative:4 },
  attackType: 'magic',
  attackColumns: [1, 2, 3],
  abilities: [],
  spells: [
    { id:'light_arrow', name:'Светлая стрела', cost:12, target:'single_enemy',
      damage:{min:8, max:12}, area: { shape:'column', scope:'enemy' },
      desc:'Урон по всей колонке врагов, в которую вы кликнули.' },
    { id:'minor_heal',  name:'Малый лекарь',  cost:25, target:'lowest_hp_ally',
      heal:{min:20, max:30}, desc:'Лечит союзника с наименьшим HP.' },
    { id:'blessing',    name:'Благословение', cost:35, target:'all_allies',
      heal:{min:15, max:20}, unlockedAt:2, desc:'Лечит всех союзников.' },
  ],
};

// ── Enemy templates ────────────────────────────────────────────

const T_RAT = {
  id: 'rat', name: 'Крыса', icon: '🐀',
  class: 'beast', race: 'beast', type: 'beast',
  base: { hp:25, meleeAtk:8, meleeDef:3, rangeDef:2, magicDef:1, initiative:6 },
  attackColumns: [1],
  attackType: 'melee',
  ai: 'attack_lowest_hp',
  abilities: [],
};

const T_SPIDER = {
  id: 'spider', name: 'Паук', icon: '🕷️',
  class: 'beast', race: 'beast', type: 'beast',
  base: { hp:30, meleeAtk:7, meleeDef:4, rangeDef:3, magicDef:2, initiative:5 },
  attackColumns: [1],
  attackType: 'melee',
  ai: 'attack_lowest_hp',
  abilities: [
    { id:'poison_bite', name:'Ядовитый укус', type:'on_hit',
      desc:'20% шанс яда: 3 урона/ход × 3 хода.', chance:0.20, poisonDmg:3, poisonDuration:3 },
  ],
};

const T_SNAKE = {
  id: 'snake', name: 'Змея', icon: '🐍',
  class: 'beast', race: 'beast', type: 'beast',
  base: { hp:28, meleeAtk:9, meleeDef:2, rangeDef:2, magicDef:1, initiative:7 },
  attackColumns: [1],
  attackType: 'melee',
  ai: 'attack_front_first',
  abilities: [
    { id:'dodge', name:'Уклонение', type:'passive',
      desc:'15% шанс избежать атаки.', dodgeChance:0.15 },
  ],
};

// ── CLASS → battle mappings ────────────────────────────────────
const CLASS_ATTACK_COLS = {
  tank:        [1],
  spearman:    [1, 2],
  damage:      [1],
  archer:      [1, 2],
  crossbowman: [1, 2, 3],
  mage_aoe:    [1, 2, 3],
  mage_single: [1, 2, 3],
  mage_healer: [1, 2, 3],
  mage_buffer: [1, 2, 3],
  mage_debuff: [1, 2, 3],
};

// ── Create a battle unit from an ALLIES entry + GameState ───────
function createBattleAlly(allyId, col, row) {
  const ally = ALLIES.find(a => a.id === allyId);
  if (!ally) return null;

  const lvl = (typeof GameState !== 'undefined' && GameState.getCardLevel(allyId))
    || { stars: ally.starRange[0], powerLevel: 1 };
  const { stars, powerLevel } = lvl;
  const b = ally.base;
  const cls = CLASSES[ally.class] || {};

  const stats = {
    hp:        calcStat(b.hp        || 0, stars, powerLevel),
    maxHp:     calcStat(b.hp        || 0, stars, powerLevel),
    meleeAtk:  calcStat(b.meleeAtk  || 0, stars, powerLevel),
    meleeDef:  calcStat(b.meleeDef  || 0, stars, powerLevel),
    rangeAtk:  calcStat(b.rangeAtk  || 0, stars, powerLevel),
    rangeDef:  calcStat(b.rangeDef  || 0, stars, powerLevel),
    magic:     calcStat(b.magic     || 0, stars, powerLevel),
    magicDef:  calcStat(b.magicDef  || 0, stars, powerLevel),
    mana:      b.mana     ? calcStat(b.mana,     stars, powerLevel) : 0,
    maxMana:   b.mana     ? calcStat(b.mana,     stars, powerLevel) : 0,
    manaRegen: b.manaRegen || 0,
    initiative: calcInitiative(b.initiative, stars, powerLevel),
  };

  // Apply equipped weapon bonuses
  if (typeof GameState !== 'undefined') {
    const weaponId = GameState.getEquipped(allyId);
    if (weaponId) {
      const weapon = (typeof WEAPONS !== 'undefined') && WEAPONS.find(w => w.id === weaponId);
      if (weapon && weapon.bonuses) {
        for (const [stat, val] of Object.entries(weapon.bonuses)) {
          if (stats[stat] !== undefined) stats[stat] += val;
          if (stat === 'hp') stats.maxHp += val;
        }
      }
    }
  }

  // Apply temple (artifact) bonuses
  if (typeof getTempleBonus === 'function') {
    const temple = getTempleBonus();
    for (const [stat, val] of Object.entries(temple)) {
      if (stats[stat] !== undefined) {
        stats[stat] += val;
        if (stat === 'hp') stats.maxHp += val;
      }
    }
  }

  return {
    id:          allyId,
    name:        ally.name,
    icon:        ally.icon,
    class:       ally.class,
    race:        ally.race,
    instanceId:  `${allyId}_ally_c${col}_r${row}`,
    side:        'ally',
    column:      col,
    row,
    stars,
    powerLevel,
    stats,
    statusEffects:    [],
    isAlive:          true,
    abilityCooldowns: {},
    hasActedThisTurn: false,
    attackColumns:    CLASS_ATTACK_COLS[ally.class] || [1],
    attackType:       cls.attackType || 'melee',
    rangeModifiers:   ally.rangeModifiers || null,
    attackMode:       ally.attackMode || null,
    abilities:        ally.abilities || [],
    spells:           ally.spells || [],
  };
}

// ── Create a battle unit from ENEMY_TEMPLATES ────────────────────
function createBattleEnemy(templateId, col, row, stars = 1, level = 1) {
  const tmpl = (typeof ENEMY_TEMPLATES !== 'undefined') && ENEMY_TEMPLATES[templateId];
  if (!tmpl) return null;

  const b = tmpl.base;
  const stats = {
    hp:        calcStat(b.hp        || 0, stars, level),
    maxHp:     calcStat(b.hp        || 0, stars, level),
    meleeAtk:  calcStat(b.meleeAtk  || 0, stars, level),
    meleeDef:  calcStat(b.meleeDef  || 0, stars, level),
    rangeAtk:  calcStat(b.rangeAtk  || 0, stars, level),
    rangeDef:  calcStat(b.rangeDef  || 0, stars, level),
    magic:     calcStat(b.magic     || 0, stars, level),
    magicDef:  calcStat(b.magicDef  || 0, stars, level),
    mana:      b.mana     ? calcStat(b.mana,     stars, level) : 0,
    maxMana:   b.mana     ? calcStat(b.mana,     stars, level) : 0,
    manaRegen: b.manaRegen || 0,
    initiative: calcInitiative(b.initiative, stars, level),
  };

  return {
    ...tmpl,
    instanceId:       `${templateId}_enemy_c${col}_r${row}_${Math.random().toString(36).slice(2,5)}`,
    side:             'enemy',
    column:           col,
    row,
    stars,
    level,
    stats,
    statusEffects:    [],
    isAlive:          true,
    abilityCooldowns: {},
    hasActedThisTurn: false,
  };
}

// ── Debug: оценка силы юнита (не влияет на бой) ─────────────────
function calculateUnitPower(unit) {
  const s = unit.stats || {};
  const atk = (s.meleeAtk || 0) + (s.rangeAtk || 0) + (s.magic || 0);
  const def = (s.meleeDef || 0) + (s.rangeDef || 0) + (s.magicDef || 0);

  const basePower =
    0.35 * (s.maxHp || 0) +
    3.0 * atk +
    0.8 * def +
    6 * (unit.initiative || s.initiative || 0);

  const roleModifiers = {
    tank: 0.9,
    bruiser: 1.0,
    assassin: 1.1,
    archer: 1.1,
    mage: 1.15,
    healer: 0.85,
    control: 1.1,
    boss: 1.2,
  };
  const roleMod = roleModifiers[unit.role] || 1.0;

  let abilityMod = 1.0;
  if (unit.spells) {
    if (unit.spells.some(spl => spl.type === 'heal')) abilityMod += 0.15;
    if (unit.spells.some(spl => spl.type === 'poison')) abilityMod += 0.15;
    if (unit.spells.some(spl => ['stun', 'freeze', 'disable'].includes(spl.type))) abilityMod += 0.2;
  }

  if ((unit.attackColumns || []).length >= 2) abilityMod += 0.1;
  if ((s.rangeAtk || 0) > 0 || (s.magic || 0) > 0) abilityMod += 0.1;

  return Math.round(basePower * roleMod * abilityMod);
}

// Gate noisy debug logs from balancing simulation.
const BALANCE_DEBUG = false;

function calculateEnemyPower(unit) {
  return calculateUnitPower(unit);
}

function calculateGroupPower(units) {
  if (!units || !units.length) return 0;

  const sum = units.reduce((acc, u) => acc + calculateUnitPower(u), 0);
  const countMod = 1 + (units.length - 1) * 0.12;
  const result = Math.round(sum * countMod);

  if (BALANCE_DEBUG) {
    console.log('[GROUP POWER]', {
      units: units.map(u => u.id),
      power: result,
    });
  }

  return result;
}

// ── Размещение врагов из одного encounter (без синергий на массиве) ──
function buildEncounterPlacedUnits(encounter, stars, level) {
  const units = [];
  const colCount = { 1: 0, 2: 0, 3: 0 };

  (encounter.enemies || []).forEach(templateId => {
    const tmpl = ENEMY_TEMPLATES && ENEMY_TEMPLATES[templateId];
    if (!tmpl) return;

    const at = tmpl.attackType || 'melee';
    const col = at === 'ranged' ? 2 : (at === 'magic' ? 3 : 1);
    if ((colCount[col] || 0) >= 3) return; // strict line limit: 3 units per column

    const row = (colCount[col] || 0) + 1;
    colCount[col] = row;
    const e = createBattleEnemy(templateId, col, row, stars, level);
    if (e) units.push(e);
  });

  return units;
}

/** Сила группы после синергий (копии юнитов, основной бой не трогаем). */
function estimateEncounterPowerAfterSynergies(encounter, stars, level) {
  const raw = buildEncounterPlacedUnits(encounter, stars, level);
  const probe = raw.map(u => ({ ...u, stats: { ...u.stats } }));
  applyEnemySynergies(probe);
  return calculateGroupPower(probe);
}

// ── Analytics: real enemy power by encounter combinations (no scaling) ────
function getLocationStarsAndLevel(location) {
  const zone = location?.zone ?? 1;
  const stars = Math.min(Math.max(zone - 1, 1), 5);
  const level = Math.max(1, (zone - 1) * 2);
  return { stars, level };
}

function analyzeRealEnemyPowerForLocation(location) {
  const encounters = Array.isArray(location?.encounters) ? location.encounters : [];
  const { stars, level } = getLocationStarsAndLevel(location);

  // If no encounters have explicit `weight` → treat all as equally likely.
  // Otherwise use provided weights; encounters without `weight` default to `1`.
  const hasAnyWeight = encounters.some(enc => typeof enc?.weight === 'number' && Number.isFinite(enc.weight));
  const rawWeights = encounters.map(enc => {
    if (!hasAnyWeight) return 1;
    const w = (typeof enc?.weight === 'number' && Number.isFinite(enc.weight)) ? enc.weight : 1;
    return Math.max(0, w);
  });

  const sumW = rawWeights.reduce((a, b) => a + b, 0);
  const chances = encounters.map((_, i) => {
    if (!encounters.length) return 0;
    if (!sumW || sumW <= 0) return 1 / encounters.length;
    return rawWeights[i] / sumW;
  });

  const scored = encounters.map((enc, i) => {
    const power = estimateEncounterPowerAfterSynergies(enc, stars, level);
    return { id: enc?.id, power, chance: chances[i] };
  });

  const powers = scored.map(x => x.power);
  const min = powers.length ? Math.min(...powers) : 0;
  const max = powers.length ? Math.max(...powers) : 0;
  const avg = scored.reduce((acc, x) => acc + (x.power * x.chance), 0);

  return {
    location: location?.id,
    encounters: scored.map(x => ({ id: x.id, power: x.power, chance: x.chance })),
    enemies: { min, avg, max },
  };
}

function analyzePlayerPowerRange(location) {
  const maxUnits = location?.maxUnits ?? 1;
  const maxStars = location?.maxStars ?? 1;

  // MIN composition: weakest available cards at ★1, lvl1.
  const eligibleMin = ALLIES.filter(a => {
    const sr = a.starRange || [1, 1];
    return sr[0] <= 1 && 1 <= sr[1];
  });
  const minUnits = eligibleMin
    .map(a => createAllyForPowerSim(a.id, 1, 1))
    .filter(Boolean)
    .map(u => ({ u, p: calculateUnitPower(u) }))
    .sort((a, b) => a.p - b.p)
    .slice(0, Math.min(maxUnits, eligibleMin.length))
    .map(x => x.u);

  const min = minUnits.length ? calculateGroupPower(minUnits) : 0;

  // MAX composition: strongest eligible cards at stars=maxStars, level=stars*10.
  const levelMax = maxStars * 10;
  const eligibleMax = ALLIES.filter(a => {
    const sr = a.starRange || [1, 1];
    return sr[0] <= maxStars && maxStars <= sr[1];
  });
  const maxUnitsList = eligibleMax
    .map(a => createAllyForPowerSim(a.id, maxStars, levelMax))
    .filter(Boolean)
    .map(u => ({ u, p: calculateUnitPower(u) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, Math.min(maxUnits, eligibleMax.length))
    .map(x => x.u);

  const max = maxUnitsList.length ? calculateGroupPower(maxUnitsList) : 0;
  const avg = (min + max) / 2;

  return { min, avg, max };
}

function evaluateDifficulty(playerRange, enemiesRange) {
  const p = playerRange || { min: 0, avg: 0, max: 0 };
  const e = enemiesRange || { min: 0, avg: 0, max: 0 };

  if (e.max > p.max * 1.3) return 'spike';
  if (p.min > e.max) return 'easy';
  if (p.max < e.min) return 'hard';

  const within20 = (p.avg > 0)
    ? (Math.abs(e.avg - p.avg) / p.avg) <= 0.20
    : (Math.abs(e.avg - p.avg) <= 0.20);
  if (within20) return 'normal';

  // Fallback: decide by average comparison.
  return (e.avg > p.avg) ? 'hard' : 'easy';
}

function estimateWinRate(playerRange, encounters) {
  const pAvg = playerRange?.avg ?? 0;
  const list = Array.isArray(encounters) ? encounters : [];
  if (!list.length) return 0;

  let win = 0;
  for (const enc of list) {
    const chance = enc?.chance ?? 0;
    const power = enc?.power ?? 0;
    if (pAvg >= power) win += chance;
  }
  return Math.max(0, Math.min(1, win));
}

function suggestFixes(locationAnalysis) {
  const verdict = locationAnalysis?.verdict;
  const suggestions = [];

  if (verdict === 'easy') {
    suggestions.push('Увеличить weight сильных encounter’ов.');
    suggestions.push('Или добавить +1 юнит врагам (увеличить состав encounter / maxUnits).');
  } else if (verdict === 'hard') {
    suggestions.push('Уменьшить weight сильных encounter’ов.');
    suggestions.push('Или убрать один юнит из сильных encounter’ов.');
    suggestions.push('Или ослабить base статы врагов (если это допустимо дизайном).');
  } else if (verdict === 'spike') {
    suggestions.push('Снизить max power у пиковых encounter’ов (состав/юниты/роли).');
    suggestions.push('Или уменьшить количество врагов в самых сильных encounter’ах.');
  }

  return suggestions;
}

function runFullBalanceAnalysis() {
  if (typeof LOCATIONS === 'undefined' || !Array.isArray(LOCATIONS)) return;
  if (typeof ALLIES === 'undefined' || !Array.isArray(ALLIES)) return;

  for (const location of LOCATIONS) {
    const player = analyzePlayerPowerRange(location);
    const enemyAnalysis = analyzeRealEnemyPowerForLocation(location);
    const enemies = enemyAnalysis.enemies;
    const verdict = evaluateDifficulty(player, enemies);
    const winRate = estimateWinRate(player, enemyAnalysis.encounters);
    const suggestions = suggestFixes({ verdict, player, enemies });

    console.log('[BALANCE REPORT]', {
      location: location.id,
      player: {
        min: player.min,
        avg: Math.round(player.avg * 100) / 100,
        max: player.max,
      },
      enemies: {
        min: enemies.min,
        avg: Math.round(enemies.avg * 100) / 100,
        max: enemies.max,
      },
      verdict,
      winChanceEstimate: Math.round(winRate * 1000) / 10,
      winRate: Math.round(winRate * 1000) / 10,
      suggestions,
    });
  }
}

function pickEncounterForLocation(location, stars, level) {
  const list = location.encounters;
  if (!list || !list.length) return null;

  const tp = location.targetPower;
  if (!tp || !Array.isArray(tp) || tp.length !== 2) {
    return list[Math.floor(Math.random() * list.length)];
  }

  const [minP, maxP] = tp;
  const scored = list.map(enc => ({
    enc,
    power: estimateEncounterPowerAfterSynergies(enc, stars, level),
  }));

  const inRange = scored.filter(x => x.power >= minP && x.power <= maxP);

  const distToBand = p => {
    if (p < minP) return minP - p;
    if (p > maxP) return p - maxP;
    return 0;
  };

  let chosen;
  if (inRange.length) {
    chosen = inRange[Math.floor(Math.random() * inRange.length)];
  } else {
    const bestD = Math.min(...scored.map(x => distToBand(x.power)));
    const ties = scored.filter(x => distToBand(x.power) === bestD);
    chosen = ties[Math.floor(Math.random() * ties.length)];
  }

  if (BALANCE_DEBUG) {
    console.log('[ENCOUNTER PICK]', {
      location: location.id,
      chosen: chosen.enc.id,
      power: chosen.power,
      target: location.targetPower,
      pickMode: inRange.length ? 'in_range' : 'nearest',
      rejected: scored
        .filter(x => x.enc.id !== chosen.enc.id)
        .map(x => ({ id: x.enc.id, power: x.power })),
    });
  }

  return chosen.enc;
}

// ── Enemy party synergies (applied once after spawn, by role) ───
function applyEnemySynergies(units) {
  if (!units || !units.length) return;

  const byRole = {};
  units.forEach(u => {
    if (!byRole[u.role]) byRole[u.role] = [];
    byRole[u.role].push(u);
  });

  // 1. SWARM
  if (byRole.swarm && byRole.swarm.length > 1) {
    byRole.swarm.forEach(u => {
      u.stats.meleeAtk += byRole.swarm.length - 1;
    });
  }

  // 2. TANK + BRUISER
  if (byRole.tank && byRole.bruiser) {
    byRole.bruiser.forEach(u => {
      u.stats.meleeAtk *= 1.2;
    });
  }

  // 3. CONTROL
  if (byRole.control) {
    units.forEach(u => {
      u.stats.initiative *= 1.1;
    });
  }

  // 4. BOSS
  if (byRole.boss) {
    units.forEach(u => {
      u.stats.meleeAtk *= 1.15;
      if (u.stats.rangeAtk) u.stats.rangeAtk *= 1.15;
      if (u.stats.magic) u.stats.magic *= 1.15;
    });
  }
}

// ── Balance table generation (min/max player power + targetPower) ─────────────
let BALANCE_TABLE_CACHE = null;

function getLocationDifficultyNote(location) {
  if (location?.isBoss) return 'hard';
  const zone = location?.zone ?? 1;
  if (zone <= 1) return 'training';
  if (zone === 2) return 'normal';
  return 'hard';
}

function getRecommendedEnemyCountRange(maxUnits) {
  if (maxUnits <= 2) return { baseMin: 1, baseMax: 2 }; // 70% base, 30% +1
  if (maxUnits === 3) return { baseMin: 2, baseMax: 3 };
  return { baseMin: 3, baseMax: 4 };
}

function sampleEnemyCountWithPlusOne(location) {
  const maxUnits = location?.maxUnits ?? 1;
  const { baseMin, baseMax } = getRecommendedEnemyCountRange(maxUnits);
  const base = baseMin + Math.floor(Math.random() * (baseMax - baseMin + 1));
  return Math.random() < 0.3 ? base + 1 : base;
}

function createAllyForPowerSim(allyId, stars, powerLevel, col = 1, row = 1) {
  const ally = (typeof ALLIES !== 'undefined') ? ALLIES.find(a => a.id === allyId) : null;
  if (!ally) return null;
  const b = ally.base || {};
  const cls = (typeof CLASSES !== 'undefined') ? (CLASSES[ally.class] || {}) : {};

  const stats = {
    hp:        calcStat(b.hp || 0, stars, powerLevel),
    maxHp:     calcStat(b.hp || 0, stars, powerLevel),
    meleeAtk:  calcStat(b.meleeAtk || 0, stars, powerLevel),
    meleeDef:  calcStat(b.meleeDef || 0, stars, powerLevel),
    rangeAtk:  calcStat(b.rangeAtk || 0, stars, powerLevel),
    rangeDef:  calcStat(b.rangeDef || 0, stars, powerLevel),
    magic:     calcStat(b.magic || 0, stars, powerLevel),
    magicDef:  calcStat(b.magicDef || 0, stars, powerLevel),
    mana:      b.mana ? calcStat(b.mana, stars, powerLevel) : 0,
    maxMana:   b.mana ? calcStat(b.mana, stars, powerLevel) : 0,
    manaRegen: b.manaRegen || 0,
    initiative: calcInitiative(b.initiative, stars, powerLevel),
  };

  return {
    id: allyId,
    name: ally.name,
    icon: ally.icon,
    class: ally.class,
    race: ally.race,
    instanceId: `${allyId}_sim_s${stars}_l${powerLevel}_${col}_${row}`,
    side: 'ally',
    column: col,
    row: row,
    stars,
    powerLevel,
    stats,
    statusEffects: [],
    isAlive: true,
    abilityCooldowns: {},
    hasActedThisTurn: false,
    attackColumns: CLASS_ATTACK_COLS[ally.class] || [1],
    attackType: cls.attackType || 'melee',
    rangeModifiers: ally.rangeModifiers || null,
    attackMode: ally.attackMode || null,
    abilities: ally.abilities || [],
    spells: ally.spells || [],
  };
}

function buildBalanceTableForAllLocations() {
  if (BALANCE_TABLE_CACHE) return BALANCE_TABLE_CACHE;

  if (typeof LOCATIONS === 'undefined' || !Array.isArray(LOCATIONS)) return [];

  const result = [];

  for (const location of LOCATIONS) {
    const maxUnits = location.maxUnits || 1;
    const maxStars = location.maxStars || 1;

    // Step 1.1 — minimum player (stars=1, level=1)
    const eligibleMin = ALLIES.filter(a => {
      const sr = a.starRange || [1, 1];
      return sr[0] <= 1 && 1 <= sr[1];
    });
    const minUnits = eligibleMin
      .map(a => createAllyForPowerSim(a.id, 1, 1))
      .filter(Boolean)
      .map(u => ({ u, p: calculateUnitPower(u) }))
      .sort((a, b) => a.p - b.p)
      .slice(0, Math.min(maxUnits, eligibleMin.length))
      .map(x => x.u);

    const minPlayerPower = minUnits.length ? calculateGroupPower(minUnits) : 0;

    // Step 1.2 — maximum player (stars=maxStars, level=stars*10)
    const levelMax = maxStars * 10;
    const eligibleMax = ALLIES.filter(a => {
      const sr = a.starRange || [1, 1];
      return sr[0] <= maxStars && maxStars <= sr[1];
    });
    const maxUnitsList = eligibleMax
      .map(a => createAllyForPowerSim(a.id, maxStars, levelMax))
      .filter(Boolean)
      .map(u => ({ u, p: calculateUnitPower(u) }))
      .sort((a, b) => b.p - a.p)
      .slice(0, Math.min(maxUnits, eligibleMax.length))
      .map(x => x.u);

    const maxPlayerPower = maxUnitsList.length ? calculateGroupPower(maxUnitsList) : 0;

    const midPlayerPower = (minPlayerPower + maxPlayerPower) / 2;

    // Step 2 — targetPower
    const targetPower = [
      Math.round(minPlayerPower * 1.1),
      Math.round(midPlayerPower * 1.05),
    ].sort((a, b) => a - b);

    // Step 3 — recommended enemies count range (base + possible +1)
    const { baseMin, baseMax } = getRecommendedEnemyCountRange(maxUnits);
    // Spec: recommendation shows base range (70%), while +1 is handled during actual spawn.
    const recommendedEnemies = `${baseMin}–${baseMax}`;
    const notes = getLocationDifficultyNote(location);

    // Mutate location for later battle scaling.
    location.minPlayerPower = minPlayerPower;
    location.maxPlayerPower = maxPlayerPower;
    location.midPlayerPower = midPlayerPower;
    location.targetPower = targetPower;
    location.recommendedEnemies = recommendedEnemies;
    location.notes = notes;

    result.push({
      location: location.id,
      maxStars,
      maxUnits,
      minPlayerPower,
      maxPlayerPower,
      targetPower,
      recommendedEnemies,
      notes,
    });
  }

  console.log('[BALANCE TABLE]', result);
  BALANCE_TABLE_CACHE = result;
  return result;
}

function applyEnemyStatScale(units, scale) {
  if (!units || !units.length) return;
  for (const unit of units) {
    if (!unit?.stats) continue;
    const s = unit.stats;

    // Spec: scale maxHp + all attack/def stats. Round after applying.
    s.maxHp = Math.round((s.maxHp || 0) * scale);
    s.hp = s.maxHp; // enemies spawn at full HP

    s.meleeAtk = Math.round((s.meleeAtk || 0) * scale);
    s.rangeAtk = Math.round((s.rangeAtk || 0) * scale);
    s.magic = Math.round((s.magic || 0) * scale);

    s.meleeDef = Math.round((s.meleeDef || 0) * scale);
    s.rangeDef = Math.round((s.rangeDef || 0) * scale);
    s.magicDef = Math.round((s.magicDef || 0) * scale);
  }
}

function normalizeEncounterToCount(encounter, location, desiredCount) {
  const pool = location.enemies || [];
  const enemies = (encounter.enemies || []).slice();

  while (enemies.length < desiredCount && pool.length) {
    enemies.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  if (enemies.length > desiredCount) enemies.splice(desiredCount);

  return {
    id: `${encounter.id}_c${desiredCount}`,
    enemies,
  };
}

// ── Generate enemies from a location definition ──────────────────
function generateLocationEnemies(location, playerUnits = null) {
  // Ensure we have per-location min/max, targetPower, midPlayerPower.
  if (!BALANCE_TABLE_CACHE) buildBalanceTableForAllLocations();

  const zone = location.zone || 1;
  const stars = Math.min(Math.max(zone - 1, 1), 5);
  const level = Math.max(1, (zone - 1) * 2);

  const desiredEnemyCount = sampleEnemyCountWithPlusOne(location);

  let enemies = [];
  let spawnEncounter = null;

  if (location.encounters && location.encounters.length) {
    const chosen = pickEncounterForLocation(location, stars, level);
    spawnEncounter = normalizeEncounterToCount(chosen, location, desiredEnemyCount);
    enemies = buildEncounterPlacedUnits(spawnEncounter, stars, level);
  } else {
    const pool = location.enemies || [];
    const templateIds = pool.length
      ? Array.from({ length: desiredEnemyCount }, () => pool[Math.floor(Math.random() * pool.length)])
      : [];

    const colCount = { 1: 0, 2: 0, 3: 0 };
    enemies = [];

    templateIds.forEach(templateId => {
      const tmpl = ENEMY_TEMPLATES && ENEMY_TEMPLATES[templateId];
      if (!tmpl) return;

      const at = tmpl.attackType || 'melee';
      const col = at === 'ranged' ? 2 : (at === 'magic' ? 3 : 1);
      if ((colCount[col] || 0) >= 3) return; // strict line limit: 3 units per column

      const row = (colCount[col] || 0) + 1;
      colCount[col] = row;
      const e = createBattleEnemy(templateId, col, row, stars, level);
      if (e) enemies.push(e);
    });

    spawnEncounter = { id: `generated_c${desiredEnemyCount}`, enemies: templateIds };
  }

  applyEnemySynergies(enemies);

  // Step 4 — auto scale to targetEncounterPower
  const baseEncounterPower = calculateGroupPower(enemies);
  const tp = location.targetPower || [baseEncounterPower, baseEncounterPower];
  const targetEncounterPower = Math.round(tp[0] + Math.random() * (tp[1] - tp[0]));

  let scale = baseEncounterPower > 0 ? (targetEncounterPower / baseEncounterPower) : 1;
  // Clamp to spec.
  scale = Math.max(0.85, Math.min(1.15, scale));

  applyEnemyStatScale(enemies, scale);

  const scaledPower = calculateGroupPower(enemies);

  console.log('[ENEMY SCALE]', {
    location: location.id,
    encounter: spawnEncounter?.id,
    basePower: baseEncounterPower,
    targetPower: targetEncounterPower,
    scaledPower,
    scale,
  });

  if (BALANCE_DEBUG) {
    console.log('[ENEMY POWER V2]', {
      location: location.id,
      enemies: enemies.map(e => e.id),
      unitCount: enemies.length,
      power: scaledPower,
    });
  }

  return enemies;
}

// ── Factory — create the default test battle ────────────────────

function createTestBattle() {
  const allies = [
    createUnit(T_STRAZNIK,  'ally', 1, 1, 1, 1),
    createUnit(T_KOPEYSHIK, 'ally', 1, 2, 1, 1),
    createUnit(T_LUCHNIK,   'ally', 2, 1, 1, 1),
    createUnit(T_POSLUSHNIK,'ally', 3, 1, 1, 1),
  ];

  const enemies = [
    createUnit(T_RAT,    'enemy', 1, 1, 1, 1),
    createUnit(T_SPIDER, 'enemy', 1, 2, 1, 1),
    createUnit(T_SNAKE,  'enemy', 1, 3, 1, 1),
  ];

  return { allies, enemies };
}

// Precompute balance table once (for targetPower + enemy scaling micro-correction).
try {
  buildBalanceTableForAllLocations();
} catch (e) {
  // If balancing simulation fails, the game can still proceed with existing targetPower.
}

// Optional debug analytics: real enemy power without scaling/targetPower.
try {
  runFullBalanceAnalysis();
} catch (e) {
  // Never break gameplay if analytics fails.
}
