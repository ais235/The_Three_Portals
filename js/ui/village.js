// ================================================================
// VILLAGE UI — Tabbed village screen (Этап 4)
// Tabs: Portal | Exchange | Temple | Shop | Council | Library
// ================================================================

const VillageUI = (() => {

  let _tab     = 'portal';
  let _libTab  = 'allies';   // library sub-tab
  let _libSearch = '';

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
    if (coinsEl) coinsEl.textContent = GameState.coins;
    if (dustEl) {
      const dust = GameState.getDust();
      dustEl.innerHTML = [1,2,3,4,5].map(s =>
        `<span class="dust-chip star-${s}">★${s} <strong>${dust[s]||0}</strong></span>`
      ).join('');
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
    switch (id) {
      case 'portal':   content.innerHTML = _buildPortalHTML();   break;
      case 'exchange': content.innerHTML = _buildExchangeHTML(); break;
      case 'temple':   content.innerHTML = _buildTempleHTML();   break;
      case 'shop':     content.innerHTML = _buildShopHTML();     break;
      case 'council':  content.innerHTML = _buildCouncilHTML();  break;
      case 'library':  content.innerHTML = _buildLibraryHTML();  _attachLibraryEvents(); break;
    }
  }

  // ================================================================
  // TAB: PORTAL
  // ================================================================

  function _buildPortalHTML() {
    const scrolls = Portal.SCROLL_TYPES;
    const btns = Object.entries(scrolls).map(([key, sc]) => {
      const canAfford = GameState.coins >= sc.cost;
      return `
        <button class="scroll-btn scroll-${key} ${canAfford ? '' : 'disabled'}"
                onclick="VillageUI.openScroll('${key}')" ${canAfford ? '' : 'disabled'}>
          <span class="scroll-icon">${sc.icon}</span>
          <span class="scroll-info">
            <strong>${sc.name}</strong>
            <small>${sc.cost} 💰</small>
          </span>
          <span class="scroll-odds">${_fmtOdds(sc.starWeights)}</span>
        </button>`;
    }).join('');

    return `
      <div class="v-section-title">🌀 Портальный Круг</div>
      <p class="v-section-desc">Открывайте свитки чтобы получать новых союзников</p>
      <div class="portal-btns">${btns}</div>`;
  }

  function _fmtOdds(weights) {
    return Object.entries(weights)
      .filter(([,v]) => v > 0)
      .map(([s,v]) => `★${s} ${Math.round(v*100)}%`)
      .join(' · ');
  }

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
      if (CollectionUI) CollectionUI.render();
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
        <div class="exchange-card" onclick="VillageUI.confirmRecycle('${id}')">
          <div class="ec-icon">${ally.icon || '⚔️'}</div>
          <div class="ec-name">${ally.name}</div>
          <div class="ec-stars">★${stars}</div>
          <div class="ec-yield">→ <span class="dust-chip star-${stars} small">1 пыль ★${stars}</span></div>
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
      if (CollectionUI) CollectionUI.render();
    } else {
      showToast(result.reason, 'error');
    }
  }

  // ================================================================
  // TAB: TEMPLE
  // ================================================================

  function _buildTempleHTML() {
    const allArts    = Object.values(typeof ARTIFACTS !== 'undefined' ? ARTIFACTS : {});
    const collected  = new Set(GameState.getArtifacts());
    const totalBonus = typeof getTempleBonus === 'function' ? getTempleBonus() : {};

    const slots = allArts.map(art => {
      const has = collected.has(art.id);
      return `
        <div class="temple-slot ${has ? 'temple-slot-owned' : 'temple-slot-locked'}">
          <div class="ts-icon">${art.icon}</div>
          <div class="ts-name">${art.name}</div>
          ${has
            ? `<div class="ts-bonus">${_fmtArtBonus(art.bonus)}</div>`
            : `<div class="ts-lock">🔒 Не получен</div>`
          }
          <div class="ts-desc">${art.desc}</div>
        </div>`;
    }).join('');

    const totalStr = Object.entries(totalBonus)
      .map(([stat, val]) => `+${val} ${STAT_LABELS[stat] || stat}`)
      .join(', ') || 'Нет активных бонусов';

    const noArts = allArts.length === 0
      ? '<div class="v-empty">Артефакты появятся после победы над боссами.</div>'
      : '';

    return `
      <div class="v-section-title">🏛️ Храм Артефактов</div>
      <p class="v-section-desc">Артефакты с боссов усиливают ваш отряд в каждом сражении</p>
      ${noArts}
      <div class="temple-grid">${slots}</div>
      <div class="temple-total">
        <div class="temple-total-title">⚡ Бонус отряда от Храма:</div>
        <div class="temple-total-body">${totalStr}</div>
      </div>`;
  }

  function _fmtArtBonus(bonus) {
    if (!bonus) return '';
    return Object.entries(bonus)
      .map(([s,v]) => `+${v} ${STAT_LABELS[s] || s}`)
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
        cardHTML = `
          <div class="shop-item-icon">${ally?.icon || '⚔️'}</div>
          <div class="shop-item-name">${ally?.name || item.id}</div>
          <div class="shop-item-meta">
            <span class="shop-stars">${'★'.repeat(item.stars)}</span>
            ${owned ? '<span class="shop-owned-tag">Есть</span>' : ''}
          </div>`;
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
      if (CollectionUI) CollectionUI.render();
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
    return list.map(ally => {
      const owned  = GameState.isUnlocked(ally.id);
      const lvl    = GameState.getCardLevel(ally.id);
      const stars  = lvl ? lvl.stars : ally.starRange[0];
      const power  = lvl ? lvl.powerLevel : 1;
      const race   = RACES[ally.race] || { label: ally.race, color:'#888', bg:'#222' };
      const cls    = CLASSES[ally.class] || { label: ally.class };
      const b      = ally.base;
      return `
        <div class="lib-card ${owned ? 'lib-owned' : 'lib-not-owned'}">
          <div class="lib-card-head">
            <span class="lib-icon">${ally.icon || '⚔️'}</span>
            <div class="lib-card-title">
              <div class="lib-name">${ally.name}</div>
              <div class="lib-meta">
                <span style="background:${race.bg};color:${race.color};padding:1px 6px;border-radius:99px;font-size:0.65rem;">${race.label}</span>
                <span class="lib-cls">${cls.label}</span>
                ${owned ? `<span class="lib-owned-badge">★${stars} Ур.${power}</span>` : '<span class="lib-locked-badge">🔒</span>'}
              </div>
            </div>
          </div>
          <div class="lib-stats">
            ${_statRow('HP', calcStat(b.hp||0, stars, power))}
            ${b.meleeAtk  ? _statRow('Ближн. атк', calcStat(b.meleeAtk, stars, power)) : ''}
            ${b.rangeAtk  ? _statRow('Дальн. атк', calcStat(b.rangeAtk, stars, power)) : ''}
            ${b.magic     ? _statRow('Магия',      calcStat(b.magic,    stars, power)) : ''}
            ${_statRow('Инициатива', calcInitiative(b.initiative, stars, power))}
          </div>
          ${ally.abilities && ally.abilities.length ? `
            <div class="lib-abilities">
              ${ally.abilities.map(ab => `
                <div class="lib-ability">
                  <span class="lib-ab-name">${ab.name}</span>
                  <span class="lib-ab-desc">${ab.desc}</span>
                </div>`).join('')}
            </div>` : ''}
          ${ally.lore ? `<div class="lib-lore">${Object.values(ally.lore)[0]}</div>` : ''}
        </div>`;
    }).join('');
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
  }

  function libSwitch(tab) {
    _libTab = tab;
    const content = document.getElementById('lib-content');
    if (content) content.innerHTML = _buildLibContent();
    document.querySelectorAll('.lib-tab-btn').forEach(b =>
      b.classList.toggle('active', b.textContent.includes(tab === 'allies' ? 'Союзники' : 'Враги'))
    );
  }

  function libSearch(val) {
    _libSearch = val;
    const content = document.getElementById('lib-content');
    if (content) content.innerHTML = _buildLibContent();
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
    openScroll, confirmRecycle, doRecycle,
    buyItem, refreshShop,
    claimQuest,
    libSwitch, libSearch,
    showToast,
    // legacy aliases for portal.js callback:
    renderBalance: _renderBalance,
  };
})();
