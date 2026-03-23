// ================================================================
// WORLDMAP UI — Карта мира (зонный режим)
// ================================================================

const WorldMap = {
  currentZone: 1,
  totalZones: 5,

  /** Фоны зон — PNG/JPG; если файла нет, подставится BG_FALLBACK */
  BG_FALLBACK: 'assets/building-bg.png',

  ZONE_META: {
    1: { name: 'Лесные предместья', bg: 'assets/zones/zone1.png', label: 'ЗОНА 1' },
    2: { name: 'Горный перевал',    bg: 'assets/zones/zone2.png', label: 'ЗОНА 2' },
    3: { name: 'Тёмный лес',        bg: 'assets/zones/zone3.png', label: 'ЗОНА 3' },
    4: { name: 'Крепость орков',    bg: 'assets/zones/zone4.png', label: 'ЗОНА 4' },
    5: { name: 'Замок некроманта',  bg: 'assets/zones/zone5.png', label: 'ЗОНА 5' },
  },

  init() { /* called by App.init */ },

  /** Смена фона с плавным появлением (кнопки ‹ › между зонами). */
  _applyZoneBackground(nextSrc) {
    const bg = document.getElementById('zone-bg');
    if (!bg) return;

    const cur = bg.getAttribute('src') || '';
    const same = cur === nextSrc || cur.endsWith(nextSrc);
    if (same) {
      bg.style.opacity = '1';
      return;
    }

    const fallback = this.BG_FALLBACK;
    bg.style.opacity = '0';

    const onDone = () => {
      bg.style.transition = 'opacity 0.4s ease';
      bg.style.opacity = '1';
      bg.onload = null;
      bg.onerror = null;
    };

    const load = (src, isFallback) => {
      bg.onload = onDone;
      bg.onerror = () => {
        bg.onload = null;
        bg.onerror = null;
        if (!isFallback && src !== fallback) {
          load(fallback, true);
        } else {
          onDone();
        }
      };
      bg.src = src;
    };

    load(nextSrc, false);
  },

  // Called by App.showScreen('worldmap')
  show() {
    this.renderZone(this.currentZone);
  },

  // Alias for backward compatibility with App.showScreen flow
  render() {
    this.show();
  },

  renderZone(zoneNum) {
    this.currentZone = zoneNum;
    const meta = this.ZONE_META[zoneNum];

    // Фон зоны — плавная смена при переключении ‹ ›
    this._applyZoneBackground(meta.bg);

    // Zone title
    const labelEl = document.getElementById('zone-label');
    const nameEl  = document.getElementById('zone-name');
    if (labelEl) labelEl.textContent = meta.label;
    if (nameEl)  nameEl.textContent  = meta.name;

    // Nav buttons
    const prevBtn = document.getElementById('zone-prev');
    const nextBtn = document.getElementById('zone-next');
    if (prevBtn) prevBtn.disabled = zoneNum <= 1;
    if (nextBtn) nextBtn.disabled = zoneNum >= this.totalZones;

    // Sort locations in current zone by orderX
    const locations = LOCATIONS
      .filter(l => l.zone === zoneNum)
      .sort((a, b) => (a.orderX || 0) - (b.orderX || 0));

    const container = document.getElementById('zone-nodes');
    if (!container) return;
    container.innerHTML = '';

    locations.forEach(loc => {
      const isCompleted = this._isCompleted(loc.id);
      const isLocked    = !this._isUnlocked(loc);
      const isBoss      = !!loc.isBoss;
      const starsMax    = loc.maxStars || 1;
      const starsStr    = '★'.repeat(starsMax) + '☆'.repeat(5 - starsMax);

      const classes = [
        'loc-node',
        isCompleted ? 'completed' : '',
        isLocked    ? 'locked'    : '',
        isBoss      ? 'boss'      : '',
      ].filter(Boolean).join(' ');

      const node = document.createElement('div');
      node.className      = classes;
      node.dataset.locId  = loc.id;
      node.innerHTML = `
        <div class="loc-icon-wrap">${loc.icon || '🗺️'}</div>
        <div class="loc-name">${loc.name}</div>
        <div class="loc-stars">${starsStr}</div>`;

      if (!isLocked) {
        node.addEventListener('click', () => this.selectLocation(loc.id));
      }
      container.appendChild(node);
    });

    // Close location panel when switching zones
    const panel = document.getElementById('location-panel');
    if (panel) panel.classList.remove('visible');
    const screen = document.getElementById('screen-worldmap');
    if (screen) screen.classList.remove('location-panel-open');
  },

  selectLocation(locId) {
    const loc = LOCATIONS.find(l => l.id === locId);
    if (!loc) return;

    // Highlight active node
    document.querySelectorAll('.loc-node').forEach(n => n.classList.remove('active'));
    const activeNode = document.querySelector(`.loc-node[data-loc-id="${locId}"]`);
    if (activeNode) activeNode.classList.add('active');

    const isCompleted = this._isCompleted(locId);
    const panel = document.getElementById('location-panel');
    if (!panel) return;

    const starsMax = loc.maxStars || 1;
    const starsStr = '★'.repeat(starsMax) + '☆'.repeat(5 - starsMax);

    const rewards  = loc.rewards || {};
    const coinsMin = Array.isArray(rewards.coins) ? rewards.coins[0] : (rewards.coins || '?');
    const coinsMax = Array.isArray(rewards.coins) ? rewards.coins[1] : '';
    const coinsStr = coinsMax ? `${coinsMin}–${coinsMax}` : coinsMin;

    const enemyCountStr = Array.isArray(loc.enemyCount)
      ? `${loc.enemyCount[0]}–${loc.enemyCount[1]}`
      : (loc.enemyCount || '?');

    const enemyChipsHtml = (loc.enemies || []).map(eId => {
      const t = (typeof ENEMY_TEMPLATES !== 'undefined') ? ENEMY_TEMPLATES[eId] : null;
      const label = t ? `${t.icon || ''} ${t.name}` : eId;
      return `<span class="lp-enemy-chip">${label}</span>`;
    }).join('');

    const weaponHtml = rewards.weaponChance > 0
      ? `<div class="lp-reward">⚔️ Оружие: ${Math.round(rewards.weaponChance * 100)}%</div>`
      : '';
    const scrollHtml = rewards.scrollChance > 0
      ? `<div class="lp-reward">📜 Свиток (${rewards.scrollType || ''}): ${Math.round(rewards.scrollChance * 100)}%</div>`
      : '';
    const artifactHtml = (loc.isBoss && rewards.artifact)
      ? `<div class="lp-reward" style="color:#D4AF37">👑 Артефакт: гарантировано</div>`
      : '';

    const rawDesc = loc.desc || loc.description || '';
    const descText = rawDesc
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    panel.innerHTML = `
      <div class="lp-shell">
        <header class="lp-header">
          <h2 class="lp-name">${loc.isBoss ? '👑 ' : ''}${loc.name}</h2>
          <div class="lp-stars" aria-label="звёздность локации">${starsStr}</div>
        </header>

        <div class="lp-blocks">
          <section class="lp-block lp-block--desc">
            <h3 class="lp-block-title">Описание</h3>
            <p class="lp-desc">${descText}</p>
          </section>
          <section class="lp-block lp-block--limits">
            <h3 class="lp-block-title">Ограничения отряда</h3>
            <ul class="lp-limits">
              <li class="lp-limit"><span>Звёзды</span> ${'★'.repeat(starsMax)}</li>
              <li class="lp-limit"><span>Макс. единиц</span> ${loc.maxUnits ?? '?'}</li>
              <li class="lp-limit"><span>Врагов</span> ${enemyCountStr}</li>
            </ul>
          </section>
          <section class="lp-block lp-block--enemies">
            <h3 class="lp-block-title">Противники</h3>
            <div class="lp-enemies">${enemyChipsHtml || '<span class="lp-empty">—</span>'}</div>
          </section>
          <section class="lp-block lp-block--rewards">
            <h3 class="lp-block-title">Награды</h3>
            <div class="lp-rewards">
              <div class="lp-reward">💰 ${coinsStr} монет</div>
              ${weaponHtml}
              ${scrollHtml}
              ${artifactHtml}
            </div>
          </section>
        </div>

        <button type="button" class="lp-fight-btn"
                onclick="WorldMap.startBattle('${locId}')">
          ${isCompleted ? '🔄 Повторить бой' : '⚔️ В бой!'}
        </button>
      </div>`;

    panel.classList.add('visible');
    const screen = document.getElementById('screen-worldmap');
    if (screen) screen.classList.add('location-panel-open');
  },

  prevZone() {
    if (this.currentZone > 1) this.renderZone(this.currentZone - 1);
  },

  nextZone() {
    if (this.currentZone < this.totalZones) this.renderZone(this.currentZone + 1);
  },

  startBattle(locId) {
    const loc = LOCATIONS.find(l => l.id === locId);
    if (!loc) return;
    if (typeof SquadSelect !== 'undefined') {
      SquadSelect.open(loc);
    } else {
      GameState.currentLocation = locId;
      App.showScreen('squad_select');
    }
  },

  // Backward compat (used in old detail panel html)
  openSquadSelect(locId) {
    this.startBattle(locId);
  },

  _isCompleted(locId) {
    if (typeof GameState === 'undefined') return false;
    if (typeof GameState.isCompleted === 'function') return GameState.isCompleted(locId);
    return (GameState.completedLocations || []).includes(locId);
  },

  _isUnlocked(loc) {
    if (!loc.requires || !loc.requires.length) return true;
    if (loc.requiresAny) return loc.requires.some(id => this._isCompleted(id));
    return loc.requires.every(id => this._isCompleted(id));
  },
};
