// ================================================================
// VILLAGE UI — Tabbed village screen (Этап 4)
// Tabs: Portal | Exchange | Temple | Shop | Council | Library
// ================================================================

const VillageUI = (() => {

  let _tab     = 'portal';
  let _libTab  = 'allies';   // library sub-tab
  let _libSearch = '';
  let _templeResizeObs    = null;
  let _portalResizeObs    = null;
  let _shopTimerInterval   = null;
  let _councilTimerInterval = null;

  // ── Temple: тестовый режим — все артефакты видны ────────────────
  // Поставь false чтобы вернуть реальное состояние из GameState
  const TEMPLE_SHOW_ALL = true;

  // ── Portal: debug-режим — красные рамки тумб ────────────────────
  const PORTAL_DEBUG = false;

  // ── Portal: позиции тумб со свитками ────────────────────────────
  // left/bottom — % от видимой области картинки (как PED_POSITIONS)
  // Меняй эти числа чтобы двигать тумбы по фону
  // NPC слева занимает ~20%, свитки в зоне 20-100%
  const SCROLL_POSITIONS = [
    { type: 'bronze', left: '30%', bottom: '24%', delay: '0s'   },
    { type: 'silver', left: '55%', bottom:  '4%', delay: '0.8s' },
    { type: 'gold',   left: '80%', bottom: '24%', delay: '1.6s' },
  ];

  // ── Temple: позиции постаментов ─────────────────────────────────
  // left/bottom — % от видимой области картинки (как зоны в villageMap.js)
  // Меняй эти числа чтобы расставить постаменты по фону
  // NPC в 0-20%, постаменты сгруппированы ближе — шаг 11%
  const PED_POSITIONS = [
    { id: 'warlord_pauldron',  left: '33%', bottom: '4%' },
    { id: 'temple_rune',       left: '44%', bottom: '4%' },
    { id: 'fortress_banner',   left: '55%', bottom: '4%' },
    { id: 'necromancer_staff', left: '66%', bottom: '4%' },
    { id: 'hero_crown',        left: '77%', bottom: '4%' },
  ];

  const TABS = [
    { id:'portal',   icon:'🌀', label:'Портал'      },
    { id:'exchange', icon:'🔄', label:'Обмен'        },
    { id:'temple',   icon:'🏛️', label:'Храм'         },
    { id:'shop',     icon:'🛒', label:'Магазин'      },
    { id:'council',  icon:'📜', label:'Совет'        },
  ];

  const STAT_LABELS = {
    hp:'HP', meleeAtk:'Ближн. атака', meleeDef:'Ближн. защита',
    rangeAtk:'Дальн. атака', rangeDef:'Дальн. защита',
    magic:'Магия', magicDef:'Маг. защита', initiative:'Инициатива',
    mana:'Мана', manaRegen:'Маг. восст.',
  };

  // ── Init / Render ─────────────────────────────────────────────

  function init() { /* nothing */ }

  function render() {
    _renderBalance();
    _renderTabs();
    _showTab(_tab);
  }

  // ── Balance bar ───────────────────────────────────────────────

  function _renderBalance() {
    // Legacy balance bar elements (hidden via CSS) — keep for compatibility
    const coinsEl = document.getElementById('v-coins');
    const dustEl  = document.getElementById('v-dust');
    if (coinsEl) coinsEl.textContent = GameState.coins;
    if (dustEl) {
      const dust = GameState.getDust();
      dustEl.innerHTML = [1,2,3,4,5].map(s =>
        `<span class="dust-chip star-${s}">★${s} <strong>${dust[s]||0}</strong></span>`
      ).join('');
    }
    // Update the global HUD
    if (typeof App !== 'undefined' && App.updateHUD) App.updateHUD();
  }

  // ── Tab bar ───────────────────────────────────────────────────

  function _renderTabs() {
    const tabBar = document.getElementById('v-tabs');
    if (!tabBar) return;
    tabBar.innerHTML = TABS.map(t => `
      <button class="v-tab-btn ${_tab === t.id ? 'active' : ''}"
              onclick="VillageUI.switchTab('${t.id}')">
        ${t.icon} ${t.label}
      </button>`).join('');
  }

  function switchTab(id) {
    _tab = id;
    document.querySelectorAll('.v-tab-btn').forEach(b =>
      b.classList.toggle('active', b.textContent.includes(TABS.find(t=>t.id===id)?.icon || ''))
    );
    // Simpler: re-render tab buttons
    _renderTabs();
    _renderBalance();
    _showTab(id);
  }

  function _showTab(id) {
    const content = document.getElementById('v-tab-content');
    if (!content) return;
    if (_templeResizeObs)     { _templeResizeObs.disconnect(); _templeResizeObs = null; }
    if (_portalResizeObs)     { _portalResizeObs.disconnect(); _portalResizeObs = null; }
    if (_shopTimerInterval)   { clearInterval(_shopTimerInterval);   _shopTimerInterval   = null; }
    if (_councilTimerInterval){ clearInterval(_councilTimerInterval); _councilTimerInterval = null; }
    content.classList.toggle('temple-active',  id === 'temple');
    content.classList.toggle('portal-active',  id === 'portal');
    content.classList.toggle('shop-active',    id === 'shop');
    content.classList.toggle('council-active', id === 'council');
    switch (id) {
      case 'portal':   content.innerHTML = _buildPortalHTML();   _attachPortalEvents(); break;
      case 'exchange': content.innerHTML = _buildExchangeHTML(); UnitCard.attachCardClicks(content); break;
      case 'temple':   content.innerHTML = _buildTempleHTML();   _attachTempleEvents(); break;
      case 'shop':     content.innerHTML = _buildShopHTML();     _attachShopEvents(); break;
      case 'council':  content.innerHTML = _buildCouncilHTML();  _attachCouncilEvents(); break;
      case 'library':  content.innerHTML = _buildLibraryHTML();  _attachLibraryEvents(); break;
    }
    // Inject back-to-village button (floats above all tab content)
    content.insertAdjacentHTML('afterbegin',
      `<button class="btn-back-village" onclick="App.showScreen('villagemap')">← Деревня</button>`
    );
    // Inject NPC container and init NPC
    content.insertAdjacentHTML('beforeend',
      `<div id="npc-container-${id}"></div>`
    );
    if (typeof NPCSystem !== 'undefined') {
      NPCSystem.init(id);
      const pos = NPCSystem.getPosition(id);
      content.classList.toggle('tab-npc-left',  pos === 'left');
      content.classList.toggle('tab-npc-right', pos === 'right');
    }
  }

  // ================================================================
  // TAB: PORTAL
  // ================================================================

  function _buildPortalHTML() {
    const scrolls = Portal.SCROLL_TYPES;

    const pedestals = SCROLL_POSITIONS.map(pos => {
      const sc = scrolls[pos.type];
      if (!sc) return '';
      const canAfford = GameState.coins >= sc.cost;
      const oddsRows = Object.entries(sc.starWeights)
        .filter(([, w]) => w > 0)
        .map(([s, w]) => `<div class="st-odds-row">${'★'.repeat(+s)} — ${Math.round(w * 100)}%</div>`)
        .join('');

      return `
        <div class="scroll-pedestal${canAfford ? '' : ' scroll-cant-afford'}"
             data-type="${pos.type}"
             style="left:${pos.left}; bottom:${pos.bottom}">
          <div class="scroll-float">
            <img src="assets/scrolls/${pos.type}.png"
                 class="scroll-img levitate"
                 style="animation-delay:${pos.delay}"
                 alt="${sc.name}">
          </div>
          <div class="scroll-price">${sc.cost} 💰</div>
          <div class="scroll-tooltip">
            <div class="st-name">${sc.name}</div>
            ${oddsRows}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="portal-wrap${PORTAL_DEBUG ? ' portal-debug' : ''}">
        <img class="portal-bg" src="assets/portal_bg.png" alt="Портал" draggable="false">
        <div class="portal-zones" id="portal-zones">${pedestals}</div>
        <div class="portal-result-overlay" id="portal-result-overlay" style="display:none">
          <div class="portal-result-card">
            <div id="portal-result-inner"></div>
            <div class="portal-result-title" id="portal-result-title"></div>
            <div class="portal-result-sub"   id="portal-result-sub"></div>
            <button class="portal-close-btn"
                    onclick="VillageUI.closePortalResult()">Отлично!</button>
          </div>
        </div>
      </div>`;
  }

  // Подгоняет .portal-zones под реальный размер видимой картинки
  function _fitPortal() {
    const img   = document.querySelector('.portal-bg');
    const zones = document.getElementById('portal-zones');
    const wrap  = document.querySelector('.portal-wrap');
    if (!img || !zones || !wrap || !img.naturalWidth) return;

    const wrapW  = wrap.clientWidth;
    const wrapH  = wrap.clientHeight;
    const aspect = img.naturalWidth / img.naturalHeight;

    let rendW, rendH;
    if (wrapW / wrapH > aspect) {
      rendH = wrapH; rendW = wrapH * aspect;
    } else {
      rendW = wrapW; rendH = wrapW / aspect;
    }

    const offX = (wrapW - rendW) / 2;
    const offY = (wrapH - rendH) / 2;
    zones.style.left   = `${offX}px`;
    zones.style.top    = `${offY}px`;
    zones.style.width  = `${rendW}px`;
    zones.style.height = `${rendH}px`;
  }

  function _attachPortalEvents() {
    if (_portalResizeObs) { _portalResizeObs.disconnect(); _portalResizeObs = null; }
    const wrap = document.querySelector('.portal-wrap');
    const img  = document.querySelector('.portal-bg');
    if (!wrap || !img) return;

    if (img.complete && img.naturalWidth) {
      _fitPortal();
    } else {
      img.addEventListener('load', _fitPortal, { once: true });
    }
    _portalResizeObs = new ResizeObserver(_fitPortal);
    _portalResizeObs.observe(wrap);

    document.querySelectorAll('.scroll-pedestal').forEach(el => {
      el.addEventListener('click', () => VillageUI.openPortalScroll(el.dataset.type));
    });
  }

  function openPortalScroll(type) {
    const sc = Portal.SCROLL_TYPES[type];
    if (!sc) return;
    if (!GameState.spendCoins(sc.cost)) {
      showToast(`Недостаточно монет! Нужно ${sc.cost} 💰`, 'error');
      if (typeof NPCSystem !== 'undefined') NPCSystem.trigger('portal', 'no_coins');
      return;
    }
    _renderBalance();

    if (typeof NPCSystem !== 'undefined') NPCSystem.trigger('portal', 'scroll_open_start');

    // Вспышка портала
    const wrap = document.querySelector('.portal-wrap');
    if (wrap) {
      wrap.classList.add('portal-flash-active');
      setTimeout(() => wrap.classList.remove('portal-flash-active'), 700);
    }

    // Бросок и показ результата после вспышки
    const result = Portal.rollCard(type);
    GameState.incrementQuestProgress('open_scrolls', 1);
    setTimeout(() => _showPortalResult(result), 700);
  }

  function _showPortalResult(result) {
    const overlay = document.getElementById('portal-result-overlay');
    if (!overlay) return;

    let inner = '', title = '', sub = '';

    if (!result) {
      title = 'Ошибка броска';
    } else if (result.type === 'dust') {
      inner = `<div style="font-size:52px;margin:8px 0">✨</div>`;
      title = `+1 пыль ★${result.stars}`;
      sub   = 'В пуле нет подходящих карт';
    } else {
      const ally = result.ally;
      inner = UnitCard.buildMiniCard(ally, { showLocked: false });
      title = result.isNew ? '✦ Новый герой!' : '↺ Уже есть в казарме';
      sub   = result.isNew ? ally.name : `+1 пыль ★${result.stars} добавлена`;
    }

    document.getElementById('portal-result-inner').innerHTML = inner;
    document.getElementById('portal-result-title').textContent = title;
    document.getElementById('portal-result-sub').textContent   = sub;
    overlay.style.display = 'flex';
    // Навешиваем клик для просмотра детали карты
    UnitCard.attachCardClicks(document.getElementById('portal-result-inner'));

    // NPC trigger based on result
    if (typeof NPCSystem !== 'undefined') {
      if (!result) return;
      if (result.type === 'dust') {
        NPCSystem.trigger('portal', 'duplicate');
      } else {
        const stars = result.ally?.starRange?.[0] || 1;
        NPCSystem.trigger('portal', result.isNew ? `card_star_${stars}` : 'duplicate');
      }
    }
  }

  function closePortalResult() {
    const overlay = document.getElementById('portal-result-overlay');
    if (overlay) overlay.style.display = 'none';
    _renderBalance();
    // Перестраиваем портал чтобы обновить доступность свитков
    _showTab('portal');
    if (BarracksUI) BarracksUI.render();
  }

  function _fmtOdds(weights) {
    return Object.entries(weights)
      .filter(([, v]) => v > 0)
      .map(([s, v]) => `★${s} ${Math.round(v * 100)}%`)
      .join(' · ');
  }

  // Оставляем для обратной совместимости (старый modal-портал)
  function openScroll(type) {
    const sc = Portal.SCROLL_TYPES[type];
    if (!sc) return;
    if (!GameState.spendCoins(sc.cost)) {
      showToast(`Недостаточно монет! Нужно ${sc.cost} 💰`, 'error');
      return;
    }
    _renderBalance();
    Portal.openScroll(type, () => {
      _renderBalance();
      if (_tab === 'portal')   _showTab('portal');
      if (_tab === 'exchange') _showTab('exchange');
      if (BarracksUI) BarracksUI.render();
    });
  }

  // ================================================================
  // TAB: EXCHANGE
  // ================================================================

  function _buildExchangeHTML() {
    const unlocked = GameState.getUnlocked();
    if (!unlocked.length) {
      return `<div class="v-section-title">🔄 Обменный Пункт</div>
              <div class="v-empty">Нет карт для переработки</div>`;
    }
    const cards = unlocked.map(id => {
      const ally = ALLIES.find(a => a.id === id);
      if (!ally) return '';
      const lvl   = GameState.getCardLevel(id);
      const stars = lvl ? lvl.stars : ally.starRange[0];
      return `
        <div class="exchange-item">
          ${UnitCard.buildMiniCard(ally, {})}
          <div class="ec-yield">→ <span class="dust-chip star-${stars} small">1 пыль ★${stars}</span></div>
          <button class="ec-recycle-btn" onclick="VillageUI.confirmRecycle('${id}')">🔄 Переработать</button>
        </div>`;
    }).join('');
    return `
      <div class="v-section-title">🔄 Обменный Пункт</div>
      <p class="v-section-desc">Переработайте ненужные карты в пыль для прокачки</p>
      <div class="exchange-grid">${cards}</div>`;
  }

  function confirmRecycle(id) {
    const ally = ALLIES.find(a => a.id === id);
    if (!ally) return;
    const lvl   = GameState.getCardLevel(id);
    const stars = lvl ? lvl.stars : ally.starRange[0];
    App.openModal(`
      <div style="text-align:center;padding:20px 10px;">
        <div style="font-size:3rem;margin-bottom:12px;">${ally.icon || '⚔️'}</div>
        <h3 style="margin-bottom:8px;">${ally.name}</h3>
        <p style="color:#aaa;margin-bottom:20px;">
          Переработать карту в<br>
          <span class="dust-chip star-${stars}">1 пыль ★${stars}</span>?
        </p>
        <p style="color:#f66;font-size:0.82rem;margin-bottom:20px;">Карта будет удалена из коллекции.</p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button class="result-btn danger" onclick="VillageUI.doRecycle('${id}')">🔄 Переработать</button>
          <button class="result-btn" onclick="App.forceCloseModal()">Отмена</button>
        </div>
      </div>`);
  }

  function doRecycle(id) {
    App.forceCloseModal();
    const result = GameState.recycleCard(id);
    if (result.ok) {
      showToast(`Переработано → +1 пыль ★${result.dustStar}`, 'success');
      _renderBalance();
      _showTab('exchange');
      if (BarracksUI) BarracksUI.render();
    } else {
      showToast(result.reason, 'error');
    }
  }

  // ================================================================
  // TAB: TEMPLE
  // ================================================================

  function _buildTempleHTML() {
    const artMap    = typeof ARTIFACTS !== 'undefined' ? ARTIFACTS : {};
    const collected = new Set(GameState.getArtifacts());
    const delays    = ['0s', '0.6s', '1.2s', '1.8s', '2.4s'];

    const zones = PED_POSITIONS.map((pos, i) => {
      const art   = artMap[pos.id];
      if (!art) return '';
      const owned = TEMPLE_SHOW_ALL || collected.has(art.id);
      const delay = delays[i] || '0s';
      const shortBonus = art.bonuses && art.bonuses[0] ? art.bonuses[0] : '';

      const tooltipInner = owned
        ? `<strong>${art.name}</strong>
           <div class="tt-source">✓ ${art.from}</div>
           <div class="tt-bonuses">${(art.bonuses || []).join(' · ')}</div>`
        : `<strong>${art.name}</strong>
           <div class="tt-source">🔒 ${art.from}</div>
           <div class="tt-lock">Победи босса</div>`;

      return `
        <div class="ped-zone" style="left:${pos.left}; bottom:${pos.bottom}; --ped-delay:${delay}">
          <div class="artifact-float">
            ${owned
              ? `<img src="assets/artifacts/${art.id}.png" class="levitate" alt="${art.name}">
                 <div class="bonus-always">${shortBonus}</div>`
              : `<span class="lock-icon">🔒</span>`
            }
          </div>
          <img src="assets/pedestal.png" class="ped-base-img" alt="">
          <div class="tooltip">${tooltipInner}</div>
        </div>`;
    }).join('');

    return `
      <div class="temple-wrap">
        <img class="temple-bg" src="assets/temple_bg.png" alt="Храм" draggable="false">
        <div class="temple-ped-zones">${zones}</div>
      </div>`;
  }

  // Подгоняет .temple-ped-zones под реальные размеры видимой картинки
  // (точно так же как _fitZones в villageMap.js)
  function _fitTemple() {
    const img   = document.querySelector('.temple-bg');
    const zones = document.querySelector('.temple-ped-zones');
    const wrap  = document.querySelector('.temple-wrap');
    if (!img || !zones || !wrap || !img.naturalWidth) return;

    const wrapW  = wrap.clientWidth;
    const wrapH  = wrap.clientHeight;
    const aspect = img.naturalWidth / img.naturalHeight;

    let rendW, rendH;
    if (wrapW / wrapH > aspect) {
      rendH = wrapH;
      rendW = wrapH * aspect;
    } else {
      rendW = wrapW;
      rendH = wrapW / aspect;
    }

    const offX = (wrapW - rendW) / 2;
    const offY = (wrapH - rendH) / 2;

    zones.style.left   = `${offX}px`;
    zones.style.top    = `${offY}px`;
    zones.style.width  = `${rendW}px`;
    zones.style.height = `${rendH}px`;
  }

  function _attachTempleEvents() {
    if (_templeResizeObs) { _templeResizeObs.disconnect(); _templeResizeObs = null; }
    const wrap = document.querySelector('.temple-wrap');
    const img  = document.querySelector('.temple-bg');
    if (!wrap || !img) return;

    if (img.complete && img.naturalWidth) {
      _fitTemple();
    } else {
      img.addEventListener('load', _fitTemple, { once: true });
    }
    _templeResizeObs = new ResizeObserver(_fitTemple);
    _templeResizeObs.observe(wrap);

    // NPC temple trigger based on artifact collection status
    if (typeof NPCSystem !== 'undefined') {
      setTimeout(() => {
        const owned = Object.keys(GameState.getArtifacts ? GameState.getArtifacts() : {}).length;
        const total = Object.keys(typeof ARTIFACTS !== 'undefined' ? ARTIFACTS : {}).length || 5;
        if (owned === 0)           NPCSystem.trigger('temple', 'all_empty');
        else if (owned >= total)   NPCSystem.trigger('temple', 'all_filled');
        else                       NPCSystem.trigger('temple', 'some_filled');
      }, 800);
    }
  }

  function _fmtArtBonus(bonus) {
    if (!bonus) return '';
    return Object.entries(bonus)
      .map(([s, v]) => `+${v} ${STAT_LABELS[s] || s}`)
      .join(', ');
  }

  // ================================================================
  // TAB: SHOP
  // ================================================================

  // ── SHOP ─────────────────────────────────────────────────────────

  const _WEAP_LABELS = {
    meleeAtk:'Ближн.атк', meleeDef:'Ближн.защ',
    rangeAtk:'Дальн.атк', rangeDef:'Дальн.защ',
    magic:'Магия', magicDef:'Маг.защ', hp:'HP', mana:'Мана', initiative:'Иниц.',
  };

  const _RARITY_COLORS = {
    common:    { bg:'#D3D1C7', fg:'#444441', border:'#B4B2A9' },
    rare:      { bg:'#B5D4F4', fg:'#0C447C', border:'#85B7EB' },
    epic:      { bg:'#CECBF6', fg:'#26215C', border:'#AFA9EC' },
    legendary: { bg:'#FAC775', fg:'#412402', border:'#EF9F27' },
  };

  function _buildShopHTML() {
    const items     = GameState.getShopItems();
    const cardItems = items.map((item, idx) => ({ ...item, _idx: idx })).filter(i => i.type === 'card');
    const weapItems = items.map((item, idx) => ({ ...item, _idx: idx })).filter(i => i.type === 'weapon');

    const unitsHTML = cardItems.map(item => {
      const ally        = ALLIES.find(a => a.id === item.id);
      if (!ally) return '';
      const isOwned     = GameState.isUnlocked(item.id);
      const isPurchased = item.purchased;
      const done        = isOwned || isPurchased;
      const canAfford   = !done && GameState.coins >= item.price;
      const borderColor = done ? '#3B6D11' : canAfford ? 'rgba(255,255,255,.2)' : 'rgba(200,50,50,.3)';
      const btnText     = isPurchased ? '✓ Куплено' :
                          isOwned     ? '✓ Уже в казарме' :
                          canAfford   ? '⚔️ Нанять героя' : '💰 Недостаточно монет';
      return `
        <div class="shop-unit-wrap">
          ${UnitCard.buildMiniCard(ally, { showLocked: done })}
          <div class="shop-unit-footer" style="--unit-border:${borderColor}">
            <div class="shop-unit-price">${item.price} 💰</div>
            <button class="shop-buy-btn" ${done || !canAfford ? 'disabled' : ''}
                    onclick="VillageUI.buyItem(${item._idx})">
              ${btnText}
            </button>
          </div>
        </div>`;
    }).join('');

    const weaponsHTML = weapItems.map(item => {
      const w = (typeof WEAPONS !== 'undefined') && WEAPONS.find(wpn => wpn.id === item.id);
      if (!w) return '';
      const isOwned   = GameState.hasWeapon(item.id) || item.purchased;
      const canAfford = !isOwned && GameState.coins >= item.price;
      const rar       = _RARITY_COLORS[w.rarity] || _RARITY_COLORS.common;
      const bonuses   = Object.entries(w.bonuses || {})
        .map(([k, v]) => `+${v} ${_WEAP_LABELS[k] || k}`).join(' · ');
      return `
        <div class="weapon-shop-card" style="--wc-border:${rar.border}">
          <div class="wsc-top">
            <span class="wsc-icon">${w.icon || '🗡️'}</span>
            <div class="wsc-info">
              <span class="wsc-rarity" style="background:${rar.bg};color:${rar.fg}">
                ${(typeof RARITIES !== 'undefined' && RARITIES[w.rarity]?.label) || w.rarity}
              </span>
              <div class="wsc-name">${w.name}</div>
              <div class="wsc-bonus">${bonuses}</div>
              ${w.special ? `<div class="wsc-special">${w.special.desc || ''}</div>` : ''}
            </div>
          </div>
          <div class="wsc-divider"></div>
          <div class="wsc-bottom">
            <span class="wsc-price">${item.price} 💰</span>
            <button class="wsc-buy-btn" ${!canAfford ? 'disabled' : ''}
                    onclick="VillageUI.buyItem(${item._idx})">
              ${isOwned ? '✓ Есть' : canAfford ? '🛒 Купить' : 'Нет монет'}
            </button>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="shop-wrap">
        <img class="shop-bg" src="assets/shop_bg.jpg" alt="">
        <div class="shop-ui">
          <div class="shop-header">
            <div class="shop-controls">
              <div class="shop-timer" id="shop-timer">🕐 Обновление через: --:--:--</div>
              <button class="shop-refresh-btn" onclick="VillageUI.refreshShop()">
                🔄 Обновить (200 💰)
              </button>
            </div>
          </div>

          <div class="shop-section-label">⚔️ Герои</div>
          <div class="shop-units-row" id="shop-units-row">${unitsHTML}</div>

          <div class="shop-section-label">🗡️ Оружие и снаряжение</div>
          <div class="shop-weapons-row" id="shop-weapons-row">${weaponsHTML}</div>
        </div>
      </div>`;
  }

  function _attachShopEvents() {
    UnitCard.attachCardClicks(document.getElementById('shop-units-row'));

    // Таймер до полуночи (ежедневное обновление)
    if (_shopTimerInterval) clearInterval(_shopTimerInterval);
    function _updateShopTimer() {
      const el = document.getElementById('shop-timer');
      if (!el) { clearInterval(_shopTimerInterval); return; }
      const now  = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs  = midnight - now;
      const h = String(Math.floor(diffMs / 3_600_000)).padStart(2, '0');
      const m = String(Math.floor((diffMs % 3_600_000) / 60_000)).padStart(2, '0');
      const s = String(Math.floor((diffMs % 60_000) / 1000)).padStart(2, '0');
      el.textContent = `🕐 Обновление через: ${h}:${m}:${s}`;
    }
    _updateShopTimer();
    _shopTimerInterval = setInterval(_updateShopTimer, 1000);
  }

  function buyItem(idx) {
    const result = GameState.buyShopItem(idx);
    if (result.ok) {
      showToast('Куплено!', 'success');
      _renderBalance();
      const itemType = GameState.getShopItems()[idx]?.type;
      if (typeof NPCSystem !== 'undefined') {
        NPCSystem.trigger('shop', itemType === 'weapon' ? 'purchase_weapon' : 'purchase_card');
      }
      _showTab('shop');
      if (BarracksUI) BarracksUI.render();
      if (InventoryUI)  InventoryUI.render();
    } else {
      showToast(result.reason, 'error');
      if (typeof NPCSystem !== 'undefined') NPCSystem.trigger('shop', 'not_enough_coins');
    }
  }

  function refreshShop() {
    const result = GameState.refreshShop();
    if (result.ok) {
      const costMsg = result.cost > 0 ? ` (−${result.cost} монет)` : ' (бесплатно!)';
      showToast(`Магазин обновлён${costMsg}`, 'success');
      _renderBalance();
      _showTab('shop');
      if (typeof NPCSystem !== 'undefined') NPCSystem.trigger('shop', 'shop_refreshed');
    } else {
      showToast(result.reason, 'error');
    }
  }

  // ================================================================
  // TAB: COUNCIL
  // ================================================================

  // ── Quest helpers ─────────────────────────────────────────────

  const _QUEST_ICONS = {
    complete_locations: '🗺️',
    kill_enemies:       '⚔️',
    open_scrolls:       '📜',
    spend_coins:        '💰',
    upgrade_cards:      '⬆️',
  };

  function _questState(q) {
    if (q.claimed)              return 'done';
    if (q.progress >= q.target) return 'claimable';
    return 'in-progress';
  }

  function _buildQuestCard(q) {
    const state = _questState(q);
    const pct   = Math.min(100, Math.round((q.progress / q.target) * 100));
    const icon  = _QUEST_ICONS[q.type] || '📋';

    const btn = state === 'claimable'
      ? `<button class="quest-btn qb-claim" onclick="VillageUI.claimQuest('${q.id}')">🎁 Забрать!</button>`
      : state === 'done'
        ? `<button class="quest-btn qb-done" disabled>✓ Выполнено</button>`
        : `<button class="quest-btn qb-waiting" disabled>В процессе...</button>`;

    return `
      <div class="quest ${state}">
        <div class="quest-top">
          <div class="quest-icon">${icon}</div>
          <div class="quest-info">
            <div class="quest-name">${q.label}</div>
            <div class="quest-progress">
              <div class="qp-bar"><div class="qp-fill" style="width:${pct}%"></div></div>
              <div class="qp-text">${q.progress} / ${q.target}</div>
            </div>
          </div>
        </div>
        <div style="height:1px;background:rgba(255,255,255,.05);margin:0 14px;"></div>
        <div class="quest-bottom">
          <div class="quest-reward">
            <span class="reward-chip">${q.rewardLabel}</span>
          </div>
          ${btn}
        </div>
      </div>`;
  }

  function _buildCouncilHTML() {
    const quests = GameState.getActiveQuests();
    const questsHTML = quests.length
      ? quests.map(q => _buildQuestCard(q)).join('')
      : '<div class="v-empty">Нет активных заданий — зайди завтра</div>';

    return `
      <img class="building-bg" src="assets/council_bg.jpg" alt=""
           onerror="this.style.display='none'">
      <div class="council-wrap">
        <div class="council-header">
          <div class="council-title">📜 Совет старейшин</div>
          <div class="council-timer">Сброс через <span id="council-timer-val">--:--:--</span></div>
        </div>
        <div class="quest-list">${questsHTML}</div>
      </div>`;
  }

  function _attachCouncilEvents() {
    function _tick() {
      const el = document.getElementById('council-timer-val');
      if (!el) { clearInterval(_councilTimerInterval); _councilTimerInterval = null; return; }
      const now   = new Date();
      const reset = new Date(); reset.setHours(24, 0, 0, 0);
      const diff  = reset - now;
      const hh = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      el.textContent = `${hh}:${mm}:${ss}`;
    }
    _tick();
    _councilTimerInterval = setInterval(_tick, 1000);
  }

  function claimQuest(questId) {
    const result = GameState.claimQuestReward(questId);
    if (result.ok) {
      const r   = result.reward;
      const msg = r.type === 'coins' ? `+${r.amount} монет!` : `+${r.amount} пыль ★${r.star}!`;
      showToast(msg, 'success');
      _renderBalance();
      _showTab('council');
      if (typeof NPCSystem !== 'undefined') NPCSystem.trigger('council', 'quest_claimed');
    } else {
      showToast(result.reason, 'error');
    }
  }

  // ================================================================
  // TAB: LIBRARY
  // ================================================================

  function _buildLibraryHTML() {
    return `
      <div class="v-section-title">📖 Библиотека</div>
      <div class="lib-header">
        <div class="lib-tabs">
          <button class="lib-tab-btn ${_libTab === 'allies' ? 'active' : ''}"
                  onclick="VillageUI.libSwitch('allies')">🗡️ Союзники</button>
          <button class="lib-tab-btn ${_libTab === 'enemies' ? 'active' : ''}"
                  onclick="VillageUI.libSwitch('enemies')">👹 Враги</button>
        </div>
        <input type="text" class="lib-search" id="lib-search-input"
               placeholder="🔍 Поиск..." value="${_libSearch}"
               oninput="VillageUI.libSearch(this.value)">
      </div>
      <div id="lib-content" class="lib-content">
        ${_buildLibContent()}
      </div>`;
  }

  function _buildLibContent() {
    const q = _libSearch.toLowerCase();
    if (_libTab === 'allies') return _buildAlliesLib(q);
    return _buildEnemiesLib(q);
  }

  function _buildAlliesLib(q) {
    const list = ALLIES.filter(a =>
      !q || a.name.toLowerCase().includes(q) || a.race.toLowerCase().includes(q) || a.class.toLowerCase().includes(q)
    );
    if (!list.length) return '<div class="v-empty">Ничего не найдено</div>';
    // Используем универсальный buildMiniCard; клики навешиваются в _attachLibraryEvents
    return `<div class="lib-cards-grid">${
      list.map(ally => {
        const isOwned = GameState.isUnlocked(ally.id);
        return UnitCard.buildMiniCard(ally, { showLocked: !isOwned });
      }).join('')
    }</div>`;
  }

  function _buildEnemiesLib(q) {
    const templates = typeof ENEMY_TEMPLATES !== 'undefined' ? ENEMY_TEMPLATES : {};
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
      const b = e.base;
      const locs = (locMap[e.id] || []).slice(0, 3).join(', ') || '—';
      return `
        <div class="lib-card lib-enemy-card ${e.isBossUnit ? 'lib-boss-card' : ''}">
          <div class="lib-card-head">
            <span class="lib-icon">${e.icon || '👹'}</span>
            <div class="lib-card-title">
              <div class="lib-name">${e.name} ${e.isBossUnit ? '👑' : ''}</div>
              <div class="lib-meta">
                <span class="lib-cls">${e.race || '—'}</span>
                <span class="lib-cls">${e.attackType || 'melee'}</span>
              </div>
            </div>
          </div>
          <div class="lib-stats">
            ${_statRow('HP', b.hp||0)}
            ${b.meleeAtk ? _statRow('Ближн. атк', b.meleeAtk) : ''}
            ${b.rangeAtk ? _statRow('Дальн. атк', b.rangeAtk) : ''}
            ${b.magic    ? _statRow('Магия',       b.magic)    : ''}
            ${_statRow('Инициатива', b.initiative||0)}
          </div>
          ${e.abilities && e.abilities.length ? `
            <div class="lib-abilities">
              ${e.abilities.map(ab => `
                <div class="lib-ability">
                  <span class="lib-ab-name">${ab.name}</span>
                  <span class="lib-ab-desc">${ab.desc}</span>
                </div>`).join('')}
            </div>` : ''}
          <div class="lib-found">📍 ${locs}</div>
        </div>`;
    }).join('');
  }

  function _statRow(label, val) {
    return `<div class="lib-stat"><span class="lib-stat-lbl">${label}</span><span class="lib-stat-val">${val}</span></div>`;
  }

  function _attachLibraryEvents() {
    const input = document.getElementById('lib-search-input');
    if (input) input.focus();
    // Клики на карточки союзников
    const libContent = document.getElementById('lib-content');
    if (libContent) UnitCard.attachCardClicks(libContent);
  }

  function libSwitch(tab) {
    _libTab = tab;
    const content = document.getElementById('lib-content');
    if (content) {
      content.innerHTML = _buildLibContent();
      UnitCard.attachCardClicks(content);
    }
    document.querySelectorAll('.lib-tab-btn').forEach(b =>
      b.classList.toggle('active', b.textContent.includes(tab === 'allies' ? 'Союзники' : 'Враги'))
    );
  }

  function libSearch(val) {
    _libSearch = val;
    const content = document.getElementById('lib-content');
    if (content) {
      content.innerHTML = _buildLibContent();
      UnitCard.attachCardClicks(content);
    }
  }

  // ── Toast ─────────────────────────────────────────────────────

  function showToast(msg, type = 'info') {
    let toast = document.getElementById('village-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'village-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className   = `village-toast toast-${type}`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // ── Public API ────────────────────────────────────────────────

  return {
    init, render, switchTab,
    openScroll, openPortalScroll, closePortalResult,
    confirmRecycle, doRecycle,
    buyItem, refreshShop,
    claimQuest,
    libSwitch, libSearch,
    showToast,
    renderBalance: _renderBalance,
  };
})();
