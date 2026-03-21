// ================================================================
// VILLAGE SCREEN — Portal circle, exchange point, balance
// ================================================================

const VillageUI = (() => {

  function init() { /* no special init needed */ }

  // ── Main render ────────────────────────────────────────────────

  function render() {
    renderBalance();
    renderPortalSection();
    renderExchangeSection();
  }

  // ── Balance bar ────────────────────────────────────────────────

  function renderBalance() {
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

  // ── Portal section ─────────────────────────────────────────────

  function renderPortalSection() {
    const el = document.getElementById('v-portal-btns');
    if (!el) return;

    const scrolls = Portal.SCROLL_TYPES;
    el.innerHTML = Object.entries(scrolls).map(([key, sc]) => {
      const canAfford = GameState.coins >= sc.cost;
      return `
        <button class="scroll-btn scroll-${key} ${canAfford ? '' : 'disabled'}"
                onclick="VillageUI.openScroll('${key}')" ${canAfford ? '' : 'disabled'}>
          <span class="scroll-icon">${sc.icon}</span>
          <span class="scroll-info">
            <strong>${sc.name}</strong>
            <small>${sc.cost} 💰</small>
          </span>
          <span class="scroll-odds">${formatOdds(sc.starWeights)}</span>
        </button>
      `;
    }).join('');
  }

  function formatOdds(weights) {
    return Object.entries(weights)
      .filter(([,v]) => v > 0)
      .map(([s,v]) => `★${s} ${Math.round(v*100)}%`)
      .join(' · ');
  }

  function openScroll(type) {
    const sc = Portal.SCROLL_TYPES[type];
    if (!sc) return;
    if (!GameState.spendCoins(sc.cost)) {
      showToast(`Недостаточно монет! Нужно ${sc.cost} 💰`);
      return;
    }
    renderBalance();
    Portal.openScroll(type, (result) => {
      renderBalance();
      renderPortalSection();
      renderExchangeSection();
    });
  }

  // ── Exchange section ───────────────────────────────────────────

  function renderExchangeSection() {
    const grid = document.getElementById('v-exchange-grid');
    if (!grid) return;

    const unlocked = GameState.getUnlocked();
    if (unlocked.length === 0) {
      grid.innerHTML = '<div class="v-empty">Нет карт для переработки</div>';
      return;
    }

    grid.innerHTML = unlocked.map(id => {
      const ally = ALLIES.find(a => a.id === id);
      if (!ally) return '';
      const lvl = GameState.getCardLevel(id);
      const stars = lvl ? lvl.stars : ally.starRange[0];
      const race = RACES[ally.race] || { color:'#888', bg:'#222', label: ally.race };
      return `
        <div class="exchange-card" onclick="VillageUI.confirmRecycle('${id}')">
          <div class="ec-icon">${ally.icon || '⚔️'}</div>
          <div class="ec-name">${ally.name}</div>
          <div class="ec-stars">★${stars}</div>
          <div class="ec-yield">→ <span class="dust-chip star-${stars} small">1 пыль ★${stars}</span></div>
        </div>
      `;
    }).join('');
  }

  function confirmRecycle(id) {
    const ally = ALLIES.find(a => a.id === id);
    if (!ally) return;
    const lvl = GameState.getCardLevel(id);
    const stars = lvl ? lvl.stars : ally.starRange[0];

    App.openModal(`
      <div style="text-align:center;padding:20px 10px;">
        <div style="font-size:3rem;margin-bottom:12px;">${ally.icon || '⚔️'}</div>
        <h3 style="margin-bottom:8px;">${ally.name}</h3>
        <p style="color:#aaa;margin-bottom:20px;">
          Переработать карту в<br>
          <span class="dust-chip star-${stars}">1 пыль ★${stars}</span>?
        </p>
        <p style="color:#f66;font-size:0.82rem;margin-bottom:20px;">
          Карта будет удалена из коллекции.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button class="result-btn danger" onclick="VillageUI.doRecycle('${id}')">
            🔄 Переработать
          </button>
          <button class="result-btn" onclick="App.forceCloseModal()">Отмена</button>
        </div>
      </div>
    `);
  }

  function doRecycle(id) {
    App.forceCloseModal();
    const result = GameState.recycleCard(id);
    if (result.ok) {
      showToast(`Переработано → +1 пыль ★${result.dustStar}`, 'success');
      renderBalance();
      renderExchangeSection();
      if (CollectionUI) CollectionUI.render();
    } else {
      showToast(result.reason, 'error');
    }
  }

  // ── Toast notification ─────────────────────────────────────────

  function showToast(msg, type = 'info') {
    let toast = document.getElementById('village-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'village-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `village-toast toast-${type}`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  return { init, render, openScroll, confirmRecycle, doRecycle, renderBalance, showToast };
})();
