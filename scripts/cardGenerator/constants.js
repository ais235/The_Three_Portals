'use strict';

/** Архетип карты → ветка в generateAbilities */
const ARCHETYPES = [
  'tank',
  'burst_dps',
  'sustained_dps',
  'mage_aoe',
  'control',
  'healer',
  'summoner',
  'poison',
  'assassin',
  'buffer',
];

/** Множители по расе (применяются к базовым статам роли) */
const RACE_MOD = {
  human: { initiative: 1.1 },
  elf: { rangeAtk: 1.2, initiative: 1.2 },
  orc: { atk: 1.25, hp: 1.1 },
  undead: { hp: 1.3, magicDef: 0.8 },
  beast: { atk: 1.15, initiative: 1.1 },
};

/** Базовый шаблон по боевой роли (упрощённые статы генератора) */
const ROLE_BASE = {
  tank: { hp: 120, atk: 10, def: 15 },
  dps: { hp: 70, atk: 20, def: 8 },
  mage: { hp: 60, magic: 25 },
  healer: { hp: 65, magic: 18 },
  support: { hp: 70 },
};

const RACES = ['human', 'elf', 'orc', 'undead', 'beast'];
const ROLES = ['tank', 'dps', 'mage', 'healer', 'support'];

module.exports = {
  ARCHETYPES,
  RACE_MOD,
  ROLE_BASE,
  RACES,
  ROLES,
};
