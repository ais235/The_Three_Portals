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

    // Stun check (сообщение о пропуске даёт Effects.processTurnStart)
    const stun = unit.statusEffects.find(e => e.type === 'stun');
    if (stun) {
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
    return Math.max(1, Math.round((atk - def * 0.5) * random));
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

  function effectPreviewLabel(effectStr) {
    if (!effectStr) return '';
    const map = {
      stun_1: 'оглушение 1 ход',
      initiative_down_3: '−3 инициативы',
      initiative_down_4: '−4 инициативы',
      ranged_dmg_reduce_40pct: '−40% дальн. урона 3 хода',
      remove_debuffs: 'снятие дебаффов',
    };
    return map[effectStr] || effectStr;
  }

  /** Средний урон заклинания по одной цели (маг. защита цели). */
  function estimateSpellDamage(spell, target) {
    if (!spell?.damage || !target?.isAlive) return null;
    const mid = (spell.damage.min + spell.damage.max) / 2;
    const v = Math.max(1, Math.round(mid - (target.stats.magicDef || 0)));
    return v;
  }

  function estimateSpellHeal(spell, target) {
    if (!spell?.heal || !target?.isAlive) return null;
    const mid = (spell.heal.min + spell.heal.max) / 2;
    return Math.min(Math.round(mid), Math.max(0, target.stats.maxHp - target.stats.hp));
  }

  /**
   * Текст превью для карточки цели при наведении (заклинание уже выбрано, anchor — клетка под курсором).
   */
  function formatSpellPreviewLine(attacker, spell, anchorUnit, displayTarget) {
    if (!state || !spell || !displayTarget?.isAlive) return '';
    const targets = resolveSpellTargets(spell, attacker, anchorUnit);
    const inSet = targets.some(t => t.instanceId === displayTarget.instanceId);
    if (!inSet) return '';

    const parts = [];
    const d = estimateSpellDamage(spell, displayTarget);
    if (d != null) parts.push(`≈${d} урона`);
    const h = estimateSpellHeal(spell, displayTarget);
    if (h != null && h > 0) parts.push(`+≈${h} HP`);
    if (spell.effect) {
      const fx = effectPreviewLabel(spell.effect);
      if (fx) parts.push(fx);
    }
    if (!parts.length) parts.push('эффект');
    return parts.join(' · ');
  }

  function getSpellPreviewTargets(attacker, spell, anchorUnit) {
    if (!state || !spell || !attacker) return [];
    return resolveSpellTargets(spell, attacker, anchorUnit);
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
      log('system', `${attacker.name} («${getBasicAttackLabel(attacker)}») промах — ${target.name} уклоняется! 💨`);
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
    const hpBefore = target.stats.hp;
    applyDamage(target, dmg, attacker.side);
    const hpAfter = target.stats.hp;
    if (state.mode !== 'fast') {
      BattlefieldUI.showDamageNumber(target.instanceId, dmg, isCrit ? 'crit' : 'damage');
    }

    const atkLabel = getBasicAttackLabel(attacker);
    const rangeSuffix = (rangeMod < 1) ? ` (×${rangeMod} дальность)` : '';
    const critSuffix  = isCrit ? ' 💥 КРИ!' : '';
    log('damage', `${attacker.name} — «${atkLabel}» → ${target.name}: ${dmg} урона (${hpBefore}/${hpAfter} HP)${rangeSuffix}${critSuffix}`);

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
        const hp2Before = target2.stats.hp;
        applyDamage(target2, dmg2, attacker.side);
        const hp2After = target2.stats.hp;
        if (state.mode !== 'fast') {
          BattlefieldUI.showDamageNumber(target2.instanceId, dmg2, isCrit2 ? 'crit' : 'damage');
        }
        log('damage', `${attacker.name} — «${atkLabel}» (2-й выстрел) → ${target2.name}: ${dmg2} урона (${hp2Before}/${hp2After} HP)${isCrit2 ? ' 💥' : ''}`);
        checkOnHitEffects(attacker, target2);
      }
    }
  }

  // Execute a spell (targetUnit — клик игрока по сетке; для ИИ/null подбирается по target)
  function executeSpell(attacker, spell, targetUnit) {
    const targets = resolveSpellTargets(spell, attacker, targetUnit);
    if (!targets.length) {
      log('system', `${attacker.name}: нет целей для ${spell.name}`);
      return false;
    }

    const cost = spell.cost || 0;
    if ((attacker.stats.mana || 0) < cost) {
      log('system', `${attacker.name}: недостаточно маны для ${spell.name}`);
      return false;
    }
    attacker.stats.mana = (attacker.stats.mana || 0) - cost;

    if (spell.damage) {
      const dmgVal  = spell.damage.min + Math.floor(Math.random() * (spell.damage.max - spell.damage.min + 1));
      targets.forEach(t => {
        if (!t.isAlive) return;
        const dmg = Math.max(1, dmgVal - t.stats.magicDef);
        const hpBefore = t.stats.hp;
        applyDamage(t, dmg, attacker.side);
        const hpAfter = t.stats.hp;
        if (state.mode !== 'fast') BattlefieldUI.showDamageNumber(t.instanceId, dmg, 'damage');
        log('damage', `${attacker.name} — «${spell.name}» → ${t.name}: ${dmg} урона (${hpBefore}/${hpAfter} HP) ✨`);
      });
    }

    if (spell.heal) {
      const healVal = spell.heal.min + Math.floor(Math.random() * (spell.heal.max - spell.heal.min + 1));
      targets.forEach(t => {
        if (!t.isAlive) return;
        const hpBefore = t.stats.hp;
        const healed = Math.min(healVal, t.stats.maxHp - t.stats.hp);
        t.stats.hp += healed;
        const hpAfter = t.stats.hp;
        if (state.mode !== 'fast') BattlefieldUI.showDamageNumber(t.instanceId, healed, 'heal');
        log('heal', `${attacker.name} — «${spell.name}» → ${t.name}: +${healed} HP (${hpBefore}/${hpAfter}) 💚`);
      });
    }

    if (spell.effect) {
      targets.forEach(t => applySpellEffectOnTarget(t, spell.effect, spell));
    }

    return true;
  }

  /** Расширение целей по spell.area (ряд / колонка / крест / диагонали). */
  function expandSpellTargetsByArea(spell, attacker, pickedUnit, base) {
    const a = spell.area;
    if (!a || !a.shape || a.shape === 'single') return base;
    if (spell.target === 'lowest_hp_ally' || spell.target === 'random_3') return base;

    const scope = a.scope || 'enemy';
    const pool = scope === 'enemy'
      ? getOpponentSide(attacker).filter(u => u.isAlive)
      : getSameSide(attacker).filter(u => u.isAlive);

    const anchorInPool = pickedUnit && pickedUnit.isAlive && pool.some(u => u.instanceId === pickedUnit.instanceId);
    const anchor = anchorInPool ? pickedUnit : (base.length === 1 ? base[0] : null);
    if (!anchor || !pool.some(u => u.instanceId === anchor.instanceId)) return base;

    let hit = [];
    switch (a.shape) {
      case 'row':
        hit = pool.filter(u => u.row === anchor.row);
        break;
      case 'column':
      case 'col':
        hit = pool.filter(u => u.column === anchor.column);
        break;
      case 'cross':
        hit = pool.filter(u => u.row === anchor.row || u.column === anchor.column);
        break;
      case 'line':
        hit = pool.filter(u => {
          const dr = u.row - anchor.row;
          const dc = u.column - anchor.column;
          if (dr === 0 && dc === 0) return true;
          return dr !== 0 && dc !== 0 && Math.abs(dr) === Math.abs(dc);
        });
        break;
      default:
        return base;
    }

    if (spell.target === 'single' || spell.target === 'single_enemy' || spell.target === 'single_ally') {
      return hit.length ? hit : base;
    }
    const hitSet = new Set(hit.map(u => u.instanceId));
    return base.filter(u => hitSet.has(u.instanceId));
  }

  function resolveSpellTargets(spell, attacker, pickedUnit = null) {
    const allies  = getSameSide(attacker).filter(u => u.isAlive);
    const enemies = getOpponentSide(attacker).filter(u => u.isAlive);

    const isEnemyPick = pickedUnit && pickedUnit.isAlive && enemies.some(e => e.instanceId === pickedUnit.instanceId);
    const isAllyPick  = pickedUnit && pickedUnit.isAlive && allies.some(a => a.instanceId === pickedUnit.instanceId);

    let base;
    switch (spell.target) {
      case 'single':
      case 'single_enemy':
        if (isEnemyPick) base = [pickedUnit];
        else if (!pickedUnit && enemies.length)
          base = [enemies.reduce((b, t) => t.stats.hp < b.stats.hp ? t : b)];
        else base = [];
        break;
      case 'single_ally':
        if (isAllyPick) base = [pickedUnit];
        else if (!pickedUnit && allies.length) {
          base = [allies.reduce((b, t) => (!b || t.stats.hp < b.stats.hp) ? t : b)];
        } else base = [];
        break;
      case 'all_enemies':
        if (isEnemyPick || (!pickedUnit && enemies.length)) base = enemies;
        else base = [];
        break;
      case 'lowest_hp_ally':
        if (!allies.length) base = [];
        else if (isAllyPick || !pickedUnit) {
          base = [allies.reduce((b, t) => (!b || t.stats.hp < b.stats.hp) ? t : b)];
        } else base = [];
        break;
      case 'all_allies':
        if (isAllyPick || (!pickedUnit && allies.length)) base = allies;
        else base = [];
        break;
      case 'random_3':
        if (isEnemyPick || (!pickedUnit && enemies.length)) base = shuffle(enemies).slice(0, 3);
        else base = [];
        break;
      case 'col1_enemies':
        // Передняя линия врагов: все живые во вражеской колонке с минимальным номером (ближе к отряду игрока).
        if (!enemies.length) base = [];
        else {
          const frontCol = Math.min(...enemies.map(e => e.column));
          base = enemies.filter(e => e.column === frontCol);
        }
        break;
      default:
        base = [];
    }

    return expandSpellTargetsByArea(spell, attacker, pickedUnit, base);
  }

  function applySpellEffectOnTarget(target, effectStr, spell) {
    if (!target || !target.isAlive || !effectStr) return;
    switch (effectStr) {
      case 'stun_1':
        Effects.apply(target, { type: 'stun', duration: 1 });
        log('effect', `${target.name} оглушён на 1 ход («${spell.name}») 💫`);
        break;
      case 'initiative_down_3':
        target.stats.initiative = Math.max(0.5, (target.stats.initiative || 0) - 3);
        log('effect', `${target.name}: инициатива −3 («${spell.name}»)`);
        break;
      case 'initiative_down_4':
        target.stats.initiative = Math.max(0.5, (target.stats.initiative || 0) - 4);
        log('effect', `${target.name}: инициатива −4 (${spell.name})`);
        break;
      case 'ranged_dmg_reduce_40pct':
        Effects.apply(target, { type: 'buff', duration: 3, value: 40 });
        log('effect', `${target.name}: защита от дальнего урона +40%, 3 хода («${spell.name}»)`);
        break;
      case 'remove_debuffs': {
        const bad = new Set(['poison', 'burn', 'bleed', 'stun', 'slow', 'curse']);
        const n = (target.statusEffects || []).length;
        target.statusEffects = (target.statusEffects || []).filter(e => !bad.has(e.type));
        if (target.statusEffects.length < n)
          log('effect', `${target.name}: дебаффы сняты (${spell.name})`);
        break;
      }
      default:
        break;
    }
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
    if (!target?.isAlive) return;
    for (const ab of attacker.abilities || []) {
      if (ab.type !== 'on_hit') continue;

      if (ab.poisonDmg != null) {
        const c = ab.chance != null ? ab.chance : 0.25;
        if (Math.random() >= c) continue;
        const pDur = ab.poisonDuration || 3;
        const pVal = ab.poisonDmg;
        Effects.apply(target, { type:'poison', duration: pDur, value: pVal });
        log('effect', `${target.name} отравлен («${ab.name || ab.id}»): ${pVal} урона/ход, ${pDur} ход. 🐍`);
        continue;
      }

      if (ab.stunChance != null && !ab.effect) {
        if (Math.random() < ab.stunChance) {
          const d = ab.stunDuration || 1;
          Effects.apply(target, { type:'stun', duration: d });
          log('effect', `${target.name} оглушён на ${d} ход («${ab.name || ab.id}») 💫`);
        }
        continue;
      }

      if (ab.effect === 'stun_1') {
        const c = ab.chance != null ? ab.chance : 1;
        if (Math.random() < c) {
          Effects.apply(target, { type:'stun', duration: 1 });
          log('effect', `${target.name} оглушён на 1 ход («${ab.name || ab.id}») 💫`);
        }
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

    // Toggle spell picker (player chooses spell before applying)
    if (state.pendingAction && (state.pendingAction.type === 'spell_select' || state.pendingAction.type === 'spell')) {
      cancelPendingAction();
      renderAll();
      return;
    }

    if (unit.spells && unit.spells.length) {
      state.pendingAction = { type: 'spell_select', attacker: unit, spell: null };
      renderAll();
      return;
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

    if (state.pendingAction.type === 'attack') {
      executeAttack(attacker, targetUnit);
      state.pendingAction = null;
      renderAll();
      checkBattleEnd();
      if (!state.isOver) nextTurn();
      return;
    }

    if (state.pendingAction.type === 'spell' && state.pendingAction.spell) {
      const spell = state.pendingAction.spell;
      const ok =
        isValidSpellGridClick(spell, attacker, targetUnit);
      if (!ok) return;
      const castOk = executeSpell(attacker, spell, targetUnit);
      if (!castOk) return;
      state.pendingAction = null;
      renderAll();
      checkBattleEnd();
      if (!state.isOver) nextTurn();
    }
  }

  function isValidSpellGridClick(spell, attacker, unit) {
    const allies  = getSameSide(attacker).filter(u => u.isAlive);
    const enemies = getOpponentSide(attacker).filter(u => u.isAlive);
    const isEn = enemies.some(e => e.instanceId === unit.instanceId);
    const isAl = allies.some(a => a.instanceId === unit.instanceId);
    switch (spell.target) {
      case 'single':
      case 'single_enemy':
      case 'all_enemies':
      case 'random_3':
        return isEn;
      case 'single_ally':
      case 'lowest_hp_ally':
      case 'all_allies':
        return isAl;
      default:
        return false;
    }
  }

  function cancelPendingAction() {
    state.pendingAction = null;
    state.selectedTarget = null;
    const { onRequestTarget } = state;
    // tell UI to clear targetable state
    if (onRequestTarget) onRequestTarget('clear');
  }

  function chooseSpell(spellId) {
    if (state.isOver) return;
    const unit = getCurrentUnit();
    if (!unit || unit.side !== 'ally') return;
    if (!unit.spells || !unit.spells.length) return;

    const spell = unit.spells.find(s => s.id === spellId);
    if (!spell) return;

    state.pendingAction = { type: 'spell', attacker: unit, spell };
    const { onRequestTarget } = state;
    if (onRequestTarget) onRequestTarget('spell', { spell });
    renderAll();
  }

  /** Автобой: перебирает доступные заклинания по приоритету, пока одно не сработает. */
  function tryAutoSpellChain(unit) {
    const same = unit.side === 'ally' ? state.allies : state.enemies;
    const order = AI.buildSpellTryOrder(unit, same);
    for (const spell of order) {
      if (executeSpell(unit, spell, null)) return true;
    }
    return false;
  }

  function tryAllyBasicAttackLowestHp(unit) {
    const targets = AI.getValidTargets(unit, state.enemies);
    if (!targets.length) return;
    const target = targets.reduce((best, t) => t.stats.hp < best.stats.hp ? t : best);
    executeAttack(unit, target);
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
            if (action) tryAutoSpellChain(unit);
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
          } else if (action.spellsFirst) {
            const ok = tryAutoSpellChain(unit);
            if (!ok) tryAllyBasicAttackLowestHp(unit);
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
          else if (action.spellsFirst) {
            const ok = tryAutoSpellChain(unit);
            if (!ok) tryAllyBasicAttackLowestHp(unit);
          }
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

  /** Человекочитаемое имя базовой атаки (для лога). */
  function getBasicAttackLabel(unit) {
    if (unit.attackMode?.shots >= 2) {
      const d = hasAbility(unit, 'double_shot');
      if (d?.name) return d.name;
    }
    const t = unit.attackType || 'melee';
    if (t === 'melee') return 'Ближний удар';
    if (t === 'ranged') return 'Выстрел';
    if (t === 'magic') return 'Магический удар';
    return 'Атака';
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

  /** Сброс боя без смены экрана (новая игра с карты). */
  function discardState() {
    clearTimeout(state?.autoTimer);
    state = null;
    if (typeof BattlefieldUI !== 'undefined' && BattlefieldUI.requestTarget) {
      BattlefieldUI.requestTarget('clear');
    }
  }

  // ── Public API ─────────────────────────────────────────────────

  return {
    init, restart, exit, discardState,
    playerAttack, playerAbility, playerSkip, selectTarget,
    toggleAuto, runFast,
    getState: () => state,
    getCurrentUnit,
    estimateAttackDamage,
    getSpellPreviewTargets,
    formatSpellPreviewLine,
    effectPreviewLabel,
    chooseSpell,
    cancelPendingAction,
  };
})();
