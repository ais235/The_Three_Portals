// ================================================================
// EXCHANGE UI — Alchemy Shop (Лавка алхимика / Обменный пункт)
// ================================================================

const ExchangeUI = (() => {

  let _selected = [];

  function _toast(msg, type) {
    if (typeof VillageUI !== 'undefined' && VillageUI.showToast) {
      VillageUI.showToast(msg, type);
    }
  }

  // ── Build HTML ────────────────────────────────────────────────
  // Layout: [NPC 180px fixed] | [Cards 300px] | [Right: cauldron top + queue bottom]

  function buildHTML() {
    return `
      <img class="building-bg" src="assets/exchange_bg.png"
           onerror="this.src='assets/building-bg.png'">
      <div class="exchange-wrap">
        <div class="exchange-main">

          <!-- Left: card selection (300px) -->
          <div class="cards-col">
            <div class="cards-col-header">
              <span class="col-title">⚗️ Карты</span>
              <span class="col-hint">нажми чтобы выбрать</span>
            </div>
            <div class="cards-scroll" id="exchange-cards-grid"></div>
          </div>

          <!-- Right: cauldron (top) + queue (bottom) -->
          <div class="right-col">

            <div class="cauldron-zone">
              <div class="cauldron-wrap">
                <div id="cauldron-emoji" class="cauldron">🫕</div>
              </div>
              <div class="cauldron-label" id="cauldron-hint">
                Выбери карты слева — брось в котёл
              </div>
              <button class="brew-btn" id="brew-btn"
                      onclick="ExchangeUI.doExchange()" disabled>
                🔥 Переработать
              </button>
            </div>

            <div class="queue-zone">
              <div class="queue-header">В котёл:</div>
              <div class="queue-list" id="exchange-queue">
                <div class="queue-empty">Выбери карты слева</div>
              </div>
              <div class="dust-result" id="dust-result">
                <div class="dr-empty">Ничего не выбрано</div>
              </div>
            </div>

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
    const unique = unlocked.filter(id => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

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

  // ── Render queue + dust result ────────────────────────────────

  function renderQueue() {
    const list   = document.getElementById('exchange-queue');
    const result = document.getElementById('dust-result');
    const btn    = document.getElementById('brew-btn');
    if (!list || !result) return;

    if (!_selected.length) {
      list.innerHTML   = '<div class="queue-empty">Выбери карты слева</div>';
      result.innerHTML = '<div class="dr-empty">Ничего не выбрано</div>';
      if (btn) btn.disabled = true;
      return;
    }

    // Dust totals per star level
    const dustMap = {};
    _selected.forEach(id => {
      const ally  = ALLIES.find(a => a.id === id);
      const lvl   = GameState.getCardLevel(id);
      const stars = lvl ? lvl.stars : (ally?.starRange[0] || 1);
      dustMap[stars] = (dustMap[stars] || 0) + 1;
    });

    // Queue items list
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

    // Dust result — stacked rows per star
    result.innerHTML = Object.entries(dustMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([stars, count]) => `
        <div class="dr-row">
          <span class="dr-star">Пыль ★${stars}</span>
          <span class="dr-val">+${count}</span>
        </div>`)
      .join('');

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
      const res = GameState.recycleCard(id);
      if (res.ok) recycled++;
      else _toast(res.reason, 'error');
    });

    if (recycled > 0) {
      _toast(`Переработано ${recycled} карт в пыль!`, 'success');
      if (typeof App !== 'undefined') App.updateHUD();
      if (typeof NPCSystem !== 'undefined') NPCSystem.trigger('exchange', 'card_recycled');

      // Boiling animation
      const cauldron = document.getElementById('cauldron-emoji');
      if (cauldron) {
        cauldron.classList.add('boiling');
        setTimeout(() => cauldron.classList.remove('boiling'), 1200);
      }

      // Update cauldron hint
      const hint = document.getElementById('cauldron-hint');
      if (hint) {
        hint.textContent = '✨ Переработка завершена!';
        setTimeout(() => {
          if (hint) hint.textContent = 'Выбери карты слева — брось в котёл';
        }, 2000);
      }
    }

    renderCards();
    renderQueue();

    if (typeof BarracksUI !== 'undefined' && BarracksUI.render) {
      BarracksUI.render();
    }
  }

  // ── Init ──────────────────────────────────────────────────────

  function render() {
    _selected = [];
    renderCards();
    renderQueue();
  }

  return { buildHTML, render, renderCards, renderQueue, toggleCard, doExchange };

})();
