// ================================================================
// EXCHANGE UI — Alchemy Shop (Лавка алхимика / Обменный пункт)
// ================================================================

const ExchangeUI = (() => {

  let _selected = [];  // card IDs selected for recycling

  // ── Toast helper (VillageUI available at call time) ───────────

  function _toast(msg, type) {
    if (typeof VillageUI !== 'undefined' && VillageUI.showToast) {
      VillageUI.showToast(msg, type);
    }
  }

  // ── Build HTML ────────────────────────────────────────────────

  function buildHTML() {
    return `
      <img class="building-bg" src="assets/exchange_bg.jpg" alt=""
           onerror="this.style.display='none'">
      <div class="exchange-wrap">
        <div class="exchange-main">

          <!-- Left: card selection list -->
          <div class="cards-col">
            <div class="cards-col-header">
              <span class="col-title">⚗️ Карты</span>
              <span class="col-hint">нажми чтобы выбрать</span>
            </div>
            <div class="cards-scroll" id="exchange-cards-grid"></div>
          </div>

          <!-- Center: cauldron -->
          <div class="cauldron-col">
            <span id="cauldron-emoji">🫕</span>
            <div class="cauldron-label">Котёл алхимика</div>
            <div class="cauldron-hint">Выбери карты — переработай в пыль</div>
          </div>

          <!-- Right: queue + action -->
          <div class="queue-col">
            <div class="queue-title">Очередь переработки</div>
            <div class="queue-list" id="exchange-queue">
              <div class="queue-empty">Выбери карты слева</div>
            </div>
            <div class="queue-sep"></div>
            <div class="queue-total-row">
              <span class="queue-total-label">Получишь:</span>
              <span class="queue-total-val" id="exchange-total">—</span>
            </div>
            <button class="exc-do-btn" id="exc-do-btn"
                    onclick="ExchangeUI.doExchange()" disabled>
              🔥 Переработать
            </button>
          </div>

        </div>
      </div>`;
  }

  // ── Render cards grid ─────────────────────────────────────────

  function renderCards() {
    const grid = document.getElementById('exchange-cards-grid');
    if (!grid) return;

    const unlocked = GameState.getUnlocked();
    const seen   = new Set();
    const unique = unlocked.filter(id => { if (seen.has(id)) return false; seen.add(id); return true; });

    if (!unique.length) {
      grid.innerHTML = '<div class="queue-empty" style="grid-column:1/-1">Нет карт для переработки</div>';
      return;
    }

    grid.innerHTML = unique.map(id => {
      const ally  = ALLIES.find(a => a.id === id);
      if (!ally) return '';
      const lvl   = GameState.getCardLevel(id);
      const stars = lvl ? lvl.stars : ally.starRange[0];
      const sel   = _selected.includes(id);
      return `
        <div class="exc-card${sel ? ' exc-sel' : ''}" onclick="ExchangeUI.toggleCard('${id}')">
          ${sel ? '<div class="exc-check-badge">✓</div>' : ''}
          <div class="exc-icon">${ally.icon || '⚔️'}</div>
          <div class="exc-name">${ally.name}</div>
          <div class="exc-dust">пыль ★${stars}</div>
        </div>`;
    }).join('');
  }

  // ── Render queue column ───────────────────────────────────────

  function renderQueue() {
    const list  = document.getElementById('exchange-queue');
    const total = document.getElementById('exchange-total');
    const btn   = document.getElementById('exc-do-btn');
    if (!list || !total) return;

    if (!_selected.length) {
      list.innerHTML = '<div class="queue-empty">Выбери карты слева</div>';
      total.textContent = '—';
      if (btn) btn.disabled = true;
      return;
    }

    // Compute dust per star
    const dustMap = {};
    _selected.forEach(id => {
      const ally  = ALLIES.find(a => a.id === id);
      const lvl   = GameState.getCardLevel(id);
      const stars = lvl ? lvl.stars : (ally?.starRange[0] || 1);
      dustMap[stars] = (dustMap[stars] || 0) + 1;
    });

    list.innerHTML = _selected.map(id => {
      const ally  = ALLIES.find(a => a.id === id);
      const lvl   = GameState.getCardLevel(id);
      const stars = lvl ? lvl.stars : (ally?.starRange[0] || 1);
      return `
        <div class="queue-item">
          <span class="qi-icon">${ally?.icon || '⚔️'}</span>
          <span class="qi-name">${ally?.name || id}</span>
          <span class="qi-dust">★${stars}</span>
          <button class="qi-remove" onclick="ExchangeUI.toggleCard('${id}')">✕</button>
        </div>`;
    }).join('');

    total.textContent = Object.entries(dustMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([s, n]) => `+${n} пыль ★${s}`)
      .join(' · ');

    if (btn) btn.disabled = false;
  }

  // ── Toggle card selection ─────────────────────────────────────

  function toggleCard(cardId) {
    const idx = _selected.indexOf(cardId);
    if (idx === -1) _selected.push(cardId);
    else _selected.splice(idx, 1);
    renderCards();
    renderQueue();
  }

  // ── Do exchange ───────────────────────────────────────────────

  function doExchange() {
    if (!_selected.length) return;

    const toProcess = [..._selected];
    _selected = [];

    let recycled = 0;
    toProcess.forEach(id => {
      const result = GameState.recycleCard(id);
      if (result.ok) {
        recycled++;
      } else {
        _toast(result.reason, 'error');
      }
    });

    if (recycled > 0) {
      _toast(`Переработано ${recycled} карт в пыль!`, 'success');
      if (typeof App !== 'undefined') App.updateHUD();
      if (typeof NPCSystem !== 'undefined') NPCSystem.trigger('exchange', 'card_recycled');

      // Boiling animation
      const emoji = document.getElementById('cauldron-emoji');
      if (emoji) {
        emoji.classList.add('boiling');
        setTimeout(() => emoji.classList.remove('boiling'), 1200);
      }
    }

    renderCards();
    renderQueue();

    // Sync barracks if open
    if (typeof BarracksUI !== 'undefined' && BarracksUI.render) {
      BarracksUI.render();
    }
  }

  // ── Init (called by _showTab after buildHTML is injected) ─────

  function render() {
    _selected = [];
    renderCards();
    renderQueue();
  }

  return { buildHTML, render, renderCards, renderQueue, toggleCard, doExchange };

})();
