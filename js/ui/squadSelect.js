// ================================================================
// SQUAD SELECT — Экран выбора отряда перед боем
// ================================================================

const SquadSelect = (() => {
  let currentLoc   = null;
  let selectedIds  = [];  // array of allyId strings

  // Column default by class
  const CLASS_COL = {
    tank:        1, spearman: 1, damage: 1,
    archer:      2, crossbowman: 2,
    mage_aoe:    3, mage_single: 3,
    mage_healer: 3, mage_buffer: 3, mage_debuff: 3,
  };

  // ── Open ─────────────────────────────────────────────────────

  function open(location) {
    currentLoc  = location;
    // Restore last squad, filtering out cards that no longer pass constraints
    const last = GameState.getLastSquad ? GameState.getLastSquad() : [];
    const uniqLast = [...new Set(last)];
    selectedIds = uniqLast.filter(id => _cardPassesConstraint(id));
    // Trim if over limit
    while (selectedIds.length > currentLoc.maxUnits) selectedIds.pop();

    render();
    App.showScreen('squad_select');
  }

  function _cardPassesConstraint(allyId) {
    if (!GameState.isUnlocked(allyId)) return false;
    const lvl = GameState.getCardLevel(allyId);
    if (!lvl) return false;
    return lvl.stars <= currentLoc.maxStars;
  }

  // ── Render ────────────────────────────────────────────────────

  function render() {
    if (!currentLoc) return;
    _renderHeader();
    _renderCardPool();
    _renderFormation();
    _updateStartBtn();
  }

  function _renderHeader() {
    const h = document.getElementById('ss-loc-name');
    if (h) h.textContent = currentLoc.name;

    const squadPower = _calculateSelectedSquadPower();
    const c = document.getElementById('ss-constraints');
    if (c) c.innerHTML = `
      <span class="ss-constraint">Макс. звёзд: ${'★'.repeat(currentLoc.maxStars)}</span>
      <span class="ss-constraint">Макс. юнитов: ${currentLoc.maxUnits}</span>
      <span class="ss-constraint" id="ss-count-badge">${selectedIds.length}/${currentLoc.maxUnits} выбрано</span>
      <span class="ss-constraint" id="ss-power-badge">⚔ Уровень силы отряда: ${squadPower}</span>
    `;
  }

  function _calculateSelectedSquadPower() {
    if (!selectedIds.length) return 0;

    const colRow = { 1: 1, 2: 1, 3: 1 };
    const units = [];

    selectedIds.forEach(allyId => {
      const ally = ALLIES.find(a => a.id === allyId);
      if (!ally) return;
      const col = CLASS_COL[ally.class] || 1;
      const row = colRow[col]++;
      const unit = createBattleAlly(allyId, col, row);
      if (unit) units.push(unit);
    });

    if (typeof calculateGroupPower === 'function') {
      return calculateGroupPower(units);
    }
    if (typeof calculateUnitPower === 'function') {
      return units.reduce((acc, u) => acc + calculateUnitPower(u), 0);
    }
    return 0;
  }

  function _renderCardPool() {
    const pool = document.getElementById('ss-card-pool');
    if (!pool) return;

    const unlockedIds = GameState.getUniqueUnlockedIds ? GameState.getUniqueUnlockedIds() : [...new Set(GameState.getUnlocked())];
    const eligible = unlockedIds.filter(id => _cardPassesConstraint(id));
    const ineligible = unlockedIds.filter(id => !_cardPassesConstraint(id));

    let html = '';

    if (eligible.length) {
      html += '<div class="ss-pool-section-title">Доступные карты</div>';
      eligible.forEach(id => {
        html += _buildCardThumb(id, false);
      });
    }

    if (ineligible.length) {
      html += '<div class="ss-pool-section-title ss-grey">Слишком высокая звёздность</div>';
      ineligible.forEach(id => {
        html += _buildCardThumb(id, true);
      });
    }

    pool.innerHTML = html;
  }

  function _buildCardThumb(allyId, disabled) {
    const ally = ALLIES.find(a => a.id === allyId);
    if (!ally) return '';
    const lvl  = GameState.getCardLevel(allyId) || { stars: 1, powerLevel: 1 };
    const cop  = GameState.getCardCopyCount(allyId);
    const sel  = selectedIds.includes(allyId);
    const cls  = ally.class || 'damage';
    const col  = CLASS_COL[cls] || 1;

    const colIcon = col === 1 ? '⚔️' : col === 2 ? '🏹' : '✨';
    const classColor = `var(--col-${cls.replace('_', '-')}, #444)`;

    const disabledAttr = disabled ? 'disabled' : '';
    const selClass     = sel  ? 'ss-thumb-selected' : '';
    const disClass     = disabled ? 'ss-thumb-disabled' : '';

    return `
      <div class="ss-thumb ${selClass} ${disClass}"
           onclick="${disabled ? '' : `SquadSelect.toggleCard('${allyId}')`}"
           title="${ally.name} ★${lvl.stars}">
        <div class="ss-thumb-icon">${ally.icon}</div>
        <div class="ss-thumb-name">${ally.name}</div>
        <div class="ss-thumb-meta">
          <span class="ss-thumb-stars">${'★'.repeat(lvl.stars)}</span>
          <span class="ss-thumb-col">${colIcon}</span>
          ${cop > 1 ? `<span class="ss-thumb-copies" title="Копий в коллекции">×${cop}</span>` : ''}
        </div>
        ${sel ? '<div class="ss-thumb-check">✓</div>' : ''}
        ${disabled ? `<div class="ss-thumb-lock">★${lvl.stars}≤${currentLoc.maxStars}?</div>` : ''}
      </div>`;
  }

  function _renderFormation() {
    for (let col = 1; col <= 3; col++) {
      const colEl = document.getElementById(`ss-col-${col}`);
      if (!colEl) continue;

      const inCol = selectedIds.filter(id => {
        const ally = ALLIES.find(a => a.id === id);
        return ally && (CLASS_COL[ally.class] || 1) === col;
      });

      const colSlots = document.getElementById(`ss-col-slots-${col}`);
      if (!colSlots) continue;

      colSlots.innerHTML = inCol.map(id => {
        const ally = ALLIES.find(a => a.id === id);
        const lvl  = GameState.getCardLevel(id) || { stars: 1 };
        return `
          <div class="ss-slot ss-slot-filled" onclick="SquadSelect.toggleCard('${id}')">
            <span class="ss-slot-icon">${ally?.icon || '?'}</span>
            <span class="ss-slot-name">${ally?.name || id}</span>
            <span class="ss-slot-star">${'★'.repeat(lvl.stars)}</span>
            <span class="ss-slot-remove">✕</span>
          </div>`;
      }).join('');

      // Empty slots up to maxUnits
      const maxPerCol = currentLoc.maxUnits;
      for (let i = inCol.length; i < Math.min(3, maxPerCol - inCol.length + inCol.length); i++) {
        colSlots.innerHTML += `<div class="ss-slot ss-slot-empty">— пусто —</div>`;
      }
    }
  }

  // ── Toggle card in squad ──────────────────────────────────────

  function toggleCard(allyId) {
    const idx = selectedIds.indexOf(allyId);
    if (idx >= 0) {
      // Remove
      selectedIds.splice(idx, 1);
    } else {
      // Add if under limit
      if (selectedIds.includes(allyId)) {
        _showToast('В бой можно взять только одну копию каждого героя', 'error');
        return;
      }
      if (selectedIds.length >= currentLoc.maxUnits) {
        _showToast(`Максимум ${currentLoc.maxUnits} юнитов!`, 'error');
        return;
      }
      selectedIds.push(allyId);
    }
    render();
  }

  function _updateStartBtn() {
    const btn = document.getElementById('ss-start-btn');
    if (!btn) return;
    const ok = selectedIds.length > 0;
    btn.disabled = !ok;
    btn.textContent = ok
      ? `⚔️ В бой! (${selectedIds.length} юнит${selectedIds.length > 1 ? 'а' : ''})`
      : 'Выберите хотя бы одного';
  }

  // ── Start battle ──────────────────────────────────────────────

  function startBattle() {
    if (!selectedIds.length || !currentLoc) return;

    // Save squad
    if (typeof GameState.setLastSquad === 'function') {
      GameState.setLastSquad([...new Set(selectedIds)]);
    }

    // Build ally units – assign rows within each column
    const colRow = { 1: 1, 2: 1, 3: 1 };
    const allies = [];
    selectedIds.forEach(allyId => {
      const ally = ALLIES.find(a => a.id === allyId);
      if (!ally) return;
      const col = CLASS_COL[ally.class] || 1;
      const row = colRow[col]++;
      const unit = createBattleAlly(allyId, col, row);
      if (unit) allies.push(unit);
    });

    if (!allies.length) {
      _showToast('Не удалось создать отряд', 'error');
      return;
    }

    // Generate enemies
    const enemies = generateLocationEnemies(currentLoc);

    // Launch battle
    App.initCustomBattle(allies, enemies, currentLoc);
  }

  // ── Toast ─────────────────────────────────────────────────────

  function _showToast(msg, type = 'info') {
    let t = document.querySelector('.squad-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'village-toast squad-toast';
      document.body.appendChild(t);
    }
    t.textContent   = msg;
    t.className     = `village-toast squad-toast toast-${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  return { open, render, toggleCard, startBattle };
})();
