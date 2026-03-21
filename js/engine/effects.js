// ================================================================
// EFFECTS ENGINE — Status effects: poison, burn, stun, bleed, etc.
// ================================================================

const Effects = (() => {

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

        case 'poison':
          unit.stats.hp -= eff.value;
          messages.push({ type: 'effect', text: `${unit.name} получает ${eff.value} урона от яда 🐍` });
          break;

        case 'burn':
          unit.stats.hp -= eff.value;
          messages.push({ type: 'effect', text: `${unit.name} горит — ${eff.value} урона 🔥` });
          break;

        case 'bleed':
          unit.stats.hp -= eff.value;
          messages.push({ type: 'effect', text: `${unit.name} истекает кровью — ${eff.value} урона 💉` });
          break;

        case 'regen':
          const healed = Math.min(eff.value, unit.stats.maxHp - unit.stats.hp);
          unit.stats.hp += healed;
          if (healed > 0)
            messages.push({ type: 'heal', text: `${unit.name} восстанавливает ${healed} HP ✨` });
          break;

        case 'stun':
          // Stun is checked in battle.js before unit acts
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
