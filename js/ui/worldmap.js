// ================================================================
// WORLDMAP UI — Карта мира (зонный режим)
// ================================================================
// Координаты узлов: в js/data/locations.js — mapX, mapY [, mapUnit].
// mapUnit 'percent' (по умолчанию): 0–100 внутри блока .zone-nodes.
// mapUnit 'px': пиксели от левого верхнего угла .zone-nodes.

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

  /**
   * Позиция узла на фоне зоны: mapX/mapY в locations.js (проценты или px).
   * Без координат — равномерный ряд по горизонтали (fallback).
   */
  _positionLocNode(node, loc, index, total) {
    node.style.position = 'absolute';
    const usePx = loc.mapUnit === 'px';
    const hasMap = typeof loc.mapX === 'number' && typeof loc.mapY === 'number';

    if (hasMap) {
      if (usePx) {
        node.style.left = `${loc.mapX}px`;
        node.style.top = `${loc.mapY}px`;
      } else {
        node.style.left = `${loc.mapX}%`;
        node.style.top = `${loc.mapY}%`;
      }
      return;
    }

    const step = 100 / (total + 1);
    node.style.left = `${step * (index + 1)}%`;
    node.style.top = '50%';
  },

  /** Линия маршрута по orderX: центры иконок в координатах контейнера. */
  _routeResizeObserver: null,

  _drawRouteLines(container) {
    const svg = container.querySelector('.zone-route-lines');
    if (!svg) return;

    const nodes = [...container.querySelectorAll('.loc-node')];
    if (nodes.length < 2) {
      svg.innerHTML = '';
      return;
    }

    const cr = container.getBoundingClientRect();
    const points = nodes.map((n) => {
      const el = n.querySelector('.loc-icon-wrap') || n;
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - cr.left,
        y: r.top + r.height / 2 - cr.top,
      };
    });

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w <= 0 || h <= 0) return;

    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
    svg.innerHTML = `<path class="zone-route-path" d="${d}" fill="none" />`;
  },

  _estimateLocationEnemyPowerRange(loc) {
    const zone = loc.zone || 1;
    const stars = Math.min(Math.max(zone - 1, 1), 5);
    const level = Math.max(1, (zone - 1) * 2);

    const calcGroup = (templateIds) => {
      const units = [];
      const colCount = { 1: 0, 2: 0, 3: 0 };

      (templateIds || []).forEach(templateId => {
        const tmpl = (typeof ENEMY_TEMPLATES !== 'undefined') ? ENEMY_TEMPLATES[templateId] : null;
        if (!tmpl || typeof createBattleEnemy !== 'function') return;

        let col = 1;
        const at = tmpl.attackType || 'melee';
        if (at === 'ranged') col = 2;
        else if (at === 'magic') col = 3;

        const row = colCount[col] + 1;
        colCount[col]++;
        const e = createBattleEnemy(templateId, col, row, stars, level);
        if (e) units.push(e);
      });

      if (typeof applyEnemySynergies === 'function') applyEnemySynergies(units);
      if (typeof calculateGroupPower === 'function') return calculateGroupPower(units);
      if (typeof calculateUnitPower === 'function') {
        return units.reduce((sum, u) => sum + calculateUnitPower(u), 0);
      }
      return 0;
    };

    const powers = [];

    if (Array.isArray(loc.encounters) && loc.encounters.length) {
      loc.encounters.forEach(enc => {
        powers.push(calcGroup(enc.enemies || []));
      });
    } else {
      const pool = Array.isArray(loc.enemies) ? loc.enemies : [];
      const countMin = Array.isArray(loc.enemyCount) ? loc.enemyCount[0] : 1;
      const countMax = Array.isArray(loc.enemyCount) ? loc.enemyCount[1] : countMin;
      for (let count = countMin; count <= countMax; count++) {
        const templateIds = pool.slice(0, count).map((_, i) => pool[i % pool.length]);
        powers.push(calcGroup(templateIds));
      }
    }

    if (!powers.length) return null;
    return { min: Math.min(...powers), max: Math.max(...powers) };
  },

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

    if (this._routeResizeObserver) {
      this._routeResizeObserver.disconnect();
      this._routeResizeObserver = null;
    }

    container.innerHTML = '';

    const routeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    routeSvg.classList.add('zone-route-lines');
    routeSvg.setAttribute('aria-hidden', 'true');
    container.appendChild(routeSvg);

    const redrawRoute = () => this._drawRouteLines(container);

    locations.forEach((loc, index) => {
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

      node.addEventListener('click', () => this.selectLocation(loc.id));
      this._positionLocNode(node, loc, index, locations.length);
      container.appendChild(node);
    });

    redrawRoute();
    requestAnimationFrame(() => requestAnimationFrame(redrawRoute));
    if (typeof ResizeObserver !== 'undefined') {
      this._routeResizeObserver = new ResizeObserver(redrawRoute);
      this._routeResizeObserver.observe(container);
    }

    if (locations.length > 0) {
      this.selectLocation(locations[0].id);
    } else {
      const panel = document.getElementById('location-panel');
      if (panel) panel.classList.remove('visible');
    }
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
    const enemyPowerRange = this._estimateLocationEnemyPowerRange(loc);
    const enemyPowerStr = enemyPowerRange
      ? `${enemyPowerRange.min}–${enemyPowerRange.max}`
      : '?';

    const enemyChipsHtml = (loc.enemies || []).map(eId => {
      const t = (typeof ENEMY_TEMPLATES !== 'undefined') ? ENEMY_TEMPLATES[eId] : null;
      const label = t ? `${t.icon || ''} ${t.name}` : eId;
      const safeId = String(eId).replace(/"/g, '');
      if (t) {
        return `<button type="button" class="lp-enemy-chip" data-enemy-id="${safeId}"
          title="Подробная карточка">${label}</button>`;
      }
      return `<span class="lp-enemy-chip lp-enemy-chip--static">${label}</span>`;
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

    const zonePlayable = this._isZoneUnlockedForPlay(loc.zone);
    const locUnlocked = this._isUnlocked(loc);
    const canFight = zonePlayable && locUnlocked;
    let fightBtnLabel = isCompleted ? '🔄 Повторить бой' : '⚔️ В бой!';
    if (!canFight) {
      fightBtnLabel = !zonePlayable ? '🔒 Зона недоступна' : '🔒 Локация недоступна';
    }
    const fightBtnHtml = canFight
      ? `<button type="button" class="lp-fight-btn"
                onclick="WorldMap.startBattle('${locId}')">${fightBtnLabel}</button>`
      : `<button type="button" class="lp-fight-btn" disabled aria-disabled="true">${fightBtnLabel}</button>`;

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
              <li class="lp-limit">
                <span class="lp-limit-label">Звёзды</span>
                <span class="lp-limit-value">${'★'.repeat(starsMax)}</span>
              </li>
              <li class="lp-limit">
                <span class="lp-limit-label">Макс. единиц</span>
                <span class="lp-limit-value">${loc.maxUnits ?? '?'}</span>
              </li>
              <li class="lp-limit">
                <span class="lp-limit-label">Врагов</span>
                <span class="lp-limit-value">${enemyCountStr}</span>
              </li>
            </ul>
          </section>
          <section class="lp-block lp-block--enemies">
            <h3 class="lp-block-title">Противники</h3>
            <div class="lp-enemies">${enemyChipsHtml || '<span class="lp-empty">—</span>'}</div>
            <div class="lp-enemy-power">Уровень силы ~ ${enemyPowerStr}</div>
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

        ${fightBtnHtml}
      </div>`;

    panel.querySelectorAll('.lp-enemy-chip[data-enemy-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-enemy-id');
        if (!id || typeof LibraryUI === 'undefined' || typeof LibraryUI.showEnemyDetail !== 'function') return;
        LibraryUI.showEnemyDetail(id);
      });
    });

    panel.classList.add('visible');
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
    if (!this._isZoneUnlockedForPlay(loc.zone) || !this._isUnlocked(loc)) return;
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

  /** Можно начать бой в этой зоне (зона открыта прогрессом с предыдущей). */
  _isZoneUnlockedForPlay(zoneNum) {
    if (zoneNum <= 1) return true;
    const gate = {
      2: 'boss_z1',
      3: 'boss_z2',
      4: 'boss_z3',
      5: 'loc_gateway',
    };
    const req = gate[zoneNum];
    if (!req) return true;
    return this._isCompleted(req);
  },
};
