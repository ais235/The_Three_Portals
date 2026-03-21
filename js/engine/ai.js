// ================================================================
// AI ENGINE — Enemy and auto-ally decision making
// ================================================================

const AI = (() => {

  // ── Target selection ───────────────────────────────────────────

  // Get available columns for an attacker
  function getAvailableColumns(attacker, targets) {
    const possibleCols = attacker.attackColumns || [1];
    const aliveTargetCols = new Set(targets.filter(t => t.isAlive).map(t => t.column));

    // Apply "empty column cascade": if col 1 empty, shift to col 2, etc.
    const avail = [];
    for (const col of possibleCols) {
      if (aliveTargetCols.has(col)) avail.push(col);
    }

    // If none of our designated columns has enemies, cascade forward
    if (avail.length === 0) {
      const allCols = [1, 2, 3];
      for (const col of allCols) {
        if (aliveTargetCols.has(col)) { avail.push(col); break; }
      }
    }

    return avail;
  }

  // Get valid targets for attacker
  function getValidTargets(attacker, enemySide) {
    const availCols = getAvailableColumns(attacker, enemySide);
    return enemySide.filter(t => t.isAlive && availCols.includes(t.column));
  }

  // Choose target based on AI strategy
  function chooseTarget(attacker, targets) {
    const strategy = attacker.ai || 'attack_lowest_hp';
    const valid = getValidTargets(attacker, targets);
    if (!valid.length) return null;

    switch (strategy) {
      case 'attack_lowest_hp':
        return valid.reduce((best, t) => t.stats.hp < best.stats.hp ? t : best);

      case 'attack_front_first': {
        const minCol = Math.min(...valid.map(t => t.column));
        const frontLine = valid.filter(t => t.column === minCol);
        return frontLine.reduce((best, t) => t.stats.hp < best.stats.hp ? t : best);
      }

      default:
        return valid[Math.floor(Math.random() * valid.length)];
    }
  }

  // ── Spell / ability selection ──────────────────────────────────

  // Decide what action a mage/support unit takes
  function chooseMageAction(unit, allAllies, allEnemies) {
    if (!unit.spells || !unit.spells.length) return null;

    const mana = unit.stats.mana || 0;
    const affordableSpells = unit.spells.filter(s => s.cost <= mana);
    if (!affordableSpells.length) return null;

    // Healer logic: heal if any ally is below 50% HP
    if (unit.class === 'mage_healer') {
      const injured = allAllies.filter(a => a.isAlive && a.stats.hp < a.stats.maxHp * 0.5);
      if (injured.length > 0) {
        const healSpell = affordableSpells.find(s => s.heal);
        if (healSpell) return { spell: healSpell, targetType: 'heal' };
      }
    }

    // Otherwise use strongest damage spell
    const dmgSpells = affordableSpells.filter(s => s.damage);
    if (dmgSpells.length) {
      const best = dmgSpells.reduce((b, s) =>
        (s.damage.min + s.damage.max) > (b.damage.min + b.damage.max) ? s : b);
      return { spell: best, targetType: 'damage' };
    }

    // Fallback: any affordable
    return { spell: affordableSpells[0], targetType: 'unknown' };
  }

  // ── Auto-ally AI ───────────────────────────────────────────────

  // AI for an ally unit (used in auto/fast mode)
  function autoAllyAction(unit, allAllies, allEnemies) {
    // Mages with spells: 70% chance to use spell if available
    if (unit.spells && unit.spells.length && Math.random() < 0.7) {
      const action = chooseMageAction(unit, allAllies, allEnemies);
      if (action) return action;
    }

    // Standard attack
    const targets = getValidTargets(unit, allEnemies);
    if (!targets.length) return null;

    const target = targets.reduce((best, t) => t.stats.hp < best.stats.hp ? t : best);
    return { attack: true, target };
  }

  return { chooseTarget, getValidTargets, chooseMageAction, autoAllyAction };
})();
