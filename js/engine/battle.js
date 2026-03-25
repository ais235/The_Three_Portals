// ================================================================
// BATTLE ENGINE — Core battle logic
// ================================================================

const Battle = (() => {

  // ── State ──────────────────────────────────────────────────────
  let state = null;

  /* state = {
      allies: [],        enemies: [],
      allUnits: [],      turnOrder: [],
      currentIdx: 0,     round: 1,
      mode: 'tactical',  // 'tactical' | 'auto' | 'fast'
      autoTimer: null,   isOver: false,
      pendingAction: null,   // { type: 'attack'|'spell', attacker }
      selectedTarget: null,
      fastMode: false,
      onLogEntry: fn,    onRender: fn,   onEnd: fn,
  } */

  // ── Init ───────────────────────────────────────────────────────

  function init(allies, enemies, callbacks) {
    document.getElementById('battle-result')?.classList.add('hidden');

    const allUnits = [...allies, ...enemies];
    state = {
      allies, enemies, allUnits,
      turnOrder: [],
      currentIdx: 0,
      round: 1,
      mode: 'tactical',
      autoTimer: null,
      isOver: false,
      pendingAction: null,
      selectedTarget: null,
      totalDamageDealt: 0,  // ally→enemy damage for defeat penalty
      ...callbacks,
    };

    log('system', `⚔️ Бой начался! Раунд 1`);
    buildTurnOrder();
    renderAll();
    advanceToNextUnit();
  }

  // ── Turn order ─────────────────────────────────────────────────

  function buildTurnOrder() {
    const alive = state.allUnits.filter(u => u.isAlive);
    alive.forEach(u => {
      u._initTieBreak = u.stats.initiative + Math.random() * 0.01;
    });
    state.turnOrder = alive.slice().sort((a, b) => b._initTieBreak - a._initTieBreak);
    state.currentIdx = 0;
  }

  function advanceToNextUnit() {
    if (state.isOver) return;

    // Find next alive unit in current order
    while (state.currentIdx < state.turnOrder.length) {
      const unit = state.turnOrder[state.currentIdx];
      if (unit.isAlive) break;
      state.currentIdx++;
    }

    // Round over?
    if (state.currentIdx >= state.turnOrder.length) {
      startNewRound();
      return;
    }

    const unit = state.turnOrder[state.currentIdx];
    processStartOfTurn(unit);
  }

  function startNewRound() {
    state.round++;
    log('round', `═══ Раунд ${state.round} ═══`);
    buildTurnOrder();
    advanceToNextUnit();
  }

  // ── Turn processing ────────────────────────────────────────────

  function processStartOfTurn(unit) {
    if (!unit.isAlive) { nextTurn(); return; }

    // Status effects
    const effMsgs = Effects.processTurnStart(unit);
    effMsgs.forEach(m => log(m.type, m.text));

    // Mana regen
    Effects.regenMana(unit);

    // Death check after effects
    if (!unit.isAlive) {
      log('system', `${unit.name} погибает от эффекта!`);
      checkBattleEnd();
      if (!state.isOver) { nextTurn(); }
      return;
    }

    // Stun check
    const stun = unit.statusEffects.find(e => e.type === 'stun');
    if (stun) {
      log('effect', `${unit.name} оглушён и пропускает ход! 💫`);
      nextTurn();
      return;
    }

    renderAll();
    updateTopbar();

    if (state.mode === 'auto' || unit.side === 'enemy') {
      handleAutoTurn(unit);
    } else {
      // Tactical: activate player controls
      enablePlayerActions(unit);
    }
  }

  // ── Damage formula ─────────────────────────────────────────────

  function calcDmg(attacker, target, attackType, modifier = 1.0) {
    let atk, def;
    if (attackType === 'melee') {
      atk = attacker.stats.meleeAtk;
      def = target.stats.meleeDef;
    } else if (attackType === 'ranged') {
      atk = attacker.stats.rangeAtk * modifier;
      def = target.stats.rangeDef;
    } else {
      atk = attacker.stats.magic * modifier;
      def = target.stats.magicDef;
    }

    // Passive bonuses
    atk *= getAttackMultiplier(attacker);
    def *= getDefenseMultiplier(target, attacker);

    const random = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.round((atk - def) * random));
  }

  /** Оценка урона для превью в UI (без случайного разброса, без уклонения). */
  function estimateAttackDamage(attacker, target) {
    if (!state || !attacker || !target || !attacker.isAlive || !target.isAlive) return null;
    const attackType = attacker.attackType || 'melee';
    let rangeMod = 1.0;
    if (attackType === 'ranged' && attacker.rangeModifiers) {
      const mod = attacker.rangeModifiers[target.column];
      if (mod === null || mod === undefined) return { unreachable: true };
      rangeMod = mod;
    }
    let atk, def;
    if (attackType === 'melee') {
      atk = attacker.stats.meleeAtk;
      def = target.stats.meleeDef;
    } else if (attackType === 'ranged') {
      atk = attacker.stats.rangeAtk * rangeMod;
      def = target.stats.rangeDef;
    } else {
      atk = attacker.stats.magic;
      def = target.stats.magicDef;
    }
    atk *= getAttackMultiplier(attacker);
    def *= getDefenseMultiplier(target, attacker);
    const typical = Math.max(1, Math.round((atk - def) * 0.95));
    const crit = Math.max(1, Math.round(typical * 1.5));
    return { unreachable: false, typical, crit, attackType, rangeMod };
  }

  // Compute attack multiplier from passives
  function getAttackMultiplier(unit) {
    let mult = 1.0;

    // Копейный ряд: рядом с другим копейщиком
    if (unit.class === 'spearman') {
      const nearby = getSameSide(unit).filter(u =>
        u.isAlive && u.id !== unit.id && u.class === 'spearman' && u.column === unit.column);
      if (nearby.length) mult *= 1.20;
    }

    // Кровавая ярость (орк)
    const rageAb = hasAbility(unit, 'blood_rage');
    if (rageAb) {
      const lostPct = 1 - unit.stats.hp / unit.stats.maxHp;
      mult *= 1 + Math.floor(lostPct / 0.20) * 0.08;
    }

    return mult;
  }

  // Compute defense multiplier
  function getDefenseMultiplier(target, attacker) {
    let mult = 1.0;

    // Защита слабых: стражник с союзником в кол.2 с малым HP
    if (hasAbility(target, 'guard_weak')) {
      const col2Ally = getSameSide(target).find(u =>
        u.isAlive && u.column === 2 && u.stats.hp < u.stats.maxHp * 0.30);
      if (col2Ally) mult *= 0.80;
    }

    // Щитовой строй
    if (hasAbility(target, 'shield_wall')) {
      const nearTank = getSameSide(target).find(u =>
        u.isAlive && u.id !== target.id && u.class === 'tank' && u.column === target.column);
      if (nearTank) mult *= 0.85;
    }

    return mult;
  }

  // ── Attack resolution ──────────────────────────────────────────

  function executeAttack(attacker, target) {
    if (!attacker.isAlive || !target.isAlive) return;

    const attackType = attacker.attackType || 'melee';

    // Dodge check
    const dodgeAb = hasAbility(target, 'dodge');
    if (dodgeAb && Math.random() < (dodgeAb.dodgeChance || 0.15)) {
      log('system', `${attacker.name} промахивается — ${target.name} уклоняется! 💨`);
      if (state.mode !== 'fast') BattlefieldUI.showDamageNumber(target.instanceId, 0, 'miss');
      return;
    }

    // Range modifier
    let rangeMod = 1.0;
    if (attackType === 'ranged' && attacker.rangeModifiers) {
      const mod = attacker.rangeModifiers[target.column];
      if (mod === null || mod === undefined) {
        log('system', `${attacker.name} не может достать до ${target.name} (колонка ${target.column})`);
        return;
      }
      rangeMod = mod;
    }

    // Crit roll (15% chance → ×1.5 damage)
    const isCrit = Math.random() < 0.15;
    const baseDmg = calcDmg(attacker, target, attackType, rangeMod);
    const dmg = isCrit ? Math.round(baseDmg * 1.5) : baseDmg;

    applyDamage(target, dmg, attacker.side);
    if (state.mode !== 'fast') {
      BattlefieldUI.showDamageNumber(target.instanceId, dmg, isCrit ? 'crit' : 'damage');
    }

    const rangeSuffix = (rangeMod < 1) ? ` (×${rangeMod} дальность)` : '';
    const critSuffix  = isCrit ? ' 💥 КРИ!' : '';
    log('damage', `${attacker.name} атакует ${target.name} — ${dmg} урона${rangeSuffix}${critSuffix}`);

    // On-hit effects
    checkOnHitEffects(attacker, target);

    // Archer double shot
    if (attacker.attackMode && attacker.attackMode.shots >= 2) {
      const targets2 = AI.getValidTargets(attacker, getOpponentSide(attacker));
      const target2 = targets2.filter(t => t.isAlive)[Math.floor(Math.random() * targets2.length)];
      if (target2 && target2.isAlive) {
        const isCrit2 = Math.random() < 0.15;
        const base2   = calcDmg(attacker, target2, attackType, attacker.rangeModifiers?.[target2.column] ?? 1);
        const dmg2    = isCrit2 ? Math.round(base2 * 1.5) : base2;
        applyDamage(target2, dmg2, attacker.side);
        if (state.mode !== 'fast') {
          BattlefieldUI.showDamageNumber(target2.instanceId, dmg2, isCrit2 ? 'crit' : 'damage');
        }
        log('damage', `${attacker.name} 2й выстрел → ${target2.name} — ${dmg2} урона${isCrit2 ? ' 💥' : ''}`);
        checkOnHitEffects(attacker, target2);
      }
    }
  }

  // Execute a spell
  function executeSpell(attacker, spell, target) {
    const cost = spell.cost || 0;
    if ((attacker.stats.mana || 0) < cost) {
      log('system', `${attacker.name}: недостаточно маны для ${spell.name}`);
      return;
    }
    attacker.stats.mana = (attacker.stats.mana || 0) - cost;

    if (spell.damage) {
      const dmgVal  = spell.damage.min + Math.floor(Math.random() * (spell.damage.max - spell.damage.min + 1));
      const targets = resolveSpellTargets(spell, attacker);
      targets.forEach(t => {
        if (!t.isAlive) return;
        const dmg = Math.max(1, dmgVal - t.stats.magicDef);
        applyDamage(t, dmg, attacker.side);
        if (state.mode !== 'fast') BattlefieldUI.showDamageNumber(t.instanceId, dmg, 'damage');
        log('damage', `${attacker.name} → ${spell.name} по ${t.name} — ${dmg} урона ✨`);
      });
    }

    if (spell.heal) {
      const healVal = spell.heal.min + Math.floor(Math.random() * (spell.heal.max - spell.heal.min + 1));
      const targets = resolveSpellTargets(spell, attacker);
      targets.forEach(t => {
        if (!t.isAlive) return;
        const healed = Math.min(healVal, t.stats.maxHp - t.stats.hp);
        t.stats.hp += healed;
        if (state.mode !== 'fast') BattlefieldUI.showDamageNumber(t.instanceId, healed, 'heal');
        log('heal', `${attacker.name} → ${spell.name}: ${t.name} восстанавливает ${healed} HP 💚`);
      });
    }

    if (spell.effect) {
      applySpellEffect(attacker, spell.effect, spell);
    }
  }

  function resolveSpellTargets(spell, attacker) {
    const allies  = getSameSide(attacker).filter(u => u.isAlive);
    const enemies = getOpponentSide(attacker).filter(u => u.isAlive);

    switch (spell.target) {
      case 'single':
      case 'single_enemy':
        return enemies.length ? [enemies.reduce((b, t) => t.stats.hp < b.stats.hp ? t : b)] : [];
      case 'all_enemies':
        return enemies;
      case 'lowest_hp_ally':
        return allies.length ? [allies.reduce((b, t) => t.stats.hp < b.stats.hp ? t : b)] : [];
      case 'all_allies':
        return allies;
      case 'random_3':
        return shuffle(enemies).slice(0, 3);
      default:
        return [];
    }
  }

  function applySpellEffect(attacker, effectStr, spell) {
    // Simple: stun_1 = stun for 1 turn on target
    // Could expand with more complex effects
  }

  function applyDamage(unit, dmg, attackerSide) {
    if (!unit.isAlive) return;
    unit.stats.hp = Math.max(0, unit.stats.hp - dmg);
    // Track damage allies deal to enemies
    if (unit.side === 'enemy' && attackerSide === 'ally') {
      state.totalDamageDealt = (state.totalDamageDealt || 0) + dmg;
    }
    if (unit.stats.hp <= 0) {
      unit.isAlive = false;
      log('system', `💀 ${unit.name} повержен!`);
    }
  }

  function checkOnHitEffects(attacker, target) {
    const poisonAb = hasAbility(attacker, 'poison_bite') || hasAbility(attacker, 'poison_blade');
    if (poisonAb && target.isAlive) {
      const chance = poisonAb.chance || 0.20;
      if (Math.random() < chance) {
        Effects.apply(target, { type:'poison', duration: poisonAb.poisonDuration || 3, value: poisonAb.poisonDmg || 3 });
        log('effect', `${target.name} отравлен! 🐍`);
      }
    }
  }

  // ── Player actions ─────────────────────────────────────────────

  function enablePlayerActions(unit) {
    const { onEnableActions } = state;
    if (onEnableActions) onEnableActions(unit);
  }

  function playerAttack() {
    if (state.isOver) return;
    const unit = getCurrentUnit();
    if (!unit || unit.side !== 'ally') return;

    state.pendingAction = { type: 'attack', attacker: unit };
    const { onRequestTarget } = state;
    if (onRequestTarget) onRequestTarget('attack');
  }

  function playerAbility() {
    if (state.isOver) return;
    const unit = getCurrentUnit();
    if (!unit || unit.side !== 'ally') return;

    // For mages: use spell
    if (unit.spells && unit.spells.length) {
      const action = AI.chooseMageAction(unit, state.allies, state.enemies);
      if (action && action.spell) {
        const targets = resolveSpellTargets(action.spell, unit);
        executeSpell(unit, action.spell, targets[0] || null);
        renderAll();
        checkBattleEnd();
        if (!state.isOver) nextTurn();
        return;
      }
    }

    log('system', `${unit.name}: нет доступных способностей`);
  }

  function playerSkip() {
    if (state.isOver) return;
    const unit = getCurrentUnit();
    if (unit) log('system', `${unit.name} пропускает ход`);
    nextTurn();
  }

  // Called when player clicks an enemy target
  function selectTarget(targetUnit) {
    if (!state.pendingAction) return;
    const { attacker } = state.pendingAction;
    if (!attacker || !targetUnit.isAlive) return;

    executeAttack(attacker, targetUnit);
    state.pendingAction = null;
    renderAll();
    checkBattleEnd();
    if (!state.isOver) nextTurn();
  }

  // ── Auto turn ──────────────────────────────────────────────────

  function handleAutoTurn(unit) {
    const delay = state.mode === 'auto' ? 600 : (unit.side === 'enemy' ? 700 : 0);
    state.autoTimer = setTimeout(() => {
      if (!unit.isAlive || state.isOver) { nextTurn(); return; }

      if (unit.side === 'enemy') {
        const target = AI.chooseTarget(unit, state.allies);
        if (target) {
          executeAttack(unit, target);
          // Mage spell chance
          if (unit.spells && unit.spells.length && Math.random() < 0.5) {
            const action = AI.chooseMageAction(unit, state.enemies, state.allies);
            if (action && action.spell) {
              executeSpell(unit, action.spell, null);
            }
          }
        } else {
          log('system', `${unit.name} не находит цели`);
        }
      } else {
        // Auto ally
        const action = AI.autoAllyAction(unit, state.allies, state.enemies);
        if (action) {
          if (action.attack && action.target) {
            executeAttack(unit, action.target);
          } else if (action.spell) {
            executeSpell(unit, action.spell, null);
          }
        }
      }

      renderAll();
      checkBattleEnd();
      if (!state.isOver) nextTurn();
    }, delay);
  }

  // ── Mode controls ──────────────────────────────────────────────

  function toggleAuto() {
    if (state.isOver) return;
    if (state.mode === 'auto') {
      state.mode = 'tactical';
      clearTimeout(state.autoTimer);
      log('system', '⏸ Тактический режим');
    } else {
      state.mode = 'auto';
      log('system', '🤖 Авто-режим включён');
      // If waiting for player, execute auto
      const unit = getCurrentUnit();
      if (unit && unit.side === 'ally') {
        handleAutoTurn(unit);
      }
    }
    renderAll();
    updateTopbar();
  }

  // Fast battle: simulate entire battle instantly
  function runFast() {
    if (state.isOver) return;
    clearTimeout(state.autoTimer);
    state.mode = 'fast';
    log('system', '⚡ Быстрый бой...');

    let safety = 0;
    while (!state.isOver && safety < 500) {
      safety++;
      const unit = getCurrentUnit();
      if (!unit) { startNewRoundFast(); continue; }
      if (!unit.isAlive) { nextTurnImmediate(); continue; }

      processStartOfTurnFast(unit);
      if (!unit.isAlive || state.isOver) { nextTurnImmediate(); continue; }

      if (unit.side === 'enemy') {
        const target = AI.chooseTarget(unit, state.allies);
        if (target) executeAttack(unit, target);
      } else {
        const action = AI.autoAllyAction(unit, state.allies, state.enemies);
        if (action) {
          if (action.attack && action.target) executeAttack(unit, action.target);
          else if (action.spell) executeSpell(unit, action.spell, null);
        }
      }

      checkBattleEnd();
      nextTurnImmediate();
    }

    renderAll();
  }

  function processStartOfTurnFast(unit) {
    Effects.processTurnStart(unit);
    Effects.regenMana(unit);
  }

  function startNewRoundFast() {
    state.round++;
    buildTurnOrder();
  }

  // ── Helpers ────────────────────────────────────────────────────

  function nextTurn() {
    Effects.tickCooldowns(getCurrentUnit());
    state.currentIdx++;
    if (state.isOver) return;
    setTimeout(() => advanceToNextUnit(), state.mode === 'auto' ? 100 : 0);
  }

  function nextTurnImmediate() {
    const cur = getCurrentUnit();
    if (cur) Effects.tickCooldowns(cur);
    state.currentIdx++;
  }

  function getCurrentUnit() {
    return state.turnOrder[state.currentIdx] || null;
  }

  function getSameSide(unit) {
    return unit.side === 'ally' ? state.allies : state.enemies;
  }

  function getOpponentSide(unit) {
    return unit.side === 'ally' ? state.enemies : state.allies;
  }

  function hasAbility(unit, abilityId) {
    return (unit.abilities || []).find(a => a.id === abilityId) || null;
  }

  function shuffle(arr) {
    return arr.slice().sort(() => Math.random() - 0.5);
  }

  function checkBattleEnd() {
    const alliesAlive  = state.allies.some(u => u.isAlive);
    const enemiesAlive = state.enemies.some(u => u.isAlive);

    if (!alliesAlive) { endBattle('defeat'); }
    else if (!enemiesAlive) { endBattle('victory'); }
  }

  function endBattle(result) {
    state.isOver = true;
    clearTimeout(state.autoTimer);
    const msg = result === 'victory' ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ!';
    log('round', msg);
    if (state.onEnd) state.onEnd(result, state);
  }

  function renderAll() {
    if (state.onRender) state.onRender(state);
  }

  function updateTopbar() {
    const el = document.getElementById('round-num');
    if (el) el.textContent = state.round;
  }

  function log(type, text) {
    if (state.onLogEntry) state.onLogEntry({ type, text });
  }

  // ── Restart ────────────────────────────────────────────────────

  function restart() {
    clearTimeout(state?.autoTimer);
    const { onRender, onLogEntry, onEnd, onEnableActions, onRequestTarget } = state || {};
    const { allies, enemies } = createTestBattle();
    init(allies, enemies, { onRender, onLogEntry, onEnd, onEnableActions, onRequestTarget });
  }

  function exit() {
    clearTimeout(state?.autoTimer);
    state = null;
    App.showScreen('villagemap');
  }

  // ── Public API ─────────────────────────────────────────────────

  return {
    init, restart, exit,
    playerAttack, playerAbility, playerSkip, selectTarget,
    toggleAuto, runFast,
    getState: () => state,
    getCurrentUnit,
    estimateAttackDamage,
  };
})();
