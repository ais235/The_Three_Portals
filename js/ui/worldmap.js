// ================================================================
// WORLDMAP UI — Карта мира
// ================================================================

const WorldMap = (() => {
  // Grid cell dimensions (px)
  const CELL_W  = 180;
  const CELL_H  = 115;
  const NODE_W  = 128;
  const NODE_H  = 76;
  const COLS    = 3;       // map uses col indices 0, 1, 2
  const MAX_ROW = 13;      // boss_final row index

  let selectedLoc = null;

  // ── Init ──────────────────────────────────────────────────────

  function init() { /* called by App.init */ }

  // ── Render ────────────────────────────────────────────────────

  function render() {
    _renderMap();
    _renderPanel(null);
  }

  function _renderMap() {
    const container = document.getElementById('wm-map-container');
    if (!container) return;

    const totalH = (MAX_ROW + 1) * CELL_H + 20;
    const totalW = COLS * CELL_W;

    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.width    = totalW + 'px';
    container.style.height   = totalH + 'px';
    container.style.minWidth = totalW + 'px';

    // Zone background bands
    _renderZoneBands(container, totalW, totalH);

    // SVG connector layer (below nodes)
    const svg = _buildSVG(totalW, totalH);
    container.appendChild(svg);

    // Nodes
    const completed = GameState.getUnlocked ? [] : [];
    LOCATIONS.forEach(loc => {
      const state = _nodeState(loc);
      const node  = _buildNode(loc, state);
      container.appendChild(node);
    });

    // Draw SVG lines after nodes exist (positions calculable)
    _drawConnectors(svg);
  }

  // ── Zone bands ────────────────────────────────────────────────

  function _renderZoneBands(container, totalW) {
    const zoneRows = [
      { zones: [1], rowStart: 0, rowEnd: 4  },
      { zones: [2], rowStart: 5, rowEnd: 7  },
      { zones: [3], rowStart: 8, rowEnd: 10 },
      { zones: [4], rowStart: 11, rowEnd: 12 },
      { zones: [5], rowStart: 13, rowEnd: 13 },
    ];

    zoneRows.forEach(({ zones, rowStart, rowEnd }) => {
      const meta = ZONE_META[zones[0]];
      const band = document.createElement('div');
      band.className   = 'wm-zone-band';
      band.style.top   = (rowStart * CELL_H) + 'px';
      band.style.height = ((rowEnd - rowStart + 1) * CELL_H) + 'px';
      band.style.width  = totalW + 'px';
      band.style.background = meta.color;
      band.style.borderTop  = `2px solid ${meta.borderColor}`;

      const label = document.createElement('div');
      label.className = 'wm-zone-label';
      label.textContent = meta.icon + ' ' + meta.label;
      band.appendChild(label);
      container.appendChild(band);
    });
  }

  // ── SVG layer ─────────────────────────────────────────────────

  function _buildSVG(w, h) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width',  w);
    svg.setAttribute('height', h);
    svg.style.position = 'absolute';
    svg.style.top      = '0';
    svg.style.left     = '0';
    svg.style.zIndex   = '1';
    svg.style.pointerEvents = 'none';
    return svg;
  }

  function _drawConnectors(svg) {
    LOCATIONS.forEach(loc => {
      if (!loc.requires || !loc.requires.length) return;
      const toCenter = _nodeCenter(loc);

      loc.requires.forEach(reqId => {
        const reqLoc = LOCATIONS.find(l => l.id === reqId);
        if (!reqLoc) return;
        const fromCenter = _nodeCenter(reqLoc);

        const isAvail = _nodeState(loc) !== 'locked';
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromCenter.x);
        line.setAttribute('y1', fromCenter.y);
        line.setAttribute('x2', toCenter.x);
        line.setAttribute('y2', toCenter.y);
        line.setAttribute('stroke', isAvail ? '#5a8a5a' : '#3a3a5a');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-dasharray', isAvail ? '' : '6,4');
        line.setAttribute('opacity', '0.7');
        svg.appendChild(line);
      });
    });
  }

  // ── Nodes ─────────────────────────────────────────────────────

  function _nodeCenter(loc) {
    return {
      x: loc.pos.col * CELL_W + CELL_W / 2,
      y: loc.pos.row * CELL_H + CELL_H / 2,
    };
  }

  function _nodeState(loc) {
    const completed = GameState.isCompleted(loc.id);
    if (completed) return 'completed';
    const avail = _isAvailable(loc);
    if (!avail) return 'locked';
    return loc.isBoss ? 'boss' : 'available';
  }

  function _isAvailable(loc) {
    if (!loc.requires || !loc.requires.length) return true;
    if (loc.requiresAny) return loc.requires.some(r => GameState.isCompleted(r));
    return loc.requires.every(r => GameState.isCompleted(r));
  }

  function _buildNode(loc, state) {
    const node = document.createElement('div');
    node.className  = `wm-node wm-state-${state}`;
    node.dataset.id = loc.id;

    const { x, y } = _nodeCenter(loc);
    node.style.position = 'absolute';
    node.style.left   = (x - NODE_W / 2) + 'px';
    node.style.top    = (y - NODE_H / 2) + 'px';
    node.style.width  = NODE_W + 'px';
    node.style.height = NODE_H + 'px';
    node.style.zIndex = '2';

    const stars = loc.maxStars;
    const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const completedTimes = GameState.isCompleted(loc.id) ? 1 : 0;

    const zoneIcon = ZONE_META[loc.zone]?.icon || '📍';
    const bossTag  = loc.isBoss ? '<span class="wm-boss-tag">БОСС</span>' : '';
    const lockIcon = state === 'locked' ? '<div class="wm-lock">🔒</div>' : '';
    const checkIcon = state === 'completed' ? '<div class="wm-check">✓</div>' : '';

    node.innerHTML = `
      ${lockIcon}${checkIcon}${bossTag}
      <div class="wm-node-icon">${loc.isBoss ? '👑' : zoneIcon}</div>
      <div class="wm-node-name">${loc.name}</div>
      <div class="wm-node-stars">${starStr}</div>
    `;

    if (state !== 'locked') {
      node.addEventListener('click', () => _selectLoc(loc, state));
    }
    if (state === 'selected' || (selectedLoc && selectedLoc.id === loc.id)) {
      node.classList.add('wm-selected');
    }
    return node;
  }

  // ── Side panel ────────────────────────────────────────────────

  function _selectLoc(loc, state) {
    selectedLoc = loc;
    // Refresh highlights
    document.querySelectorAll('.wm-node').forEach(n => {
      n.classList.toggle('wm-selected', n.dataset.id === loc.id);
    });
    _renderPanel(loc, state || _nodeState(loc));
  }

  function _renderPanel(loc, state) {
    const panel = document.getElementById('wm-detail-panel');
    if (!panel) return;

    if (!loc) {
      panel.innerHTML = `
        <div class="wm-panel-empty">
          <div class="wm-pe-icon">🗺️</div>
          <div class="wm-pe-text">Выберите локацию на карте</div>
        </div>`;
      return;
    }

    const nodeState = state || _nodeState(loc);
    const isCompleted = nodeState === 'completed';
    const isAvail     = nodeState !== 'locked';

    const zoneMeta = ZONE_META[loc.zone] || {};
    const rewards  = loc.rewards || {};
    const stars    = '★'.repeat(loc.maxStars) + '☆'.repeat(5 - loc.maxStars);

    const enemyList = (loc.enemies || []).map(eId => {
      const t = ENEMY_TEMPLATES[eId];
      return t ? `<span class="wm-enemy-tag">${t.icon} ${t.name}</span>` : '';
    }).join('');

    const rewardHtml = `
      <div class="wm-reward-row">💰 ${rewards.coins[0]}–${rewards.coins[1]} монет</div>
      ${rewards.weaponChance > 0 ? `<div class="wm-reward-row">🗡️ Оружие: ${Math.round(rewards.weaponChance * 100)}%</div>` : ''}
      ${rewards.scrollChance > 0 ? `<div class="wm-reward-row">📜 Свиток (${rewards.scrollType}): ${Math.round(rewards.scrollChance * 100)}%</div>` : ''}
      ${rewards.artifact     ? `<div class="wm-reward-row artifact-reward">🏅 Артефакт!</div>` : ''}
    `;

    const btnHtml = isAvail
      ? `<button class="wm-fight-btn ${isCompleted ? 'secondary' : 'primary'}"
           onclick="WorldMap.openSquadSelect('${loc.id}')">
           ${isCompleted ? '🔄 Повторить' : '⚔️ В бой!'}
         </button>`
      : `<button class="wm-fight-btn locked-btn" disabled>🔒 Заблокировано</button>`;

    panel.innerHTML = `
      <div class="wm-panel-zone" style="color:${zoneMeta.borderColor || '#888'}">${zoneMeta.icon || ''} ${loc.zoneLabel || ''}</div>
      <div class="wm-panel-name">${loc.isBoss ? '👑 ' : ''}${loc.name}</div>
      <div class="wm-panel-stars">${stars}</div>
      <div class="wm-panel-desc">${loc.desc || ''}</div>
      <div class="wm-panel-section">
        <div class="wm-section-title">⚔️ Ограничения отряда</div>
        <div class="wm-constraint">Макс. звёздность: <strong>${'★'.repeat(loc.maxStars)}</strong></div>
        <div class="wm-constraint">Макс. единиц: <strong>${loc.maxUnits}</strong></div>
        <div class="wm-constraint">Врагов: <strong>${loc.enemyCount[0]}–${loc.enemyCount[1]}</strong></div>
      </div>
      <div class="wm-panel-section">
        <div class="wm-section-title">👹 Противники</div>
        <div class="wm-enemy-list">${enemyList}</div>
      </div>
      <div class="wm-panel-section">
        <div class="wm-section-title">🎁 Награды</div>
        ${rewardHtml}
      </div>
      ${isCompleted ? '<div class="wm-completed-badge">✓ Пройдено</div>' : ''}
      <div class="wm-panel-btn-wrap">${btnHtml}</div>
    `;
  }

  // ── Public: open squad select for location ────────────────────

  function openSquadSelect(locId) {
    const loc = LOCATIONS.find(l => l.id === locId);
    if (!loc) return;
    SquadSelect.open(loc);
  }

  return { init, render, openSquadSelect };
})();
