'use strict';

function damage(value) {
  return { type: 'damage', value };
}

function heal(value) {
  return { type: 'heal', value };
}

function dot(damagePerTurn, duration) {
  return { type: 'dot', damagePerTurn, duration };
}

function debuff(stat, delta) {
  return { type: 'debuff', stat, value: delta };
}

function summon(unit) {
  return { type: 'summon', unit };
}

function buff(stat, mult) {
  return { type: 'buff', stat, value: mult };
}

function stun(duration) {
  return { type: 'stun', duration };
}

function slow(amount) {
  return { type: 'slow', value: amount };
}

function crit(chance) {
  return { type: 'crit', value: chance };
}

/**
 * Набор способностей по архетипу (данные для power-оценки и последующей конвертации в игровой формат).
 */
function generateAbilities(archetype) {
  switch (archetype) {
    case 'poison':
      return [dot(5, 3), debuff('heal', -0.3)];

    case 'summoner':
      return [summon('skeleton'), buff('summons', 0.2)];

    case 'control':
      return [stun(1), slow(0.3)];

    case 'burst_dps':
      return [damage(30), crit(0.25)];

    case 'tank':
      return [buff('def', 0.2), damage(10)];

    case 'sustained_dps':
      return [damage(12), dot(3, 4)];

    case 'mage_aoe':
      return [damage(22), damage(8)];

    case 'healer':
      return [heal(28), buff('heal', 0.15)];

    case 'assassin':
      return [damage(24), crit(0.35)];

    case 'buffer':
      return [buff('atk', 0.15), buff('def', 0.12)];

    default:
      return [damage(15)];
  }
}

module.exports = {
  damage,
  heal,
  dot,
  debuff,
  summon,
  buff,
  stun,
  slow,
  crit,
  generateAbilities,
};
