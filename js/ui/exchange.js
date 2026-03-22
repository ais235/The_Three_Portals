// ================================================================
// EXCHANGE UI — Alchemy Shop (Лавка алхимика)
// Standalone screen: #screen-exchange
// Two belts: top = horizontal card scroll, bottom = cauldron + queue
// ================================================================

const ExchangeUI = {

  selected: [],   // card IDs queued for recycling
  _activeFilter: 'all',

  // ── Entry point ───────────────────────────────────────────────

  show() {
    this.selected      = [];
    this._activeFilter = 'all';
    this._resetFilter();
    this.renderCards('all');
    this.renderQueue();
    this.attachFilters();
    if (typeof NPCSystem !== 'undefined') NPCSystem.init('exchange');
  },

  // ── Filters ───────────────────────────────────────────────────

  _resetFilter() {
    document.querySelectorAll('.ef').forEach(b => {
      b.classList.toggle('active', b.dataset.f === 'all');
    });
  },

  attachFilters() {
    document.querySelectorAll('.ef').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ef').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._activeFilter = btn.dataset.f;
        this.renderCards(btn.dataset.f);
      });
    });
  },

  // ── Cards row (top belt) ──────────────────────────────────────

  renderCards(filter) {
    const row = document.getElementById('exchange-cards-row');
    if (!row) return;

    const unlocked = GameState.getUnlocked();

    // Build counts for dup filter
    const counts = {};
    unlocked.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

    let cards = unlocked
      .map(id => ALLIES.find(c => c.id === id))
      .filter(Boolean);

    if (filter === 'dup') {
      cards = cards.filter(c => counts[c.id] > 1);
    } else if (['1','2','3','4','5'].includes(filter)) {
      const s = Number(filter);
      cards = cards.filter(c => {
        const lvl   = GameState.getCardLevel(c.id);
        const stars = lvl ? lvl.stars : c.starRange[0];
        return stars === s;
      });
    }

    if (!cards.length) {
      row.innerHTML = '<div class="ex-row-empty">Нет карт для выбранного фильтра</div>';
      return;
    }

    row.innerHTML = cards.map(card =>
      UnitCard.buildMiniCard(card, { showLocked: false })
    ).join('');

    // Restore selection highlight + attach toggle clicks
    row.querySelectorAll('.fc[data-id]').forEach(el => {
      if (this.selected.includes(el.dataset.id)) {
        el.classList.add('selected-for-exchange');
      }
      el.addEventListener('click', e => {
        e.stopPropagation();  // prevent UnitCard detail modal
        this.toggleCard(el.dataset.id);
      });
    });
  },

  // ── Toggle selection ──────────────────────────────────────────

  toggleCard(id) {
    const idx = this.selected.indexOf(id);
    if (idx === -1) this.selected.push(id);
    else            this.selected.splice(idx, 1);
    this.renderCards(this._activeFilter);
    this.renderQueue();
  },

  // ── Queue + dust result (bottom belt) ────────────────────────

  renderQueue() {
    const list   = document.getElementById('ex-queue-list');
    const result = document.getElementById('ex-dust-result');
    const hint   = document.getElementById('ex-hint');
    const btn    = document.getElementById('ex-brew-btn');
    if (!list || !result) return;

    if (!this.selected.length) {
      list.innerHTML   = '<div class="ex-queue-empty">Ничего не выбрано</div>';
      result.innerHTML = '<div class="ex-dr-empty">— выбери карты —</div>';
      if (hint) hint.textContent = 'Выбери карты сверху';
      if (btn)  { btn.disabled = true; btn.textContent = '🔥 Переработать'; }
      return;
    }

    // Selected items list
    list.innerHTML = this.selected.map(id => {
      const card  = ALLIES.find(c => c.id === id);
      const lvl   = GameState.getCardLevel(id);
      const stars = lvl ? lvl.stars : (card?.starRange[0] || 1);
      return `
        <div class="ex-queue-item">
          <span class="ex-qi-icon">${card?.icon || '🃏'}</span>
          <div>
            <div class="ex-qi-name">${card?.name || id}</div>
            <div class="ex-qi-dust">+1 пыль ★${stars}</div>
          </div>
          <span class="ex-qi-rm" onclick="ExchangeUI.toggleCard('${id}')">✕</span>
        </div>`;
    }).join('');

    // Dust totals per star — stacked rows
    const totals = {};
    this.selected.forEach(id => {
      const card  = ALLIES.find(c => c.id === id);
      const lvl   = GameState.getCardLevel(id);
      const stars = lvl ? lvl.stars : (card?.starRange[0] || 1);
      totals[stars] = (totals[stars] || 0) + 1;
    });
    result.innerHTML = Object.entries(totals)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([s, n], i, arr) => `
        <div class="ex-dr-row">
          <span class="ex-dr-star">Пыль ★${s}</span>
          <span class="ex-dr-val">+${n}</span>
        </div>${i < arr.length - 1 ? '<div class="ex-dr-divider"></div>' : ''}`)
      .join('');

    if (hint) hint.textContent = `${this.selected.length} карт выбрано`;
    if (btn) {
      btn.disabled    = false;
      btn.textContent = `🔥 Переработать (${this.selected.length})`;
    }
  },

  // ── Execute exchange ──────────────────────────────────────────

  doExchange() {
    if (!this.selected.length) return;

    // Cauldron boil animation
    const cauldron = document.getElementById('ex-cauldron');
    if (cauldron) {
      cauldron.style.animation = 'ex-boil 0.3s ease-in-out 4';
      setTimeout(() => {
        if (cauldron) cauldron.style.animation = 'ex-bob 3s ease-in-out infinite';
      }, 1300);
    }

    // Recycle via GameState API
    let recycled = 0;
    const toProcess = [...this.selected];
    this.selected = [];

    toProcess.forEach(id => {
      const res = GameState.recycleCard(id);
      if (res.ok) {
        recycled++;
      } else if (typeof VillageUI !== 'undefined') {
        VillageUI.showToast(res.reason, 'error');
      }
    });

    if (recycled > 0) {
      GameState.incrementQuestProgress('recycle_cards', recycled);
      if (typeof App !== 'undefined') App.updateHUD();
      if (typeof NPCSystem !== 'undefined') NPCSystem.trigger('exchange', 'card_recycled');
      if (typeof VillageUI !== 'undefined') {
        VillageUI.showToast(`Переработано ${recycled} карт в пыль!`, 'success');
      }
    }

    this.renderCards(this._activeFilter);
    this.renderQueue();
  },
};
