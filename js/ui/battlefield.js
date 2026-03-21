// ================================================================
// BATTLEFIELD UI — Renders unit cards on the battle field
// ================================================================

const BattlefieldUI = (() => {

  // Class colors for unit cards
  const CLASS_COLORS = {
    tank:        '#185FA5',
    spearman:    '#534AB7',
    damage:      '#7a3ab7',
    archer:      '#3B6D11',
    crossbowman: '#0F6E56',
    mage_aoe:    '#BA7517',
    mage_single: '#7B3F00',
    mage_healer: '#1a6b6b',
    mage_buffer: '#5a4a1e',
    mage_debuff: '#4a1a4a',
    beast:       '#8B1A1A',
  };

  // Render the entire battlefield
  function render(battleState) {
    if (!battleState) return;

    clearField();

    const { allies, enemies, turnOrder, currentIdx } = battleState;
    const currentUnit = turnOrder[currentIdx];

    // Place ally units
    allies.forEach(u => placeUnit(u, currentUnit));

    // Place enemy units
    enemies.forEach(u => placeUnit(u, currentUnit));

    // Update action bar current unit info
    updateCurrentUnitInfo(currentUnit);
  }

  function clearField() {
    ['ally-col-1','ally-col-2','ally-col-3','enemy-col-1','enemy-col-2','enemy-col-3'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      // Remove unit cards but keep col-label
      Array.from(el.querySelectorAll('.unit-card')).forEach(c => c.remove());
    });
  }

  function placeUnit(unit, currentUnit) {
    const colId = `${unit.side}-col-${unit.column}`;
    const col = document.getElementById(colId);
    if (!col) return;

    const card = buildUnitCard(unit, currentUnit);
    col.appendChild(card);
  }

  function buildUnitCard(unit, currentUnit) {
    const card = document.createElement('div');
    card.className = `unit-card ${unit.side === 'ally' ? 'ally-card' : 'enemy-card'}`;
    card.dataset.instanceId = unit.instanceId;

    if (!unit.isAlive) {
      card.classList.add('dead');
    } else if (currentUnit && unit.instanceId === currentUnit.instanceId) {
      card.classList.add('active');
    }

    // Class color accent
    const classColor = CLASS_COLORS[unit.class] || '#555';
    card.style.borderTopColor = classColor;

    // HP ratio
    const hpPct = unit.stats.maxHp > 0 ? unit.stats.hp / unit.stats.maxHp : 0;
    let hpClass = 'hp-high';
    if (hpPct < 0.5) hpClass = 'hp-mid';
    if (hpPct < 0.25) hpClass = 'hp-low';

    // Mana bar
    const hasMana = unit.stats.maxMana > 0;
    const manaPct = hasMana ? (unit.stats.mana || 0) / unit.stats.maxMana : 0;

    // Status effects
    const effIcons = Effects.formatEffects(unit).map(e =>
      `<span class="status-icon" title="${e.label} (${e.duration}т)">${e.icon}</span>`
    ).join('');

    card.innerHTML = `
      <div class="uc-icon">${unit.icon || '⚔️'}</div>
      <div class="uc-name">${unit.name}</div>
      <div class="hp-bar-wrap">
        <div class="hp-bar-fill ${hpClass}" style="width:${(hpPct*100).toFixed(1)}%"></div>
      </div>
      <div class="uc-hp-text">${unit.stats.hp}/${unit.stats.maxHp}</div>
      ${hasMana ? `
        <div class="mana-bar-wrap">
          <div class="mana-bar-fill" style="width:${(manaPct*100).toFixed(1)}%"></div>
        </div>
      ` : ''}
      <div class="uc-initiative">⚡${unit.stats.initiative.toFixed(1)}</div>
      ${effIcons ? `<div class="uc-status-icons">${effIcons}</div>` : ''}
    `;

    // Click handling
    card.addEventListener('click', () => handleCardClick(unit));

    return card;
  }

  function handleCardClick(unit) {
    const bs = Battle.getState();
    if (!bs || bs.isOver) return;

    // If we're waiting for a target and this is an enemy
    if (bs.pendingAction && unit.side === 'enemy' && unit.isAlive) {
      markTargetable(false);
      Battle.selectTarget(unit);
      return;
    }

    // Show unit tooltip (do nothing else for now)
  }

  // Highlight targetable enemies
  function markTargetable(enabled) {
    document.querySelectorAll('.unit-card.enemy-card').forEach(c => {
      if (enabled) c.classList.add('targetable');
      else c.classList.remove('targetable');
    });
    const hint = document.getElementById('target-hint');
    if (hint) {
      if (enabled) hint.classList.remove('hidden');
      else hint.classList.add('hidden');
    }
  }

  // Enable enemy card targeting when player clicks "Attack"
  function requestTarget() {
    const bs = Battle.getState();
    if (!bs) return;
    markTargetable(true);
  }

  // Update action bar
  function updateCurrentUnitInfo(unit) {
    const icon = document.getElementById('cur-unit-icon');
    const name = document.getElementById('cur-unit-name');
    const hp   = document.getElementById('cur-unit-hp');
    const btnAttack  = document.getElementById('btn-attack');
    const btnAbility = document.getElementById('btn-ability');
    const btnSkip    = document.getElementById('btn-skip');

    if (!unit) {
      if (icon) icon.textContent = '⚔️';
      if (name) name.textContent = 'Ожидание...';
      if (hp)   hp.textContent = '';
      return;
    }

    if (icon) icon.textContent = unit.icon || '⚔️';
    if (name) name.textContent = unit.name;
    if (hp)   hp.textContent = `${unit.stats.hp}/${unit.stats.maxHp} HP`;

    const bs = Battle.getState();
    const isPlayerTurn = unit.side === 'ally' && bs && bs.mode === 'tactical';

    if (btnAttack)  btnAttack.disabled  = !isPlayerTurn;
    if (btnAbility) btnAbility.disabled = !isPlayerTurn || !(unit.spells && unit.spells.length);
    if (btnSkip)    btnSkip.disabled    = !isPlayerTurn;

    // Update status bar text
    const statusEl = document.getElementById('battle-status-text');
    if (statusEl) {
      if (isPlayerTurn) {
        statusEl.textContent = `Ход ${unit.name} — выберите действие`;
        statusEl.style.color = '#6af';
      } else if (unit.side === 'enemy') {
        statusEl.textContent = `Ход ${unit.name} (враг)`;
        statusEl.style.color = '#f66';
      } else {
        statusEl.textContent = `Авто: ${unit.name}`;
        statusEl.style.color = '#fa0';
      }
    }

    // Auto/fast buttons
    const btnAuto = document.getElementById('btn-auto');
    if (btnAuto) {
      const mode = bs?.mode;
      btnAuto.classList.toggle('active', mode === 'auto');
    }
  }

  // ── Floating damage numbers ────────────────────────────────────

  /**
   * showDamageNumber(instanceId, value, type)
   * type: 'damage' | 'heal' | 'miss' | 'crit'
   * Spawns a div above the unit card, floats up 48px, fades out in 0.8s,
   * then removes itself on animationend.
   */
  function showDamageNumber(instanceId, value, type) {
    const card = document.querySelector(`[data-instance-id="${instanceId}"]`);
    if (!card) return;

    const rect = card.getBoundingClientRect();
    if (!rect.width) return; // card not visible

    const el = document.createElement('div');
    el.className = `float-num float-${type}`;

    switch (type) {
      case 'miss':   el.textContent = 'ПРОМАХ!';       break;
      case 'heal':   el.textContent = `+${value} ❤️`;  break;
      case 'crit':   el.textContent = `💥 ${value}!`;  break;
      default:       el.textContent = `-${value}`;      break;
    }

    // Random slight horizontal spread so numbers from multi-hits don't stack
    const jitter = (Math.random() - 0.5) * 32;

    el.style.left = `${rect.left + rect.width / 2 + jitter}px`;
    el.style.top  = `${rect.top + 8}px`;

    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  // Show battle result overlay
  function showResult(result, battleState) {
    const overlay = document.getElementById('battle-result');
    if (!overlay) return;

    const icon  = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const stats = document.getElementById('result-stats');

    const dead_allies  = battleState.allies.filter(u => !u.isAlive).length;
    const dead_enemies = battleState.enemies.filter(u => !u.isAlive).length;

    if (result === 'victory') {
      icon.textContent  = '🏆';
      title.textContent = 'ПОБЕДА!';
      title.style.color = '#ffe066';
      stats.textContent = `Врагов повержено: ${dead_enemies} | Потери: ${dead_allies}/${battleState.allies.length}`;
    } else {
      icon.textContent  = '💀';
      title.textContent = 'ПОРАЖЕНИЕ!';
      title.style.color = '#ff4444';
      stats.textContent = `Все союзники пали на раунде ${battleState.round}`;
    }

    overlay.classList.remove('hidden');
  }

  return { render, requestTarget, markTargetable, showResult, updateCurrentUnitInfo, showDamageNumber };
})();
