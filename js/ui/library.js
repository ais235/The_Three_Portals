// ================================================================
// LIBRARY UI — Standalone library screen
// ================================================================

const LibraryUI = (() => {

  let _tab   = 'allies';
  let _query = '';

  // ── Stat row helper ───────────────────────────────────────────

  function _statRow(label, val) {
    return `<div class="lib-stat-row">
      <span class="lib-stat-label">${label}</span>
      <span class="lib-stat-val">${val}</span>
    </div>`;
  }

  // ── Render ────────────────────────────────────────────────────

  function render() {
    _query = '';
    const searchEl = document.querySelector('#screen-library .lib-search');
    if (searchEl) searchEl.value = '';
    _setTabActive(_tab);
    _renderGrid();
  }

  function _renderGrid() {
    const grid = document.getElementById('library-grid');
    if (!grid) return;
    grid.innerHTML = _tab === 'allies' ? _buildAllies() : _buildEnemies();
    if (_tab === 'allies') UnitCard.attachCardClicks(grid);
  }

  // ── Allies ────────────────────────────────────────────────────

  function _buildAllies() {
    const q    = _query.toLowerCase();
    const list = ALLIES.filter(a =>
      !q ||
      a.name.toLowerCase().includes(q) ||
      (a.race  || '').toLowerCase().includes(q) ||
      (a.class || '').toLowerCase().includes(q)
    );
    if (!list.length) return '<div class="v-empty">Ничего не найдено</div>';
    return list.map(ally => {
      const isOwned = GameState.isUnlocked(ally.id);
      return UnitCard.buildMiniCard(ally, { showLocked: !isOwned });
    }).join('');
  }

  // ── Enemies ───────────────────────────────────────────────────

  function _buildEnemies() {
    const templates = typeof ENEMY_TEMPLATES !== 'undefined' ? ENEMY_TEMPLATES : {};
    const q    = _query.toLowerCase();
    const list = Object.values(templates).filter(e =>
      !q || e.name.toLowerCase().includes(q)
    );
    if (!list.length) return '<div class="v-empty">Ничего не найдено</div>';

    // Build "found in locations" map
    const locMap = {};
    if (typeof LOCATIONS !== 'undefined') {
      LOCATIONS.forEach(loc => {
        (loc.enemies || []).forEach(eId => {
          if (!locMap[eId]) locMap[eId] = [];
          locMap[eId].push(loc.name);
        });
      });
    }

    return list.map(e => {
      const b    = e.base || {};
      const locs = (locMap[e.id] || []).slice(0, 3).join(', ') || '—';
      const abHTML = (e.abilities || []).map(ab => `
        <div class="lib-ability">
          <span class="lib-ab-name">${ab.name}</span>
          <span class="lib-ab-desc">${ab.desc || ''}</span>
        </div>`).join('');

      return `
        <div class="lib-card lib-enemy-card ${e.isBossUnit ? 'lib-boss-card' : ''}">
          <div class="lib-card-head">
            <span class="lib-icon">${e.icon || '👹'}</span>
            <div class="lib-card-title">
              <div class="lib-name">${e.name}${e.isBossUnit ? ' 👑' : ''}</div>
              <div class="lib-meta">
                <span class="lib-cls">${e.race || '—'}</span>
                <span class="lib-cls">${e.attackType || 'melee'}</span>
              </div>
            </div>
          </div>
          <div class="lib-stats">
            ${_statRow('HP', b.hp || 0)}
            ${b.meleeAtk ? _statRow('Ближн. атк', b.meleeAtk) : ''}
            ${b.rangeAtk ? _statRow('Дальн. атк', b.rangeAtk) : ''}
            ${b.magic    ? _statRow('Магия',       b.magic)    : ''}
            ${_statRow('Инициатива', b.initiative || 0)}
          </div>
          ${abHTML ? `<div class="lib-abilities">${abHTML}</div>` : ''}
          <div class="lib-locs">📍 ${locs}</div>
        </div>`;
    }).join('');
  }

  // ── Tab switch ────────────────────────────────────────────────

  function switchTab(tab) {
    _tab = tab;
    _setTabActive(tab);
    if (tab === 'enemies' && typeof NPCSystem !== 'undefined') {
      NPCSystem.trigger('library', 'search_found');
    }
    _renderGrid();
  }

  function _setTabActive(tab) {
    document.querySelectorAll('#screen-library .lib-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
  }

  // ── Search ────────────────────────────────────────────────────

  function filter(q) {
    _query = q;
    if (q.length > 2 && typeof NPCSystem !== 'undefined') {
      NPCSystem.trigger('library', 'search_found');
    }
    _renderGrid();
  }

  return { render, switchTab, filter };

})();
