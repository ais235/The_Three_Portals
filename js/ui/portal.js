// ================================================================
// PORTAL — Scroll opening animation + card roll logic
// ================================================================

const Portal = (() => {

  // ── Scroll types ───────────────────────────────────────────────

  const SCROLL_TYPES = {
    bronze: {
      name: 'Бронзовый свиток',
      icon: '📜',
      cost: 100,
      starWeights: { 1: 0.65, 2: 0.30, 3: 0.05, 4: 0.00, 5: 0.00 },
      glowColor: '#8B6914',
    },
    silver: {
      name: 'Серебряный свиток',
      icon: '📃',
      cost: 500,
      starWeights: { 1: 0.10, 2: 0.45, 3: 0.35, 4: 0.10, 5: 0.00 },
      glowColor: '#6080B0',
    },
    gold: {
      name: 'Золотой свиток',
      icon: '📋',
      cost: 2000,
      starWeights: { 1: 0.00, 2: 0.05, 3: 0.35, 4: 0.40, 5: 0.20 },
      glowColor: '#B07800',
    },
  };

  // ── Roll logic ─────────────────────────────────────────────────

  function rollStarLevel(weights) {
    const rand = Math.random();
    let cum = 0;
    for (const [star, w] of Object.entries(weights)) {
      cum += w;
      if (rand <= cum) return parseInt(star);
    }
    return 1;
  }

  function rollCard(scrollType) {
    const sc = SCROLL_TYPES[scrollType];
    if (!sc) return null;

    const rolledStars = rollStarLevel(sc.starWeights);

    // Filter ALLIES by starRange compatibility
    const pool = ALLIES.filter(ally =>
      ally.starRange[0] <= rolledStars && ally.starRange[1] >= rolledStars
    );

    if (!pool.length) {
      GameState.addDust(rolledStars, 1);
      return { type: 'dust', stars: rolledStars };
    }

    const ally = pool[Math.floor(Math.random() * pool.length)];
    const isNew = !GameState.isUnlocked(ally.id);
    GameState.unlockCard(ally.id, rolledStars);
    const copyCount = GameState.getCardCopyCount(ally.id);

    return {
      type: isNew ? 'new_card' : 'duplicate',
      ally,
      stars: rolledStars,
      isNew,
      copyCount,
    };
  }

  // ── Animation ──────────────────────────────────────────────────

  function openScroll(scrollType, onComplete) {
    const sc = SCROLL_TYPES[scrollType];
    const modal = document.getElementById('portal-modal');
    const inner = document.getElementById('portal-card-inner');
    const front  = document.getElementById('portal-front');
    const back   = document.getElementById('portal-back');
    if (!modal || !inner || !front || !back) return;

    // Reset state
    inner.classList.remove('flipped');
    front.innerHTML  = buildScrollFront(sc);
    back.innerHTML   = '';
    modal.style.setProperty('--glow', sc.glowColor);
    modal.classList.remove('hidden');

    // Roll after short delay (let player see the scroll face)
    const result = rollCard(scrollType);

    // Flip on click or after 1s
    let flipped = false;
    function doFlip() {
      if (flipped) return;
      flipped = true;
      inner.classList.add('flipped');

      // Show result on back face
      setTimeout(() => {
        back.innerHTML = buildResultBack(result);
        renderResultActions(result, onComplete);
      }, 350);
    }

    inner.onclick = doFlip;
    inner._flipTimer = setTimeout(doFlip, 1200);
  }

  function buildScrollFront(sc) {
    return `
      <div class="portal-front-content">
        <div class="portal-scroll-icon">${sc.icon}</div>
        <div class="portal-scroll-name">${sc.name}</div>
        <div class="portal-hint">Нажмите чтобы открыть!</div>
      </div>
    `;
  }

  function buildResultBack(result) {
    if (!result) {
      return `<div class="portal-result-content"><div class="pr-icon">❓</div><div>Ошибка</div></div>`;
    }

    if (result.type === 'dust') {
      return `
        <div class="portal-result-content">
          <div class="pr-icon">✨</div>
          <div class="pr-label">Пыль ★${result.stars}</div>
          <div class="pr-sub">+1 пыль ★${result.stars}</div>
        </div>
      `;
    }

    const race = RACES[result.ally.race] || { color:'#888', bg:'#333', label: result.ally.race };
    const cls  = CLASSES[result.ally.class] || { label: result.ally.class };
    const starStr = '★'.repeat(result.stars);
    const badge = result.isNew
      ? `<div class="pr-new-badge">✦ НОВАЯ КАРТА!</div>`
      : `<div class="pr-dup-badge">↺ Копия сохранена (×${result.copyCount})</div>`;

    return `
      <div class="portal-result-content">
        ${badge}
        <div class="pr-card-icon">${result.ally.icon || '⚔️'}</div>
        <div class="pr-card-name">${result.ally.name}</div>
        <div class="pr-card-meta">
          <span style="background:${race.bg};color:${race.color};padding:2px 8px;border-radius:99px;font-size:0.72rem;">${race.label}</span>
          <span style="color:#aaa;font-size:0.72rem;">${cls.label}</span>
        </div>
        <div class="pr-stars" style="color:#ffe066;font-size:1.1rem;">${starStr}</div>
      </div>
    `;
  }

  function renderResultActions(result, onComplete) {
    const actEl = document.getElementById('portal-actions');
    if (!actEl) return;

    actEl.innerHTML = `
      <button class="result-btn primary" onclick="Portal.closePortal()">
        ${result?.isNew ? '✨ В коллекцию!' : '✓ Понятно'}
      </button>
      <button class="result-btn" onclick="Portal.closePortal(true, '${result?.ally?.id || ''}')">
        Ещё раз
      </button>
    `;

    actEl._onComplete = onComplete;
  }

  function closePortal(reopen, allyId) {
    const modal = document.getElementById('portal-modal');
    const inner = document.getElementById('portal-card-inner');
    const actEl = document.getElementById('portal-actions');

    if (inner) clearTimeout(inner._flipTimer);

    if (modal) modal.classList.add('hidden');

    // Quest: open_scrolls
    if (typeof GameState !== 'undefined' && GameState.incrementQuestProgress) {
      GameState.incrementQuestProgress('open_scrolls', 1);
    }

    const cb = actEl?._onComplete;
    if (cb) cb();

    if (BarracksUI) BarracksUI.render();
  }

  return { SCROLL_TYPES, rollCard, openScroll, closePortal };
})();
