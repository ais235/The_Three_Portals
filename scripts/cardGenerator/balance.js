'use strict';

/** Взвешенная «стоимость» базовых статов карты */
function calcPower(stats) {
  return (
    (stats.hp || 0) * 0.35 +
    (stats.atk || 0) * 3 +
    (stats.def || 0) * 1.5 +
    (stats.rangeAtk || 0) * 3.2 +
    (stats.magic || 0) * 3.5 +
    (stats.magicDef || 0) * 1.2 +
    (stats.initiative || 0) * 4
  );
}

function abilityPower(ability) {
  switch (ability.type) {
    case 'damage':
      return ability.value * 2;
    case 'heal':
      return ability.value * 1.5;
    case 'dot':
      return ability.damagePerTurn * ability.duration * 1.8;
    case 'stun':
      return 25 * ability.duration;
    case 'summon':
      return ability.summonPower != null ? ability.summonPower : 40;
    case 'crit':
      return (ability.value || 0) * 55;
    case 'debuff':
      return Math.abs(ability.value || 0) * 28;
    case 'buff':
      return (ability.value || 0) * 38;
    case 'slow':
      return (ability.value || 0) * 32;
    default:
      return 10;
  }
}

function totalPower(card) {
  const statsPower = calcPower(card.stats);
  const abilitiesPower = card.abilities.reduce((s, a) => s + abilityPower(a), 0);
  return statsPower + abilitiesPower;
}

function nerfAbility(a, factor) {
  if (a.type === 'summon') {
    if (a.summonPower == null) a.summonPower = 40;
    a.summonPower = Math.max(1, a.summonPower * factor);
    return;
  }
  if (typeof a.value === 'number') {
    if (a.type === 'crit') {
      a.value = Math.max(0.01, a.value * factor);
    } else if (a.type === 'debuff') {
      a.value *= factor;
    } else {
      a.value = Math.max(0, a.value * factor);
    }
  }
  if (typeof a.damagePerTurn === 'number') {
    a.damagePerTurn = Math.max(0.5, a.damagePerTurn * factor);
  }
  if (typeof a.duration === 'number' && (a.type === 'stun' || a.type === 'dot')) {
    a.duration = Math.max(1, a.duration * factor);
  }
}

/**
 * Снижает силу карты до целевого порога (итерации как в ТЗ, но с учётом магов и способностей).
 */
function balanceCard(card, targetPower = 120) {
  let power = totalPower(card);
  let safety = 0;
  const factor = 0.95;

  while (power > targetPower && safety++ < 2500) {
    for (const key of Object.keys(card.stats)) {
      const v = card.stats[key];
      if (typeof v === 'number' && v > 0) card.stats[key] = v * factor;
    }
    for (const ab of card.abilities) {
      nerfAbility(ab, factor);
    }
    power = totalPower(card);
  }

  for (const key of Object.keys(card.stats)) {
    const v = card.stats[key];
    if (typeof v === 'number') card.stats[key] = Math.max(0, Math.round(v));
  }

  return card;
}

module.exports = {
  calcPower,
  abilityPower,
  totalPower,
  balanceCard,
};
