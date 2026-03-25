// ================================================================
// BATTLEFIELD UI — 3×3 grid, turn carousel, unit modal, previews
// ================================================================

const BattlefieldUI = (() => {

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

  function gridCellEl(side, row, col) {
    const gid = side === 'ally' ? 'allies-grid' : 'enemies-grid';
    const grid = document.getElementById(gid);
    if (!grid) return null;
    return grid.querySelector(`.bf-cell[data-row="${row}"][data-col="${col}"]`);
  }

  function render(battleState) {
    if (!battleState) return;

    clearField();

    const { allies, enemies, turnOrder, currentIdx } = battleState;
    const currentUnit = turnOrder[currentIdx];

    allies.forEach(u => placeUnit(u, currentUnit));
    enemies.forEach(u => placeUnit(u, currentUnit));

    updateCurrentUnitInfo(currentUnit);
    renderTurnOrder(battleState);
  }

  function clearField() {
    document.querySelectorAll('#allies-grid .bf-cell, #enemies-grid .bf-cell').forEach(cell => {
      cell.querySelectorAll('.unit-card').forEach(c => c.remove());
    });
  }

  function placeUnit(unit, currentUnit) {
    const cell = gridCellEl(unit.side, unit.row, unit.column);
    if (!cell) return;

    const card = buildUnitCard(unit, currentUnit);
    cell.appendChild(card);
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

    const classColor = CLASS_COLORS[unit.class] || '#555';
    card.style.borderTopColor = classColor;

    const hpPct = unit.stats.maxHp > 0 ? unit.stats.hp / unit.stats.maxHp : 0;
    let hpClass = 'hp-high';
    if (hpPct < 0.5) hpClass = 'hp-mid';
    if (hpPct < 0.25) hpClass = 'hp-low';

    const hasMana = unit.stats.maxMana > 0;
    const manaPct = hasMana ? (unit.stats.mana || 0) / unit.stats.maxMana : 0;

    const effIcons = Effects.formatEffects(unit).map(e =>
      `<span class="status-icon" title="${e.label} (${e.duration}т)">${e.icon}</span>`
    ).join('');

    const iconHtml = unit.portrait
      ? `<img class="uc-portrait" src="${unit.portrait}" alt="" draggable="false">`
      : `<div class="uc-icon">${unit.icon || '⚔️'}</div>`;

    card.innerHTML = `
      ${iconHtml}
      <div class="uc-name">${unit.name}</div>
      <div class="hp-bar-wrap">
        <div class="hp-bar-fill ${hpClass}" style="width:${(hpPct * 100).toFixed(1)}%"></div>
      </div>
      <div class="uc-hp-text">${unit.stats.hp}/${unit.stats.maxHp}</div>
      ${hasMana ? `
        <div class="mana-bar-wrap">
          <div class="mana-bar-fill" style="width:${(manaPct * 100).toFixed(1)}%"></div>
        </div>
      ` : ''}
      <div class="uc-initiative">⚡${unit.stats.initiative.toFixed(1)}</div>
      ${effIcons ? `<div class="uc-status-icons">${effIcons}</div>` : ''}
      <div class="bf-dmg-preview" aria-hidden="true"></div>
    `;

    card.addEventListener('click', () => handleCardClick(unit));
    card.addEventListener('mouseenter', () => updateTargetPreview(card, unit));
    card.addEventListener('mouseleave', () => clearTargetPreview(card));

    return card;
  }

  function updateTargetPreview(card, unit) {
    const bs = Battle.getState();
    if (!bs || !bs.pendingAction || bs.isOver) return;

    const prev = card.querySelector('.bf-dmg-preview');
    if (!prev) return;

    if (bs.pendingAction.type === 'attack') {
      if (unit.side !== 'enemy' || !unit.isAlive) return;
      const attacker = bs.pendingAction.attacker;
      if (!attacker) return;
      const est = Battle.estimateAttackDamage(attacker, unit);
      card.classList.remove('preview-dmg-heal');
      if (!est || est.unreachable) {
        prev.textContent = 'Нет досягаемости';
        card.classList.add('preview-dmg');
        return;
      }
      prev.textContent = `≈${est.typical} (крит ~${est.crit})`;
      card.classList.add('preview-dmg');
      return;
    }

    if (bs.pendingAction.type === 'spell') {
      // Резерв под выбор цели заклинанием / AoE
      clearTargetPreview(card);
    }
  }

  function clearTargetPreview(card) {
    card.classList.remove('preview-dmg', 'preview-dmg-heal');
  }

  function handleCardClick(unit) {
    const bs = Battle.getState();
    if (!bs || bs.isOver) return;

    if (bs.pendingAction && unit.side === 'enemy' && unit.isAlive) {
      markTargetable(false);
      Battle.selectTarget(unit);
      return;
    }

    if (!bs.pendingAction) {
      openUnitDetail(unit);
    }
  }

  function renderTurnOrder(battleState) {
    const track = document.getElementById('turn-order-track');
    if (!track || !battleState) return;

    track.textContent = '';
    const { turnOrder, currentIdx } = battleState;

    turnOrder.forEach((unit, i) => {
      const chip = document.createElement('div');
      chip.className = `turn-chip ${unit.side === 'ally' ? 'turn-chip-ally' : 'turn-chip-enemy'}`;
      if (i === currentIdx) chip.classList.add('turn-chip-current');
      if (!unit.isAlive) chip.classList.add('turn-chip-dead');
      chip.innerHTML = `
        <span class="turn-chip-icon">${unit.icon || '❓'}</span>
        <span class="turn-chip-name">${unit.name}</span>
      `;
      chip.title = `${unit.name} (${unit.side === 'ally' ? 'союзник' : 'враг'})${unit.isAlive ? '' : ', выбыл'}`;
      track.appendChild(chip);
    });
  }

  function openUnitDetail(unit) {
    const modal = document.getElementById('unit-detail-modal');
    const portrait = document.getElementById('ud-portrait');
    const name = document.getElementById('ud-name');
    const hpFill = document.getElementById('ud-hp-fill');
    const hpText = document.getElementById('ud-hp-text');
    const statsEl = document.getElementById('ud-stats');
    const abEl = document.getElementById('ud-abilities');

    if (!modal || !name) return;

    if (unit.portrait) {
      portrait.innerHTML = `<img src="${unit.portrait}" alt="" class="ud-portrait-img" draggable="false">`;
    } else {
      portrait.innerHTML = '';
      portrait.textContent = unit.icon || '⚔️';
    }

    name.textContent = unit.name;
    const hpP = unit.stats.maxHp > 0 ? (unit.stats.hp / unit.stats.maxHp) * 100 : 0;
    hpFill.style.width = `${hpP}%`;
    hpText.textContent = `${unit.stats.hp} / ${unit.stats.maxHp} HP`;

    const s = unit.stats;
    statsEl.innerHTML = `
      <div class="ud-stat"><div class="ud-lab">Ближний урон</div><div class="ud-val">${s.meleeAtk}</div></div>
      <div class="ud-stat"><div class="ud-lab">Ближняя защита</div><div class="ud-val">${s.meleeDef}</div></div>
      <div class="ud-stat"><div class="ud-lab">Дальний урон</div><div class="ud-val">${s.rangeAtk}</div></div>
      <div class="ud-stat"><div class="ud-lab">Дальняя защита</div><div class="ud-val">${s.rangeDef}</div></div>
      <div class="ud-stat"><div class="ud-lab">Магия</div><div class="ud-val">${s.magic}</div></div>
      <div class="ud-stat"><div class="ud-lab">Маг. защита</div><div class="ud-val">${s.magicDef}</div></div>
      <div class="ud-stat"><div class="ud-lab">Инициатива</div><div class="ud-val">${s.initiative.toFixed(1)}</div></div>
      <div class="ud-stat"><div class="ud-lab">Ряд / колонка</div><div class="ud-val">${unit.row} / ${unit.column}</div></div>
    `;

    const abParts = [];
    (unit.abilities || []).forEach(a => {
      abParts.push(`<div class="ud-ability"><div class="ud-an">${a.name}</div><div class="ud-ad">${a.desc || ''}</div></div>`);
    });
    (unit.spells || []).forEach(sp => {
      const extra = [];
      if (sp.cost != null) extra.push(`стоимость ${sp.cost}`);
      if (sp.damage) extra.push(`урон ${sp.damage.min}–${sp.damage.max}`);
      if (sp.heal) extra.push(`лечение ${sp.heal.min}–${sp.heal.max}`);
      abParts.push(`<div class="ud-ability"><div class="ud-an">${sp.name}</div><div class="ud-ad">${sp.desc || ''}${extra.length ? ' · ' + extra.join(', ') : ''}</div></div>`);
    });
    abEl.innerHTML = abParts.length ? abParts.join('') : '<div class="ud-ad">Нет описаний.</div>';

    modal.classList.remove('hidden');
  }

  function closeUnitDetail(ev) {
    const modal = document.getElementById('unit-detail-modal');
    if (!modal) return;
    if (ev && ev.target !== ev.currentTarget) return;
    modal.classList.add('hidden');
  }

  function showAbilityTooltip(ev) {
    const el = document.getElementById('battle-skill-tooltip');
    if (!el) return;

    const unit = Battle.getCurrentUnit();
    const spells = unit && unit.spells && unit.spells.length ? unit.spells : null;
    const abilities = unit && unit.abilities && unit.abilities.length ? unit.abilities : null;

    let title = 'Способность';
    let body = 'При нажатии герой действует по правилам класса (ИИ выбирает заклинание).';
    let meta = '';

    if (unit && unit.side === 'ally') {
      if (spells) {
        title = 'Заклинания';
        body = spells.map(s => {
          const bits = [s.desc || s.name];
          if (s.cost != null) bits.push(`Мана: ${s.cost}`);
          if (s.target) bits.push(`Цель: ${s.target}`);
          return `• ${s.name}: ${bits.join(' · ')}`;
        }).join('\n');
      } else if (abilities) {
        title = 'Навыки';
        body = abilities.map(a => `• ${a.name}: ${a.desc || '—'}`).join('\n');
      }
      meta = unit.name;
    }

    el.innerHTML = `<div class="bst-title">${title}</div><div class="bst-body">${body.replace(/\n/g, '<br>')}</div>${meta ? `<div class="bst-meta">${meta}</div>` : ''}`;
    el.hidden = false;
    moveAbilityTooltip(ev);
  }

  function hideAbilityTooltip() {
    const el = document.getElementById('battle-skill-tooltip');
    if (el) el.hidden = true;
  }

  function moveAbilityTooltip(ev) {
    const el = document.getElementById('battle-skill-tooltip');
    if (!el || el.hidden) return;
    const pad = 14;
    let x = ev.clientX + pad;
    let y = ev.clientY + pad;
    el.style.left = `${Math.min(x, window.innerWidth - el.offsetWidth - 8)}px`;
    el.style.top = `${Math.min(y, window.innerHeight - el.offsetHeight - 8)}px`;
  }

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

  function requestTarget() {
    const bs = Battle.getState();
    if (!bs) return;
    markTargetable(true);
  }

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

    const btnAuto = document.getElementById('btn-auto');
    if (btnAuto) {
      const mode = bs?.mode;
      btnAuto.classList.toggle('active', mode === 'auto');
    }
  }

  function showDamageNumber(instanceId, value, type) {
    const card = document.querySelector(`[data-instance-id="${instanceId}"]`);
    if (!card) return;

    const rect = card.getBoundingClientRect();
    if (!rect.width) return;

    const el = document.createElement('div');
    el.className = `float-num float-${type}`;

    switch (type) {
      case 'miss':   el.textContent = 'ПРОМАХ!';       break;
      case 'heal':   el.textContent = `+${value} ❤️`;  break;
      case 'crit':   el.textContent = `💥 ${value}!`;  break;
      default:       el.textContent = `-${value}`;      break;
    }

    const jitter = (Math.random() - 0.5) * 32;

    el.style.left = `${rect.left + rect.width / 2 + jitter}px`;
    el.style.top  = `${rect.top + 8}px`;

    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function showResult(result, battleState) {
    const overlay = document.getElementById('battle-result');
    if (!overlay) return;

    const icon  = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const rewardsEl = document.getElementById('result-rewards');

    const dead_allies  = battleState.allies.filter(u => !u.isAlive).length;
    const dead_enemies = battleState.enemies.filter(u => !u.isAlive).length;

    if (result === 'victory') {
      icon.textContent  = '🏆';
      title.textContent = 'ПОБЕДА!';
      title.style.color = '#ffe066';
      if (rewardsEl) rewardsEl.textContent = `Врагов повержено: ${dead_enemies} | Потери: ${dead_allies}/${battleState.allies.length}`;
    } else {
      icon.textContent  = '💀';
      title.textContent = 'ПОРАЖЕНИЕ!';
      title.style.color = '#ff4444';
      if (rewardsEl) rewardsEl.textContent = `Все союзники пали на раунде ${battleState.round}`;
    }

    overlay.classList.remove('hidden');
  }

  return {
    render,
    requestTarget,
    markTargetable,
    showResult,
    updateCurrentUnitInfo,
    showDamageNumber,
    showAbilityTooltip,
    hideAbilityTooltip,
    moveAbilityTooltip,
    openUnitDetail,
    closeUnitDetail,
  };
})();
