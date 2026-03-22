// ================================================================
// VILLAGE UI — Tabbed village screen (Этап 4)
// Tabs: Portal | Exchange | Temple | Shop | Council | Library
// ================================================================

const VillageUI = (() => {

  let _tab     = 'portal';
  let _libTab  = 'allies';   // library sub-tab
  let _libSearch = '';
  let _templeResizeObs = null;
  let _portalResizeObs = null;

  // ── Temple: тестовый режим — все артефакты видны ────────────────
  // Поставь false чтобы вернуть реальное состояние из GameState
  const TEMPLE_SHOW_ALL = true;

  // ── Portal: debug-режим — красные рамки тумб ────────────────────
  const PORTAL_DEBUG = false;

  // ── Portal: позиции тумб со свитками ────────────────────────────
  // left/bottom — % от видимой области картинки (как PED_POSITIONS)
  // Меняй эти числа чтобы двигать тумбы по фону
  const SCROLL_POSITIONS = [
    { type: 'bronze', left: '18%', bottom: '24%', delay: '0s'   },
    { type: 'silver', left: '50%', bottom:  '4%', delay: '0.8s' },
    { type: 'gold',   left: '82%', bottom: '24%', delay: '1.6s' },
  ];

  // ── Temple: позиции постаментов ─────────────────────────────────
  // left/bottom — % от видимой области картинки (как зоны в villageMap.js)
  // Меняй эти числа чтобы расставить постаменты по фону
  const PED_POSITIONS = [
    { id: 'warlord_pauldron',  left: '15%', bottom: '4%'  },
    { id: 'temple_rune',       left: '33%', bottom: '8%'  },
    { id: 'fortress_banner',   left: '50%', bottom: '12%' },
    { id: 'necromancer_staff', left: '67%', bottom: '8%'  },
    { id: 'hero_crown',        left: '83%', bottom: '4%'  },
  ];

  const TABS = [
    { id:'portal',   icon:'🌀', label:'Портал'      },
    { id:'exchange', icon:'🔄', label:'Обмен'        },
    { id:'temple',   icon:'🏛️', label:'Храм'         },
    { id:'shop',     icon:'🛒', label:'Магазин'      },
    { id:'council',  icon:'📜', label:'Совет'        },
    { id:'library',  icon:'📖', label:'Библиотека'   },
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
    const coinsEl = document.getElementById('v-coins');
    const dustEl  = document.getElementById('v-dust');
    const backEl  = document.getElementById('v-map-back');
    if (coinsEl) coinsEl.textContent = GameState.coins;
    if (dustEl) {
      const dust = GameState.getDust();
      dustEl.innerHTML = [1,2,3,4,5].map(s =>
        `<span class="dust-chip star-${s}">★${s} <strong>${dust[s]||0}</strong></span>`
      ).join('');
    }
    if (backEl) {
      backEl.onclick = () => App.showScreen('villagemap');
    }
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
    if (_templeResizeObs) { _templeResizeObs.disconnect(); _templeResizeObs = null; }
    if (_portalResizeObs) { _portalResizeObs.disconnect(); _portalResizeObs = null; }
    content.classList.toggle('temple-active', id === 'temple');
    content.classList.toggle('portal-active', id === 'portal');
    switch (id) {
      case 'portal':   content.innerHTML = _buildPortalHTML();   _attachPortalEvents(); break;
      case 'exchange': content.innerHTML = _buildExchangeHTML(); UnitCard.attachCardClicks(content); break;
      case 'temple':   content.innerHTML = _buildTempleHTML();   _attachTempleEvents(); break;
      case 'shop':     content.innerHTML = _buildShopHTML();     UnitCard.attachCardClicks(content); break;
      case 'council':  content.innerHTML = _buildCouncilHTML();  break;
      case 'library':  content.innerHTML = _buildLibraryHTML();  _attachLibraryEvents(); break;
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
      return;
    }
    _renderBalance();

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

  function _buildShopHTML() {
    const items    = GameState.getShopItems();
    const freeUsed = !!GameState._shopFreeUsed; // exposed from GameState

    const itemsHTML = items.map((item, idx) => {
      const canBuy   = !item.purchased && GameState.coins >= item.price;
      const isPurchased = item.purchased;
      let   cardHTML = '';
      if (item.type === 'card') {
        const ally  = ALLIES.find(a => a.id === item.id);
        const owned = GameState.isUnlocked(item.id);
        cardHTML = ally
          ? UnitCard.buildMiniCard(ally, { showLocked: !owned })
          : `<div class="shop-item-icon">⚔️</div><div class="shop-item-name">${item.id}</div>`;
      } else {
        const wpn = (typeof WEAPONS !== 'undefined') && WEAPONS.find(w => w.id === item.id);
        const owned = GameState.hasWeapon(item.id);
        cardHTML = `
          <div class="shop-item-icon">${wpn?.icon || '🗡️'}</div>
          <div class="shop-item-name">${wpn?.name || item.id}</div>
          <div class="shop-item-meta">
            <span class="shop-rarity rarity-${item.rarity}">${item.rarity}</span>
            ${owned ? '<span class="shop-owned-tag">Есть</span>' : ''}
          </div>`;
      }
      return `
        <div class="shop-item ${isPurchased ? 'shop-item-sold' : ''}">
          ${cardHTML}
          <div class="shop-price">💰 ${item.price}</div>
          <button class="shop-buy-btn ${canBuy && !isPurchased ? '' : 'disabled'}"
                  onclick="VillageUI.buyItem(${idx})"
                  ${canBuy && !isPurchased ? '' : 'disabled'}>
            ${isPurchased ? '✓ Куплено' : 'Купить'}
          </button>
        </div>`;
    }).join('');

    return `
      <div class="v-section-title">🛒 Магазин</div>
      <div class="shop-header">
        <p class="v-section-desc">4 карты и 2 оружия — обновляется каждый день</p>
        <button class="shop-refresh-btn" onclick="VillageUI.refreshShop()">
          🔄 Обновить${_getRefreshCostLabel()}
        </button>
      </div>
      <div class="shop-grid">${itemsHTML}</div>`;
  }

  function _getRefreshCostLabel() {
    // We expose shopFreeRefreshUsed through a check call
    const items = GameState.getShopItems(); // triggers _checkShopRefresh
    // Simple: try refreshing with force=false first. If it fails means free was used.
    // Better: just always show cost as "бесплатно / 200м"
    return ' (200 💰)'; // simplified - show cost always since free tracking is complex here
  }

  function buyItem(idx) {
    const result = GameState.buyShopItem(idx);
    if (result.ok) {
      showToast('Куплено!', 'success');
      _renderBalance();
      _showTab('shop');
      if (BarracksUI) BarracksUI.render();
      if (InventoryUI)  InventoryUI.render();
    } else {
      showToast(result.reason, 'error');
    }
  }

  function refreshShop() {
    const result = GameState.refreshShop();
    if (result.ok) {
      const costMsg = result.cost > 0 ? ` (−${result.cost} монет)` : ' (бесплатно!)';
      showToast(`Магазин обновлён${costMsg}`, 'success');
      _renderBalance();
      _showTab('shop');
    } else {
      showToast(result.reason, 'error');
    }
  }

  // ================================================================
  // TAB: COUNCIL
  // ================================================================

  function _buildCouncilHTML() {
    const quests = GameState.getActiveQuests();
    const questHTML = quests.map(q => {
      const pct     = Math.min(100, Math.round((q.progress / q.target) * 100));
      const done    = q.progress >= q.target;
      const claimed = q.claimed;
      return `
        <div class="quest-card ${claimed ? 'quest-claimed' : done ? 'quest-done' : ''}">
          <div class="quest-label">${q.label}</div>
          <div class="quest-progress-wrap">
            <div class="quest-bar">
              <div class="quest-bar-fill" style="width:${pct}%"></div>
            </div>
            <div class="quest-count">${q.progress}/${q.target}</div>
          </div>
          <div class="quest-reward">🎁 ${q.rewardLabel}</div>
          ${claimed
            ? '<div class="quest-claimed-label">✓ Получено</div>'
            : done
              ? `<button class="quest-claim-btn" onclick="VillageUI.claimQuest('${q.id}')">Получить награду!</button>`
              : '<div class="quest-pending-label">В процессе...</div>'
          }
        </div>`;
    }).join('');

    const now    = new Date();
    const reset  = new Date();
    reset.setHours(24, 0, 0, 0);
    const diff   = reset - now;
    const hh     = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const mm     = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');

    return `
      <div class="v-section-title">📜 Совет старейшин</div>
      <p class="v-section-desc">Ежедневные задания сбрасываются в полночь
        — осталось <strong>${hh}:${mm}</strong></p>
      <div class="quest-list">${questHTML}</div>`;
  }

  function claimQuest(questId) {
    const result = GameState.claimQuestReward(questId);
    if (result.ok) {
      const r = result.reward;
      const msg = r.type === 'coins'
        ? `+${r.amount} монет!`
        : `+${r.amount} пыль ★${r.star}!`;
      showToast(msg, 'success');
      _renderBalance();
      _showTab('council');
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
