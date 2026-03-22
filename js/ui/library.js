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
    if (_tab === 'allies') {
      UnitCard.attachCardClicks(grid);
    } else {
      grid.querySelectorAll('.ec[data-enemy-id]').forEach(el => {
        el.addEventListener('click', () => showEnemyDetail(el.dataset.enemyId));
      });
    }
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

  // ── Enemy data preparation ────────────────────────────────────

  function _prepareEnemies() {
    const templates = typeof ENEMY_TEMPLATES !== 'undefined' ? ENEMY_TEMPLATES : {};

    // Build locations map (exclude boss encounters — they are named after the boss, not a place)
    const locMap = {};
    if (typeof LOCATIONS !== 'undefined') {
      LOCATIONS.forEach(loc => {
        if ((loc.id || '').startsWith('boss_')) return;
        (loc.enemies || []).forEach(eId => {
          if (!locMap[eId]) locMap[eId] = [];
          locMap[eId].push(loc.name);
        });
      });
    }

    // Flatten base stats + attach locations
    return Object.values(templates).map(e => ({
      ...e,
      ...(e.base || {}),
      locations: locMap[e.id] || [],
      isBoss: e.isBossUnit || false,
    }));
  }

  // ── buildEnemyCard ────────────────────────────────────────────

  function buildEnemyCard(enemy) {
    const isBoss = enemy.isBoss || false;
    const typeMap = {
      beast: 'ec-beast', undead: 'ec-undead', human: 'ec-human',
      orc: 'ec-orc', construct: 'ec-construct', spirit: 'ec-spirit',
    };
    const typeClass = typeMap[enemy.race] || 'ec-human';

    const atkVal  = enemy.magic || enemy.meleeAtk || enemy.rangeAtk || 0;
    const atkIcon = enemy.magic ? '🔮' : enemy.rangeAtk ? '🏹' : '⚔️';
    const atkLbl  = enemy.magic ? 'МАГ' : enemy.rangeAtk ? 'RNG' : 'ATK';

    const zones = (enemy.locations || []).slice(0, 2).join(', ') || 'Неизвестно';

    const ab = (enemy.abilities || [])[0];
    const abHTML = ab
      ? `<span class="ec-ab-name">${ab.name}</span> — ${(ab.desc || '').slice(0, 60)}${(ab.desc || '').length > 60 ? '…' : ''}`
      : '<span style="opacity:.35">Нет особых способностей</span>';

    return `
      <div class="ec ${typeClass}${isBoss ? ' ec-boss' : ''}" data-enemy-id="${enemy.id}">
        <div class="ec-head">
          <span>${(enemy.race || 'ВРАГ').toUpperCase()} · ${(enemy.attackType || '').toUpperCase()}</span>
          <span>${isBoss ? '👑 БОСС' : '⚡ ' + (enemy.initiative || '?')}</span>
        </div>
        <div class="ec-art">
          <div class="ec-med">${enemy.icon || '👾'}</div>
          <div class="ec-s stl"><span class="si">${atkIcon}</span><span class="sv">${atkVal}</span><span class="sl">${atkLbl}</span></div>
          <div class="ec-s str"><span class="si">🛡</span><span class="sv">${enemy.meleeDef || 0}</span><span class="sl">DEF</span></div>
          <div class="ec-s sbl"><span class="si">❤️</span><span class="sv">${enemy.hp || 0}</span><span class="sl">HP</span></div>
          <div class="ec-s sbr"><span class="si">✨</span><span class="sv">${enemy.magicDef || 0}</span><span class="sl">МЗ</span></div>
        </div>
        <div class="ec-name">
          <div class="en${isBoss ? ' en-boss' : ''}">${enemy.name}</div>
          <div class="er">${enemy.race || '—'} · ${isBoss ? 'босс' : 'обычный'}</div>
        </div>
        <div class="ec-ability">${abHTML}</div>
        <div class="ec-footer">
          <div class="ec-zones">📍 ${zones}</div>
          <div class="ec-init">⚡ <b>${enemy.initiative || '?'}</b></div>
        </div>
      </div>`;
  }

  // ── Enemy detail overlay ──────────────────────────────────────

  function showEnemyDetail(id) {
    const all    = _prepareEnemies();
    const enemy  = all.find(e => e.id === id);
    if (!enemy) return;

    const existing = document.getElementById('enemy-detail-overlay');
    if (existing) existing.remove();

    const b = enemy.base || {};
    const zones = (enemy.locations || []).join(', ') || '—';
    const abRows = (enemy.abilities || []).map(ab => `
      <div class="ed-ab">
        <span class="ec-ab-name">${ab.name}</span>
        <span class="ed-ab-desc">${ab.desc || ''}</span>
      </div>`).join('') || '<div style="opacity:.4">Нет способностей</div>';

    const statRows = [
      ['HP', enemy.hp || 0],
      ['Ближн. атака', enemy.meleeAtk],
      ['Ближн. защита', enemy.meleeDef],
      ['Дальн. атака', enemy.rangeAtk],
      ['Дальн. защита', enemy.rangeDef],
      ['Магия', enemy.magic],
      ['Маг. защита', enemy.magicDef],
      ['Инициатива', enemy.initiative],
    ].filter(([, v]) => v).map(([l, v]) => `
      <div class="ed-stat"><span>${l}</span><span>${v}</span></div>`).join('');

    const ov = document.createElement('div');
    ov.id = 'enemy-detail-overlay';
    ov.className = 'enemy-detail-overlay';
    ov.innerHTML = `
      <div class="ed-modal">
        <button class="ed-close" onclick="document.getElementById('enemy-detail-overlay').remove()">✕</button>
        <div class="ed-left">${buildEnemyCard(enemy)}</div>
        <div class="ed-right">
          <div class="ed-title">${enemy.name}${enemy.isBoss ? ' 👑' : ''}</div>
          <div class="ed-meta">${enemy.race || '—'} · ${enemy.attackType || '—'}</div>
          <div class="ed-section">Характеристики</div>
          <div class="ed-stats">${statRows}</div>
          <div class="ed-section">Способности</div>
          <div class="ed-abs">${abRows}</div>
          <div class="ed-section">Встречается</div>
          <div class="ed-locs">📍 ${zones}</div>
        </div>
      </div>`;
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  // ── Enemies grid ──────────────────────────────────────────────

  function _buildEnemies() {
    const q    = _query.toLowerCase();
    const list = _prepareEnemies().filter(e =>
      !q || e.name.toLowerCase().includes(q) || (e.race || '').toLowerCase().includes(q)
    );
    if (!list.length) return '<div class="v-empty">Ничего не найдено</div>';
    return list.map(e => buildEnemyCard(e)).join('');
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
