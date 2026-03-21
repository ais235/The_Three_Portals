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
  cardLevels:    {},
  equipped:      {},
  ownedWeapons:  [],
  completedLocations: [],
  artifacts:     [],
  lastSquad:     [],
  // ── Этап 4 ──
  shopLastRefresh:      '',     // date string YYYY-MM-DD
  shopItems:            [],     // [{ type, id, stars?, rarity?, price, purchased }]
  shopFreeRefreshUsed:  false,  // resets daily
  questLastReset:       '',     // date string
  activeQuests:         [],     // [{ id, type, label, target, progress, claimed, reward, rewardLabel }]
};

// ── GameState ─────────────────────────────────────────────────

const GameState = (() => {
  let data = _loadSave();
  _ensureCardLevels(data);

  // ── Private helpers ────────────────────────────────────────────
  function _todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function _shuffleArr(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Quest definitions (private)
  const _QUEST_DEFS = [
    { id:'complete_locations', label:'Пройди {n} локаций',    targets:[1,2,3],
      reward: t => ({ type:'coins', amount: t * 100 }),       rewardLabel: t => `+${t*100} монет` },
    { id:'kill_enemies',       label:'Победи {n} врагов',      targets:[5,10,20],
      reward: t => ({ type:'coins', amount: t * 12 }),        rewardLabel: t => `+${t*12} монет` },
    { id:'open_scrolls',       label:'Открой {n} свитков',     targets:[1,2,3],
      reward: t => ({ type:'dust', star:2, amount: t }),      rewardLabel: t => `+${t} пыль ★2` },
    { id:'spend_coins',        label:'Потрать {n} монет',      targets:[100,300,500],
      reward: t => ({ type:'dust', star:3, amount:Math.ceil(t/100) }), rewardLabel: t => `+${Math.ceil(t/100)} пыль ★3` },
    { id:'upgrade_cards',      label:'Улучши карту {n} раз',   targets:[1,2,3],
      reward: t => ({ type:'dust', star:1, amount: t }),      rewardLabel: t => `+${t} пыль ★1` },
  ];

  function _generateDailyQuests() {
    const pool = _shuffleArr([..._QUEST_DEFS]);
    return pool.slice(0, 3).map(def => {
      const t = def.targets[Math.floor(Math.random() * def.targets.length)];
      return {
        id:          def.id + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
        type:        def.id,
        label:       def.label.replace('{n}', t),
        target:      t,
        progress:    0,
        claimed:     false,
        reward:      def.reward(t),
        rewardLabel: def.rewardLabel(t),
      };
    });
  }

  function _generateShopItems() {
    const ownedSet   = new Set(data.unlockedCards || []);
    const freshCards = ALLIES.filter(a => !ownedSet.has(a.id));
    const cardPool   = _shuffleArr(freshCards.length >= 4 ? freshCards : [...ALLIES]);
    const cardItems  = cardPool.slice(0, 4).map(ally => {
      const stars = ally.starRange[0];
      const price = stars === 1 ? 80 : stars === 2 ? 300 : stars === 3 ? 800 : stars === 4 ? 1500 : 3000;
      return { type:'card', id:ally.id, stars, price, purchased:false };
    });
    const weapPool   = _shuffleArr([...(typeof WEAPONS !== 'undefined' ? WEAPONS : [])]);
    const weapItems  = weapPool.slice(0, 2).map(w => {
      const price = w.rarity === 'common' ? 150 : w.rarity === 'rare' ? 500 : w.rarity === 'epic' ? 1200 : 2500;
      return { type:'weapon', id:w.id, rarity:w.rarity, price, purchased:false };
    });
    return [...cardItems, ...weapItems];
  }

  function _checkShopRefresh() {
    const today = _todayStr();
    if (data.shopLastRefresh !== today) {
      data.shopLastRefresh     = today;
      data.shopItems           = _generateShopItems();
      data.shopFreeRefreshUsed = false;
      save();
    }
  }

  function _checkQuestReset() {
    const today = _todayStr();
    if (data.questLastReset !== today) {
      data.questLastReset = today;
      data.activeQuests   = _generateDailyQuests();
      save();
    }
  }

  function _loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        return {
          ...DEFAULT_SAVE,
          ...saved,
          dust:      { ...DEFAULT_SAVE.dust, ...(saved.dust || {}) },
          artifacts: saved.artifacts    || [],
          lastSquad: saved.lastSquad    || [],
          shopItems: saved.shopItems    || [],
          activeQuests: saved.activeQuests || [],
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
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      coins:               data.coins,
      dust:                data.dust,
      unlockedCards:       data.unlockedCards,
      cardLevels:          data.cardLevels,
      equipped:            data.equipped,
      ownedWeapons:        data.ownedWeapons,
      completedLocations:  data.completedLocations,
      artifacts:           data.artifacts,
      lastSquad:           data.lastSquad,
      shopLastRefresh:     data.shopLastRefresh,
      shopItems:           data.shopItems,
      shopFreeRefreshUsed: data.shopFreeRefreshUsed,
      questLastReset:      data.questLastReset,
      activeQuests:        data.activeQuests,
    }));
  }

  // ── Coins ──────────────────────────────────────────────────────
  function spendCoins(amount, trackQuest = true) {
    if (data.coins < amount) return false;
    data.coins -= amount;
    if (trackQuest) incrementQuestProgress('spend_coins', amount);
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
    incrementQuestProgress('upgrade_cards', 1);
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
      incrementQuestProgress('complete_locations', 1);
      save();
    }
  }
  function isCompleted(id) { return data.completedLocations.includes(id); }

  // ── Artifacts ──────────────────────────────────────────────────
  function addArtifact(id) {
    if (!data.artifacts.includes(id)) {
      data.artifacts.push(id);
      save();
      return true;
    }
    return false; // duplicate
  }
  function hasArtifact(id) { return data.artifacts.includes(id); }
  function getArtifacts()  { return [...data.artifacts]; }

  // ── Last squad ─────────────────────────────────────────────────
  function setLastSquad(ids) { data.lastSquad = [...ids]; save(); }
  function getLastSquad()    { return [...(data.lastSquad || [])]; }

  // ── Shop ───────────────────────────────────────────────────────
  function getShopItems() {
    _checkShopRefresh();
    return data.shopItems || [];
  }

  function buyShopItem(idx) {
    _checkShopRefresh();
    const item = (data.shopItems || [])[idx];
    if (!item || item.purchased) return { ok:false, reason:'Уже куплено' };
    if (!spendCoins(item.price, true)) return { ok:false, reason:`Недостаточно монет (нужно ${item.price})` };
    item.purchased = true;
    if (item.type === 'card') {
      unlockCard(item.id, item.stars);
    } else if (item.type === 'weapon') {
      addWeapon(item.id);
    }
    save();
    return { ok:true };
  }

  function refreshShop(force = false) {
    _checkShopRefresh();
    if (!force && !data.shopFreeRefreshUsed) {
      // Free refresh
      data.shopFreeRefreshUsed = true;
      data.shopItems = _generateShopItems();
      save();
      return { ok:true, cost:0 };
    }
    // Paid refresh
    const cost = 200;
    if (!spendCoins(cost, false)) return { ok:false, reason:`Нужно ${cost} монет для обновления` };
    data.shopItems = _generateShopItems();
    save();
    return { ok:true, cost };
  }

  // ── Quests ─────────────────────────────────────────────────────
  function getActiveQuests() {
    _checkQuestReset();
    return [...(data.activeQuests || [])];
  }

  function incrementQuestProgress(type, amount = 1) {
    if (!data.activeQuests || !data.activeQuests.length) return;
    let changed = false;
    data.activeQuests.forEach(q => {
      if (q.type === type && !q.claimed && q.progress < q.target) {
        q.progress = Math.min(q.target, q.progress + amount);
        changed = true;
      }
    });
    if (changed) save();
  }

  function claimQuestReward(questId) {
    const q = (data.activeQuests || []).find(q => q.id === questId);
    if (!q) return { ok:false, reason:'Задание не найдено' };
    if (q.progress < q.target) return { ok:false, reason:'Задание не выполнено' };
    if (q.claimed) return { ok:false, reason:'Награда уже получена' };
    q.claimed = true;
    const r = q.reward;
    if (r.type === 'coins') {
      addCoins(r.amount);
    } else if (r.type === 'dust') {
      addDust(r.star, r.amount);
    }
    save();
    return { ok:true, reward: r };
  }

  function recordKills(count) {
    if (count > 0) incrementQuestProgress('kill_enemies', count);
  }

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
    addArtifact, hasArtifact, getArtifacts,
    setLastSquad, getLastSquad,
    getShopItems, buyShopItem, refreshShop,
    getActiveQuests, incrementQuestProgress, claimQuestReward, recordKills,
    reset,
  };
})();

// ── App controller ────────────────────────────────────────────

const App = {

  _currentLocation: null,   // location context for current battle
  _skipBattleInit:  false,  // set true when initCustomBattle handles setup

  init() {
    this.setupNav();
    this.showScreen('home');
    CollectionUI.init();
    InventoryUI.init();
    VillageUI.init();
    VillageMapUI.init();
    WorldMap.init();
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
      case 'battle':
        if (!this._skipBattleInit) this.initBattle();
        this._skipBattleInit = false;
        break;
      case 'collection':   CollectionUI.render();     break;
      case 'inventory':    InventoryUI.render();      break;
      case 'village':      VillageUI.render();        break;
      case 'villagemap':   VillageMapUI.render();     break;
      case 'worldmap':     WorldMap.render();         break;
      case 'squad_select': SquadSelect.render();      break;
      case 'home':         this.updateHomeStats();    break;
    }
  },

  updateHomeStats() {
    const el = id => document.getElementById(id);
    if (el('stat-coins'))      el('stat-coins').textContent     = GameState.coins;
    if (el('stat-unlocked'))   el('stat-unlocked').textContent  = GameState.getUnlocked().length;
    if (el('stat-locations'))  el('stat-locations').textContent = GameState.isCompleted
      ? LOCATIONS.filter(l => GameState.isCompleted(l.id)).length
      : 0;
  },

  // ── Battle ─────────────────────────────────────────────────────

  _startBattle(allies, enemies) {
    const resultEl = document.getElementById('battle-result');
    if (resultEl) resultEl.classList.add('hidden');

    BattleLog.init();
    Battle.init(allies, enemies, {
      onLogEntry:      e  => BattleLog.addEntry(e),
      onRender:        st => BattlefieldUI.render(st),
      onEnd:           (result, st) => this.onBattleEnd(result, st),
      onEnableActions: u  => BattlefieldUI.updateCurrentUnitInfo(u),
      onRequestTarget: () => BattlefieldUI.requestTarget(),
    });
  },

  initBattle() {
    this._currentLocation = null;
    const { allies, enemies } = createTestBattle();
    this._startBattle(allies, enemies);
  },

  // Called by SquadSelect after building units
  initCustomBattle(allies, enemies, location) {
    this._currentLocation = location || null;
    this._skipBattleInit  = true;       // prevent showScreen from calling initBattle()
    this.showScreen('battle');
    this._startBattle(allies, enemies);
  },

  onBattleEnd(result, battleState) {
    BattlefieldUI.render(battleState);

    const loc         = this._currentLocation;
    const rounds      = battleState.round;
    const damageDealt = battleState.totalDamageDealt || 0;
    let coinsEarned   = 0;
    let coinsPenalty  = 0;
    let droppedWeapon = null;
    let droppedScroll = null;
    let droppedArtifact = null;

    if (result === 'victory') {
      if (loc) {
        // Location-based rewards
        const [minC, maxC] = loc.rewards.coins || [60, 100];
        coinsEarned = minC + Math.floor(Math.random() * (maxC - minC + 1));
        GameState.addCoins(coinsEarned);
        GameState.completeLocation(loc.id);

        // Weapon drop
        if (Math.random() < (loc.rewards.weaponChance || 0)) {
          const rarityMap = { bronze: 'common', silver: 'rare', gold: 'epic' };
          const rarity = rarityMap[loc.rewards.scrollType] || 'common';
          const pool = WEAPONS.filter(w => w.rarity === rarity || w.rarity === 'common');
          droppedWeapon = pool[Math.floor(Math.random() * pool.length)] || null;
          if (droppedWeapon) GameState.addWeapon(droppedWeapon.id);
        }

        // Scroll drop
        if (Math.random() < (loc.rewards.scrollChance || 0)) {
          droppedScroll = loc.rewards.scrollType || 'bronze';
          // Represent scroll as bonus coins for now
          const scrollValue = droppedScroll === 'gold' ? 2000 : droppedScroll === 'silver' ? 500 : 100;
          GameState.addCoins(scrollValue);
        }

        // Artifact from boss
        if (loc.isBoss && loc.rewards.artifact) {
          const artId  = loc.rewards.artifact;
          const isNew  = GameState.addArtifact(artId);
          droppedArtifact = { ...(ARTIFACTS[artId] || { id: artId, name: artId, icon: '🏅' }), isNew };
        }

        // Unlock next locations — refresh worldmap if visible
        if (typeof WorldMap !== 'undefined') {
          const wmEl = document.getElementById('screen-worldmap');
          if (wmEl && !wmEl.classList.contains('hidden')) WorldMap.render();
        }
      } else {
        // Test battle fallback
        coinsEarned = Math.min(150, 80 + rounds * 5);
        GameState.addCoins(coinsEarned);
        if (Math.random() < 0.25) {
          const pool = WEAPONS.filter(w => w.rarity === 'common');
          droppedWeapon = pool[Math.floor(Math.random() * pool.length)] || null;
          if (droppedWeapon) GameState.addWeapon(droppedWeapon.id);
        }
      }
    } else {
      coinsPenalty = Math.min(30, Math.floor(damageDealt * 0.1));
      if (coinsPenalty > 0) {
        const before = GameState.coins;
        GameState.addCoins(-Math.min(coinsPenalty, before));
        coinsPenalty = Math.min(coinsPenalty, before);
      }
    }

    // Quest: count kills
    const deadEnemies = battleState.enemies.filter(u => !u.isAlive).length;
    if (deadEnemies > 0) GameState.recordKills(deadEnemies);

    this.showBattleRewards(result, battleState, {
      coinsEarned, coinsPenalty, droppedWeapon, droppedScroll, droppedArtifact,
    });
  },

  showBattleRewards(result, battleState, rewards) {
    const overlay   = document.getElementById('battle-result');
    if (!overlay) return;

    const icon      = document.getElementById('result-icon');
    const title     = document.getElementById('result-title');
    const rewardsEl = document.getElementById('result-rewards');
    const btns      = document.getElementById('result-buttons');

    const deadAllies = battleState.allies.filter(u => !u.isAlive).length;
    const loc        = this._currentLocation;

    if (result === 'victory') {
      if (icon)  icon.textContent = '🏆';
      if (title) { title.textContent = 'ПОБЕДА!'; title.style.color = '#ffe066'; }
    } else {
      if (icon)  icon.textContent = '💀';
      if (title) { title.textContent = 'ПОРАЖЕНИЕ!'; title.style.color = '#ff4444'; }
    }

    if (rewardsEl) {
      let html = `<div class="result-stat">Раунд: <strong>${battleState.round}</strong> | Потери: <strong>${deadAllies}/${battleState.allies.length}</strong></div>`;
      if (result === 'victory') {
        html += `<div class="result-reward-row">💰 +${rewards.coinsEarned} монет</div>`;
        if (rewards.droppedWeapon)
          html += `<div class="result-reward-row drop-row">🗡️ Найдено: <strong>${rewards.droppedWeapon.name}</strong> ${rewards.droppedWeapon.icon}</div>`;
        if (rewards.droppedScroll)
          html += `<div class="result-reward-row drop-row">📜 Свиток (${rewards.droppedScroll})</div>`;
        if (rewards.droppedArtifact)
          html += `<div class="result-reward-row artifact-row">${rewards.droppedArtifact.icon} <strong>${rewards.droppedArtifact.name}</strong>${rewards.droppedArtifact.isNew ? ' <em>(новый!)</em>' : ''}</div>`;
      } else {
        html += rewards.coinsPenalty > 0
          ? `<div class="result-reward-row penalty-row">💸 −${rewards.coinsPenalty} монет</div>`
          : `<div class="result-reward-row">Монеты сохранены</div>`;
      }
      rewardsEl.innerHTML = html;
    }

    if (btns) {
      const retryTarget = loc ? `SquadSelect.open(getLocation('${loc.id}'))` : `Battle.restart()`;
      const mapBtn = loc
        ? `<button class="result-btn primary" onclick="App.showScreen('worldmap')">🗺️ Карта мира</button>`
        : '';
      btns.innerHTML = `
        <button class="result-btn" onclick="${retryTarget}">🔄 Повторить</button>
        ${mapBtn}
        <button class="result-btn" onclick="App.showScreen('villagemap')">🏘 В деревню</button>
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
