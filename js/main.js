// ================================================================
// MAIN — App controller + persistent GameState (Этап 2)
// ================================================================

const SAVE_KEY = 'fcq_save_v1';

const DEFAULT_SAVE = {
  coins: 150,
  dust:  { 1:0, 2:0, 3:0, 4:0, 5:0 },
  unlockedCards: [
    'straznik','opolchenec','kopeyshik','luchnik','poslushnik',
    'ohotnik','uchenik_ognya','elektrik','wolf',
  ],
  cardLevels:    {},  // { cardId: { stars, powerLevel } }
  equipped:      {},  // { cardId: weaponId }
  ownedWeapons:  [],
  completedLocations: [],
};

// ── GameState ─────────────────────────────────────────────────

const GameState = (() => {
  let data = _loadSave();
  _ensureCardLevels(data);

  function _loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // deep-merge
        return {
          ...DEFAULT_SAVE,
          ...saved,
          dust: { ...DEFAULT_SAVE.dust, ...(saved.dust || {}) },
        };
      }
    } catch(e) {}
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }

  function _ensureCardLevels(d) {
    (d.unlockedCards || []).forEach(id => {
      if (!d.cardLevels[id]) {
        const ally = ALLIES.find(a => a.id === id);
        if (ally) d.cardLevels[id] = { stars: ally.starRange[0], powerLevel: 1 };
      }
    });
  }

  function save() {
    const out = {
      coins:              data.coins,
      dust:               data.dust,
      unlockedCards:      data.unlockedCards,
      cardLevels:         data.cardLevels,
      equipped:           data.equipped,
      ownedWeapons:       data.ownedWeapons,
      completedLocations: data.completedLocations,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(out));
  }

  // ── Coins ──────────────────────────────────────────────────────
  function spendCoins(amount) {
    if (data.coins < amount) return false;
    data.coins -= amount;
    save();
    return true;
  }
  function addCoins(amount) { data.coins += amount; save(); }
  function getCoins() { return data.coins; }

  // ── Dust ───────────────────────────────────────────────────────
  function addDust(star, amount = 1) {
    data.dust[star] = (data.dust[star] || 0) + amount;
    save();
  }
  function spendDust(star, amount = 1) {
    if ((data.dust[star] || 0) < amount) return false;
    data.dust[star] = (data.dust[star] || 0) - amount;
    save();
    return true;
  }
  function getDust() { return { ...data.dust }; }

  // ── Cards ──────────────────────────────────────────────────────
  function isUnlocked(id) { return data.unlockedCards.includes(id); }
  function getUnlocked() { return [...data.unlockedCards]; }

  function unlockCard(id, stars) {
    if (data.unlockedCards.includes(id)) return false;
    data.unlockedCards.push(id);
    const ally = ALLIES.find(a => a.id === id);
    data.cardLevels[id] = { stars: stars || ally?.starRange[0] || 1, powerLevel: 1 };
    save();
    return true; // newly unlocked
  }

  function getCardLevel(id) {
    return data.cardLevels[id] || null;
  }

  function upgradeCard(id) {
    const lvl = data.cardLevels[id];
    if (!lvl) return { ok: false, reason: 'Карта не разблокирована' };
    const maxPower = lvl.stars * 10;
    if (lvl.powerLevel >= maxPower) return { ok: false, reason: 'Максимальный уровень' };
    if (!spendDust(lvl.stars, 1)) return { ok: false, reason: `Недостаточно пыли ★${lvl.stars}` };
    lvl.powerLevel++;
    save();
    return { ok: true };
  }

  // ── Equipment ──────────────────────────────────────────────────
  function equipWeapon(cardId, weaponId) {
    // unequip from others
    for (const [k, v] of Object.entries(data.equipped)) {
      if (v === weaponId) delete data.equipped[k];
    }
    data.equipped[cardId] = weaponId;
    save();
  }
  function unequipWeapon(cardId) {
    delete data.equipped[cardId];
    save();
  }
  function getEquipped(cardId) { return data.equipped[cardId] || null; }
  function getAllEquipped() { return { ...data.equipped }; }

  // ── Weapons ────────────────────────────────────────────────────
  function addWeapon(id) {
    if (!data.ownedWeapons.includes(id)) {
      data.ownedWeapons.push(id);
      save();
      return true;
    }
    return false;
  }
  function hasWeapon(id) { return data.ownedWeapons.includes(id); }
  function getOwnedWeapons() { return [...data.ownedWeapons]; }

  // ── Recycle card into dust ─────────────────────────────────────
  function recycleCard(id) {
    if (!data.unlockedCards.includes(id)) return { ok: false, reason: 'Нет такой карты' };
    // Can't recycle if only 1 unlocked card
    if (data.unlockedCards.length <= 1) return { ok: false, reason: 'Нельзя переработать последнюю карту' };
    const lvl = data.cardLevels[id] || { stars: 1 };
    const dustStar = lvl.stars;
    data.unlockedCards = data.unlockedCards.filter(c => c !== id);
    delete data.cardLevels[id];
    // Unequip if equipped
    for (const [k, v] of Object.entries(data.equipped)) {
      if (k === id) delete data.equipped[k];
    }
    addDust(dustStar, 1);
    return { ok: true, dustStar };
  }

  // ── Locations ──────────────────────────────────────────────────
  function completeLocation(id) {
    if (!data.completedLocations.includes(id)) {
      data.completedLocations.push(id);
      save();
    }
  }
  function isCompleted(id) { return data.completedLocations.includes(id); }

  // ── Reset (dev) ────────────────────────────────────────────────
  function reset() {
    localStorage.removeItem(SAVE_KEY);
    data = _loadSave();
    _ensureCardLevels(data);
    save();
  }

  return {
    get coins() { return data.coins; },
    get dust()  { return { ...data.dust }; },
    // equippedWeapons alias for backward compat with inventory/collection:
    get equipped() { return data.equipped; },

    save, spendCoins, addCoins, getCoins,
    addDust, spendDust, getDust,
    isUnlocked, getUnlocked, unlockCard, getCardLevel, upgradeCard,
    equipWeapon, unequipWeapon, getEquipped, getAllEquipped,
    addWeapon, hasWeapon, getOwnedWeapons,
    recycleCard,
    completeLocation, isCompleted,
    reset,
  };
})();

// ── App controller ────────────────────────────────────────────

const App = {

  init() {
    this.setupNav();
    this.showScreen('home');
    CollectionUI.init();
    InventoryUI.init();
    VillageUI.init();
    this.updateHomeStats();
  },

  setupNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.showScreen(btn.dataset.screen));
    });
  },

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`screen-${screenId}`);
    if (target) target.classList.remove('hidden');

    const btn = document.querySelector(`.nav-btn[data-screen="${screenId}"]`);
    if (btn) btn.classList.add('active');

    switch (screenId) {
      case 'battle':     this.initBattle();        break;
      case 'collection': CollectionUI.render();     break;
      case 'inventory':  InventoryUI.render();      break;
      case 'village':    VillageUI.render();        break;
      case 'home':       this.updateHomeStats();    break;
    }
  },

  updateHomeStats() {
    const el = id => document.getElementById(id);
    if (el('stat-coins'))   el('stat-coins').textContent  = GameState.coins;
    if (el('stat-unlocked')) el('stat-unlocked').textContent = GameState.getUnlocked().length;
  },

  // ── Battle ─────────────────────────────────────────────────────

  initBattle() {
    const resultEl = document.getElementById('battle-result');
    if (resultEl) resultEl.classList.add('hidden');

    BattleLog.init();
    const { allies, enemies } = createTestBattle();

    Battle.init(allies, enemies, {
      onLogEntry:      e  => BattleLog.addEntry(e),
      onRender:        st => BattlefieldUI.render(st),
      onEnd:           (result, st) => this.onBattleEnd(result, st),
      onEnableActions: u  => BattlefieldUI.updateCurrentUnitInfo(u),
      onRequestTarget: () => BattlefieldUI.requestTarget(),
    });
  },

  onBattleEnd(result, battleState) {
    BattlefieldUI.render(battleState);

    const rounds        = battleState.round;
    const damageDealt   = battleState.totalDamageDealt || 0;
    let   coinsEarned   = 0;
    let   coinsPenalty  = 0;
    let   droppedWeapon = null;

    if (result === 'victory') {
      // Base reward + bonus for quick finish
      coinsEarned = Math.min(150, 80 + rounds * 5);
      GameState.addCoins(coinsEarned);
      GameState.completeLocation('zone1_battle1');

      // Weapon drop (25% chance)
      if (Math.random() < 0.25) {
        const common = WEAPONS.filter(w => w.rarity === 'common');
        droppedWeapon = common[Math.floor(Math.random() * common.length)] || null;
        if (droppedWeapon) GameState.addWeapon(droppedWeapon.id);
      }
    } else {
      // Penalty: 10% of damage dealt to enemies (max 30 coins)
      coinsPenalty = Math.min(30, Math.floor(damageDealt * 0.1));
      if (coinsPenalty > 0) {
        const before = GameState.coins;
        GameState.addCoins(-Math.min(coinsPenalty, before));
        coinsPenalty = Math.min(coinsPenalty, before);
      }
    }

    this.showBattleRewards(result, battleState, { coinsEarned, coinsPenalty, droppedWeapon });
  },

  showBattleRewards(result, battleState, rewards) {
    const overlay = document.getElementById('battle-result');
    if (!overlay) return;

    const icon    = document.getElementById('result-icon');
    const title   = document.getElementById('result-title');
    const rewardsEl = document.getElementById('result-rewards');
    const btns    = document.getElementById('result-buttons');

    const deadAllies  = battleState.allies.filter(u => !u.isAlive).length;
    const deadEnemies = battleState.enemies.filter(u => !u.isAlive).length;

    if (result === 'victory') {
      if (icon)  icon.textContent  = '🏆';
      if (title) { title.textContent = 'ПОБЕДА!'; title.style.color = '#ffe066'; }
    } else {
      if (icon)  icon.textContent  = '💀';
      if (title) { title.textContent = 'ПОРАЖЕНИЕ!'; title.style.color = '#ff4444'; }
    }

    if (rewardsEl) {
      let html = `<div class="result-stat">Раунд: <strong>${battleState.round}</strong> | Потери: <strong>${deadAllies}/${battleState.allies.length}</strong></div>`;
      if (result === 'victory') {
        html += `<div class="result-reward-row">💰 +${rewards.coinsEarned} монет</div>`;
        if (rewards.droppedWeapon) {
          html += `<div class="result-reward-row drop-row">🗡️ Найдено: <strong>${rewards.droppedWeapon.name}</strong> ${rewards.droppedWeapon.icon}</div>`;
        }
      } else {
        if (rewards.coinsPenalty > 0)
          html += `<div class="result-reward-row penalty-row">💸 −${rewards.coinsPenalty} монет</div>`;
        else
          html += `<div class="result-reward-row">Монеты сохранены</div>`;
      }
      rewardsEl.innerHTML = html;
    }

    if (btns) {
      btns.innerHTML = `
        <button class="result-btn primary" onclick="Battle.restart()">🔄 Снова</button>
        <button class="result-btn" onclick="App.showScreen('village')">🏘 В деревню</button>
        <button class="result-btn" onclick="App.showScreen('home')">🏰 Главная</button>
      `;
    }

    overlay.classList.remove('hidden');
    this.updateHomeStats();
  },

  // ── Modal ──────────────────────────────────────────────────────

  openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;
    content.innerHTML = html;
    overlay.classList.remove('hidden');
  },

  closeModal(event) {
    if (event && event.target && event.target.id !== 'modal-overlay') return;
    document.getElementById('modal-overlay')?.classList.add('hidden');
  },

  forceCloseModal() {
    document.getElementById('modal-overlay')?.classList.add('hidden');
  },
};

// ── Keyboard ──────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') App.forceCloseModal();
});

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
