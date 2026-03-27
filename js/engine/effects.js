// ================================================================
// EFFECTS ENGINE — Status effects: poison, burn, stun, bleed, etc.
// ================================================================

const Effects = (() => {

  function fmtTurnsAfterTick(remaining) {
    if (remaining <= 0) return 'эффект снимается';
    const n10 = remaining % 10;
    const n100 = remaining % 100;
    if (n10 === 1 && n100 !== 11) return `осталось ${remaining} ход`;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return `осталось ${remaining} хода`;
    return `осталось ${remaining} ходов`;
  }

  /** Для оглушения: сколько ходов действует, включая текущий пропуск. */
  function fmtStunRemaining(fullTurns) {
    if (fullTurns <= 0) return 'эффект снимается';
    const n10 = fullTurns % 10;
    const n100 = fullTurns % 100;
    if (n10 === 1 && n100 !== 11) return `под оглушением ещё ${fullTurns} ход`;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return `под оглушением ещё ${fullTurns} хода`;
    return `под оглушением ещё ${fullTurns} ходов`;
  }

  // Apply a new status effect to a unit
  function apply(unit, effectData) {
    // effectData: { type, duration, value, source }
    // Merge stacks for same type (take longest duration)
    const existing = unit.statusEffects.find(e => e.type === effectData.type);
    if (existing) {
      existing.duration = Math.max(existing.duration, effectData.duration);
      existing.value    = Math.max(existing.value || 0, effectData.value || 0);
    } else {
      unit.statusEffects.push({ ...effectData });
    }
  }

  // Process all active effects at start of unit's turn
  // Returns array of log messages
  function processTurnStart(unit) {
    const messages = [];
    if (!unit.isAlive) return messages;

    const toRemove = [];

    for (const eff of unit.statusEffects) {
      switch (eff.type) {

        case 'poison': {
          unit.stats.hp -= eff.value;
          const left = eff.duration - 1;
          messages.push({
            type: 'effect',
            text: `${unit.name} — яд: ${eff.value} урона (${fmtTurnsAfterTick(left)}) 🐍`,
          });
          break;
        }

        case 'burn': {
          unit.stats.hp -= eff.value;
          const leftB = eff.duration - 1;
          messages.push({
            type: 'effect',
            text: `${unit.name} — горение: ${eff.value} урона (${fmtTurnsAfterTick(leftB)}) 🔥`,
          });
          break;
        }

        case 'bleed': {
          unit.stats.hp -= eff.value;
          const leftBl = eff.duration - 1;
          messages.push({
            type: 'effect',
            text: `${unit.name} — кровотечение: ${eff.value} урона (${fmtTurnsAfterTick(leftBl)}) 💉`,
          });
          break;
        }

        case 'regen': {
          const healed = Math.min(eff.value, unit.stats.maxHp - unit.stats.hp);
          unit.stats.hp += healed;
          const leftR = eff.duration - 1;
          if (healed > 0) {
            messages.push({
              type: 'heal',
              text: `${unit.name} — регенерация: +${healed} HP (${fmtTurnsAfterTick(leftR)}) ✨`,
            });
          }
          break;
        }

        case 'stun':
          messages.push({
            type: 'effect',
            text: `${unit.name} — пропуск хода (${fmtStunRemaining(eff.duration)}) 💫`,
          });
          break;
      }

      eff.duration--;
      if (eff.duration <= 0) toRemove.push(eff);

      // Death check
      if (unit.stats.hp <= 0) {
        unit.stats.hp = 0;
        unit.isAlive = false;
        messages.push({ type: 'system', text: `${unit.name} погибает от ${eff.type}!` });
        break;
      }
    }

    unit.statusEffects = unit.statusEffects.filter(e => !toRemove.includes(e));
    return messages;
  }

  // Tick cooldowns at end of unit's turn
  function tickCooldowns(unit) {
    for (const key of Object.keys(unit.abilityCooldowns)) {
      unit.abilityCooldowns[key]--;
      if (unit.abilityCooldowns[key] <= 0)
        delete unit.abilityCooldowns[key];
    }
  }

  // Regen mana at start of turn
  function regenMana(unit) {
    if (!unit.stats.maxMana) return;
    const regen = Math.round(unit.stats.maxMana * (unit.stats.manaRegen / 100));
    unit.stats.mana = Math.min(unit.stats.maxMana, (unit.stats.mana || 0) + regen);
  }

  // Get icon for effect type
  function getIcon(type) {
    const icons = { poison:'🐍', burn:'🔥', bleed:'💉', stun:'💫', regen:'✨', slow:'🐢', curse:'💀', buff:'⬆️' };
    return icons[type] || '❓';
  }

  // Format effect for display
  function formatEffects(unit) {
    return unit.statusEffects.map(e => ({
      icon: getIcon(e.type),
      label: e.type,
      duration: e.duration,
    }));
  }

  return { apply, processTurnStart, tickCooldowns, regenMana, getIcon, formatEffects };
})();
