'use strict';

const { ARCHETYPES, RACE_MOD, ROLE_BASE, RACES, ROLES } = require('./constants');
const { rand, pick, generateId } = require('./utils');
const { generateAbilities } = require('./abilities');
const { balanceCard, totalPower } = require('./balance');

function generateCard() {
  const race = pick(RACES);
  const role = pick(ROLES);
  const archetype = pick(ARCHETYPES);

  const stats = { ...ROLE_BASE[role] };

  const mod = RACE_MOD[race];
  for (const k of Object.keys(mod)) {
    stats[k] = Math.round((stats[k] || 10) * mod[k]);
  }

  for (const k of Object.keys(stats)) {
    stats[k] += rand(-5, 5);
  }

  return {
    id: generateId(),
    race,
    role,
    stats,
    archetype,
    abilities: generateAbilities(archetype),
  };
}

/**
 * @param {number} count
 * @param {{ targetBase?: number, targetJitter?: number }} [opts]
 */
function generateCardBatch(count, opts = {}) {
  const targetBase = opts.targetBase ?? 120;
  const targetJitter = opts.targetJitter ?? 10;
  const cards = [];

  for (let i = 0; i < count; i++) {
    let card = generateCard();
    const target = targetBase + rand(-targetJitter, targetJitter);
    card = balanceCard(card, target);
    card.power = totalPower(card);
    cards.push(card);
  }

  return cards;
}

module.exports = {
  generateCard,
  generateCardBatch,
  ARCHETYPES,
};
