// ================================================================
// MAIN — App controller + persistent GameState (Этап 2)
// ================================================================

const SAVE_KEY = 'fcq_save_v1';
const STARTER_PACKS = {
  easy: ['straznik', 'kopeyshik', 'poslushnik'],      // Танк + ДПС + Хил
  hard: ['straznik', 'luchnik', 'uchenik_ognya'],     // Танк + Стрелок + Маг
};

const DEFAULT_SAVE = {
  coins: 150,
  dust:  { 1:0, 2:0, 3:0, 4:0, 5:0 },
  // Стартовый отряд ★1: танк / урон / поддержка (хилер)
  unlockedCards: ['straznik', 'kopeyshik', 'poslushnik'],
  cardLevels: {
    straznik:   { stars: 1, powerLevel: 1 },
    kopeyshik:  { stars: 1, powerLevel: 1 },
    poslushnik: { stars: 1, powerLevel: 1 },
  },
  equipped:      {},
  ownedWeapons:  [],
  completedLocations: [],
  artifacts:     [],
  lastSquad:     [],
  starterPackChosen: false,
  starterPackId: '',
  // ── Этап 4 ──
  shopLastRefresh:      '',     // date string YYYY-MM-DD
  shopItems:            [],     // [{ type, id, stars?, rarity?, price, purchased }]
  shopFreeRefreshUsed:  false,  // resets daily
  questLastReset:       '',     // date string
  activeQuests:         [],     // [{ id, type, label, target, progress, claimed, reward, rewardLabel }]
  // Кристаллы ★: приоритет рецептов см. getPromoteRecipe (11+→10/0; 10+кр→9/1; 10→10/0; 9+2кр→8/2; 9+кр→9/1; 8+2кр→8/2)
  starCrystals:         { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
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
        const d = {
          ...DEFAULT_SAVE,
          ...saved,
          dust:          { ...DEFAULT_SAVE.dust, ...(saved.dust || {}) },
          starCrystals:  { ...DEFAULT_SAVE.starCrystals, ...(saved.starCrystals || {}) },
          artifacts: saved.artifacts    || [],
          lastSquad: saved.lastSquad    || [],
          shopItems: saved.shopItems    || [],
          activeQuests: saved.activeQuests || [],
          // Не показывать выбор стартовой колоды на уже существующих сейвах.
          starterPackChosen: saved.starterPackChosen ?? true,
          starterPackId: saved.starterPackId || '',
        };
        // Migrate old equipped format
        for (const [uid, val] of Object.entries(d.equipped || {})) {
          if (typeof val === 'string') {
            d.equipped[uid] = { weapon: val, accessory: null };
          }
        }
        return d;
      }
    } catch(e) {}
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }

  function _ensureCardLevels(d) {
    const uniq = [...new Set(d.unlockedCards || [])];
    uniq.forEach(id => {
      if (!d.cardLevels[id]) {
        const ally = ALLIES.find(a => a.id === id);
        if (ally) d.cardLevels[id] = { stars: ally.starRange[0], powerLevel: 1 };
      }
    });
  }

  function load() {
    data = _loadSave();
    _ensureCardLevels(data);
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
      starCrystals:        data.starCrystals || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      starterPackChosen:   !!data.starterPackChosen,
      starterPackId:       data.starterPackId || '',
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

  /** Добавляет копию карты (дубликаты не заменяются пылью). Возвращает true, если это первая копия этого id. */
  function unlockCard(id, stars) {
    const ally = ALLIES.find(a => a.id === id);
    const s = stars ?? ally?.starRange[0] ?? 1;
    const isFirstCopy = !data.unlockedCards.includes(id);
    data.unlockedCards.push(id);
    if (!data.cardLevels[id]) {
      data.cardLevels[id] = { stars: s, powerLevel: 1 };
    } else if (s > data.cardLevels[id].stars) {
      data.cardLevels[id].stars = s;
    }
    save();
    return isFirstCopy;
  }

  function getCardCopyCount(id) {
    if (!id) return 0;
    return (data.unlockedCards || []).filter(c => c === id).length;
  }

  /** Уникальные id карт в коллекции (для UI / лимита «одна копия в бою»). */
  function getUniqueUnlockedIds() {
    return [...new Set(data.unlockedCards || [])];
  }

  function _ensureStarCrystals() {
    if (!data.starCrystals) data.starCrystals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }

  function getStarCrystals() {
    _ensureStarCrystals();
    return { ...data.starCrystals };
  }

  function addStarCrystal(star, amount = 1) {
    _ensureStarCrystals();
    data.starCrystals[star] = (data.starCrystals[star] || 0) + amount;
    save();
  }

  function spendStarCrystals(star, amount) {
    _ensureStarCrystals();
    if ((data.starCrystals[star] || 0) < amount) return false;
    data.starCrystals[star] -= amount;
    save();
    return true;
  }

  /** Снять экипировку юнита в арсенал (`ownedWeapons`); запись в `equipped` удаляется. */
  function _returnUnitEquipmentToArsenal(unitId, skipSave = false) {
    _migrateEquipped();
    const raw = data.equipped[unitId];
    if (!raw) return;
    const weaponId = typeof raw === 'string' ? raw : raw.weapon || null;
    const accId = typeof raw === 'object' && raw ? raw.accessory || null : null;
    for (const wid of [weaponId, accId]) {
      if (wid && !data.ownedWeapons.includes(wid)) data.ownedWeapons.push(wid);
    }
    delete data.equipped[unitId];
    if (!skipSave) save();
  }

  /** Снять N физических копий с полки (с конца массива). skipSave — не писать сейф (для атомарных операций). */
  function removeCardCopies(id, count, skipSave = false) {
    if (!id || count <= 0) return 0;
    let removed = 0;
    for (let i = (data.unlockedCards || []).length - 1; i >= 0 && removed < count; i--) {
      if (data.unlockedCards[i] === id) {
        data.unlockedCards.splice(i, 1);
        removed++;
      }
    }
    if (!data.unlockedCards.includes(id)) {
      delete data.cardLevels[id];
      if (data.equipped[id]) delete data.equipped[id];
    }
    if (!skipSave) save();
    return removed;
  }

  /** Бейдж «кристалл»: накопилось ≥5 копий этой карты. */
  function showCrystalProgressBadge(id) {
    return getCardCopyCount(id) >= 5;
  }

  /** Кристаллизация: 5 копий → 1 кристалл; при ровно 5 копиях герой исчезает из коллекции (см. предупреждение в UI). */
  function canCrystallizeCard(id) {
    return getCardCopyCount(id) >= 5;
  }

  function crystallizeCard(id) {
    const ally = ALLIES.find(a => a.id === id);
    const lvl = data.cardLevels[id];
    if (!ally || !lvl) return { ok: false, reason: 'Нет карты' };
    if (!canCrystallizeCard(id)) {
      return { ok: false, reason: 'Нужно минимум 5 одинаковых копий' };
    }
    const tier = lvl.stars;
    removeCardCopies(id, 5, true);
    addStarCrystal(tier, 1);
    return { ok: true, tier };
  }

  /**
   * Рецепт +★ — первая подходящая строка выигрывает (см. таблицу):
   * | Ситуация                         | Рецепт   | После снятия копий (до +★ в cardLevels) |
   * |----------------------------------|----------|----------------------------------------|
   * | 11+ копий                        | 10 + 0   | остаётся (копий − 10), минимум 1       |
   * | 10 копий и ≥1 кристалла          | 9 + 1    | 1 копия                                |
   * | 10 копий без кристаллов          | 10 + 0   | 0 → push одной копии                   |
   * | ровно 9 копий и ≥2 кристалла     | 8 + 2    | 1 копия                                |
   * | ровно 9 копий и 1 кристалл       | 9 + 1    | 0 → push одной копии                   |
   * | 8 копий и ≥2 кристалла           | 8 + 2    | 0 → push одной копии                   |
   */
  function getPromoteRecipe(id) {
    const ally = ALLIES.find(a => a.id === id);
    const lvl = data.cardLevels[id];
    if (!ally || !lvl || lvl.stars >= ally.starRange[1]) return null;
    _ensureStarCrystals();
    const tier = lvl.stars;
    const c = getCardCopyCount(id);
    const cr = data.starCrystals[tier] || 0;
    if (c >= 11) return { cardCost: 10, cryCost: 0, tier };
    if (c >= 10 && cr >= 1) return { cardCost: 9, cryCost: 1, tier };
    if (c >= 10) return { cardCost: 10, cryCost: 0, tier };
    if (c === 9 && cr >= 2) return { cardCost: 8, cryCost: 2, tier };
    if (c === 9 && cr >= 1) return { cardCost: 9, cryCost: 1, tier };
    if (c >= 8 && cr >= 2) return { cardCost: 8, cryCost: 2, tier };
    return null;
  }

  /** Доступно ли повышение звёздности: те же пороги, что у getPromoteRecipe. */
  function canPromoteStar(id) {
    return getPromoteRecipe(id) != null;
  }

  function promoteStar(id) {
    const ally = ALLIES.find(a => a.id === id);
    const lvl = data.cardLevels[id];
    if (!ally || !lvl) return { ok: false, reason: 'Нет карты' };
    if (lvl.stars >= ally.starRange[1]) return { ok: false, reason: 'Уже максимальные звёзды' };
    const recipe = getPromoteRecipe(id);
    if (!recipe) {
      return { ok: false, reason: 'Нужно 11+ копий, или 10 копий (без кристаллов), или 9+1 кристалл ★, или 8+2 кристалла ★' };
    }
    const { cardCost, cryCost, tier } = recipe;
    const oldStars = lvl.stars;
    const copiesBefore = getCardCopyCount(id);

    if (cryCost && !spendStarCrystals(tier, cryCost)) {
      return { ok: false, reason: 'Недостаточно кристаллов' };
    }
    if (copiesBefore - cardCost === 0) {
      _returnUnitEquipmentToArsenal(id, true);
    }
    removeCardCopies(id, cardCost, true);
    if (!data.unlockedCards.includes(id)) {
      data.unlockedCards.push(id);
    }
    data.cardLevels[id] = { stars: oldStars + 1, powerLevel: 1 };
    save();
    return { ok: true };
  }

  function getCardLevel(id) {
    return data.cardLevels[id] || null;
  }

  function hasStarterPackChoice() {
    return !!data.starterPackChosen;
  }

  function chooseStarterPack(packId) {
    const pack = STARTER_PACKS[packId];
    if (!pack || !pack.length) return { ok: false, reason: 'Неизвестный стартовый набор' };

    data.unlockedCards = [...pack];
    data.cardLevels = {};
    pack.forEach(id => {
      data.cardLevels[id] = { stars: 1, powerLevel: 1 };
    });
    data.lastSquad = [...pack];
    data.equipped = {};
    data.starterPackChosen = true;
    data.starterPackId = packId;
    save();
    return { ok: true };
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
    return { ok: true, reachedMax: lvl.powerLevel >= maxPower };
  }

  // ── Equipment (2-slot: weapon + accessory per unit) ───────────
  function _migrateEquipped() {
    // Convert old format { unitId: 'weaponId' } → { unitId: { weapon: id, accessory: null } }
    for (const [unitId, val] of Object.entries(data.equipped)) {
      if (typeof val === 'string') {
        data.equipped[unitId] = { weapon: val, accessory: null };
      }
    }
  }

  function _getSlots(unitId) {
    if (!data.equipped[unitId] || typeof data.equipped[unitId] === 'string') {
      data.equipped[unitId] = { weapon: null, accessory: null };
    }
    return data.equipped[unitId];
  }

  function equipWeapon(unitId, weaponId) {
    const weapon = (typeof WEAPONS !== 'undefined' ? WEAPONS : []).find(w => w.id === weaponId);
    const slotType = weapon?.slot || 'weapon';

    // Remove this weapon from any other unit's slots first
    for (const [uid, slots] of Object.entries(data.equipped)) {
      if (typeof slots === 'object' && slots !== null) {
        if (slots.weapon    === weaponId) slots.weapon    = null;
        if (slots.accessory === weaponId) slots.accessory = null;
      } else if (slots === weaponId) {
        data.equipped[uid] = { weapon: null, accessory: null };
      }
    }

    const slots = _getSlots(unitId);
    slots[slotType] = weaponId;
    save();
  }

  function unequipWeapon(unitId, slotType) {
    if (!data.equipped[unitId]) return;
    const slots = _getSlots(unitId);
    if (slotType) {
      slots[slotType] = null;
    } else {
      // Legacy: unequip weapon slot
      slots.weapon = null;
    }
    save();
  }

  function getEquipped(unitId) {
    // Backward compat: return weapon slot id (used by barracks modal)
    const slots = data.equipped[unitId];
    if (!slots) return null;
    if (typeof slots === 'string') return slots;
    return slots.weapon || null;
  }

  function getEquippedSlots(unitId) {
    const slots = data.equipped[unitId];
    if (!slots) return { weapon: null, accessory: null };
    if (typeof slots === 'string') return { weapon: slots, accessory: null };
    return { weapon: slots.weapon || null, accessory: slots.accessory || null };
  }

  function getAllEquipped() {
    const result = {};
    for (const [uid, slots] of Object.entries(data.equipped)) {
      if (typeof slots === 'string') {
        result[uid] = { weapon: slots, accessory: null };
      } else {
        result[uid] = { weapon: slots?.weapon || null, accessory: slots?.accessory || null };
      }
    }
    return result;
  }

  function getWeaponOwner(weaponId) {
    for (const [unitId, slots] of Object.entries(data.equipped)) {
      if (typeof slots === 'string') {
        if (slots === weaponId) return unitId;
      } else if (slots && (slots.weapon === weaponId || slots.accessory === weaponId)) {
        return unitId;
      }
    }
    return null;
  }

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
    if (data.unlockedCards.length <= 1) return { ok: false, reason: 'Нельзя переработать последнюю карту' };
    const idx = data.unlockedCards.indexOf(id);
    if (idx < 0) return { ok: false, reason: 'Нет такой карты' };
    const lvl = data.cardLevels[id] || { stars: 1 };
    const dustStar = lvl.stars;
    data.unlockedCards.splice(idx, 1);
    if (!data.unlockedCards.includes(id)) {
      delete data.cardLevels[id];
      if (data.equipped[id]) delete data.equipped[id];
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

  // ── Полный сброс (новая игра): стартовые монеты, базовые карты, нет прогресса локаций
  function reset() {
    localStorage.removeItem(SAVE_KEY);
    data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    _ensureCardLevels(data);
    save();
  }

  return {
    get coins() { return data.coins; },
    get dust()  { return { ...data.dust }; },
    // equippedWeapons alias for backward compat with inventory/collection:
    get equipped() { return data.equipped; },

    load, save, spendCoins, addCoins, getCoins,
    addDust, spendDust, getDust,
    isUnlocked, getUnlocked, getUniqueUnlockedIds, unlockCard, getCardCopyCount, getCardLevel, upgradeCard,
    getStarCrystals, getPromoteRecipe, showCrystalProgressBadge, canCrystallizeCard, crystallizeCard, canPromoteStar, promoteStar,
    equipWeapon, unequipWeapon, getEquipped, getEquippedSlots, getAllEquipped, getWeaponOwner,
    addWeapon, hasWeapon, getOwnedWeapons,
    recycleCard,
    completeLocation, isCompleted,
    addArtifact, hasArtifact, getArtifacts,
    setLastSquad, getLastSquad,
    getShopItems, buyShopItem, refreshShop,
    getActiveQuests, incrementQuestProgress, claimQuestReward, recordKills,
    hasStarterPackChoice, chooseStarterPack,
    reset,
  };
})();

// ── App controller ────────────────────────────────────────────

const App = {

  _currentLocation: null,   // location context for current battle
  _skipBattleInit:  false,  // set true when initCustomBattle handles setup

  init() {
    if (typeof loadBalanceOverrides === 'function') loadBalanceOverrides();
    GameState.load();
    BarracksUI.init();
    if (typeof ArsenalUI !== 'undefined') ArsenalUI.init();
    VillageUI.init();
    VillageMapUI.init();
    WorldMap.init();
    this.showScreen('villagemap');
    document.getElementById('hud-resources').classList.remove('hidden');
    this.updateHUD();
    this.promptStarterPackChoiceIfNeeded();
  },

  // ── HUD ────────────────────────────────────────────────────────

  updateHUD() {
    const coins = GameState.coins || 0;
    const dust  = GameState.getDust ? GameState.getDust() : {};
    const coinsEl = document.getElementById('coins-val');
    if (coinsEl) coinsEl.textContent = coins;
    for (let s = 1; s <= 5; s++) {
      const el = document.getElementById(`hud-d${s}`);
      if (!el) continue;
      const b = el.querySelector('b');
      if (b) b.textContent = dust[s] ?? 0;
    }
  },

  /** Кнопка «Назад в деревню»: иконка + подсказка снизу при наведении. */
  backToVillageButtonHTML(extraClasses = '', onClick = '') {
    const cls = extraClasses ? ` ${extraClasses}` : '';
    const handler = onClick || `App.showScreen('villagemap')`;
    return `<button type="button" class="btn-back-village${cls}" onclick="${handler}" aria-label="Назад в деревню"><img src="assets/icons/return_to_the_village.png" alt="" draggable="false"><span class="btn-back-village-hint">назад в деревню</span></button>`;
  },

  // ── Main menu ──────────────────────────────────────────────────

  toggleMainMenu() {
    const overlay = document.getElementById('main-menu-overlay');
    if (overlay) overlay.classList.toggle('hidden');
  },

  resumeGame() {
    const overlay = document.getElementById('main-menu-overlay');
    if (overlay) overlay.classList.add('hidden');
  },

  newGame() {
    const overlay = document.getElementById('main-menu-overlay');
    if (overlay) overlay.classList.add('hidden');
    GameState.reset();
    this._currentLocation = null;
    if (typeof Battle !== 'undefined' && Battle.discardState) Battle.discardState();
    this.updateHUD();
    this.showScreen('villagemap');
    if (typeof WorldMap !== 'undefined' && WorldMap.render) WorldMap.render();
    if (typeof BarracksUI !== 'undefined' && BarracksUI.render) BarracksUI.render();
    this.promptStarterPackChoiceIfNeeded();
  },

  saveGame() {
    GameState.save();
  },

  loadGame() {
    GameState.load();
    this.updateHUD();
    const overlay = document.getElementById('main-menu-overlay');
    if (overlay) overlay.classList.add('hidden');
    this.showScreen('villagemap');
    this.promptStarterPackChoiceIfNeeded();
  },

  promptStarterPackChoiceIfNeeded() {
    if (!GameState.hasStarterPackChoice || GameState.hasStarterPackChoice()) return;
    this.openModal(`
      <div class="starter-pack-modal">
        <h3>Выберите стартовый набор</h3>
        <p>Это выбор стартовой сложности. Набор выдаётся один раз в начале игры.</p>
        <div style="display:grid;gap:10px;margin-top:12px;">
          <button class="home-btn primary" onclick="App.pickStarterPack('easy')">
            <span class="hb-text"><strong>Танк + ДПС + Хил</strong><small>Проще и стабильнее</small></span>
          </button>
          <button class="home-btn" onclick="App.pickStarterPack('hard')">
            <span class="hb-text"><strong>Танк + Стрелок + Маг</strong><small>Сложнее, выше риск потерь</small></span>
          </button>
        </div>
      </div>
    `);
  },

  pickStarterPack(packId) {
    const result = GameState.chooseStarterPack ? GameState.chooseStarterPack(packId) : { ok: false };
    if (!result.ok) return;
    this.forceCloseModal();
    this.updateHUD();
    if (typeof BarracksUI !== 'undefined' && BarracksUI.render) BarracksUI.render();
  },

  openSettings() {
    alert('Настройки — скоро!');
  },

  showCredits() {
    alert('Fantasy Card Quest · v0.1\n\nТактическая карточная RPG');
  },

  goHome() {
    const overlay = document.getElementById('main-menu-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.getElementById('hud-resources').classList.add('hidden');
    this.showScreen('home');
  },

  startTestBattle() {
    this.showScreen('battle');
  },

  // ── Screen routing ─────────────────────────────────────────────

  showScreen(screenId) {
    // Building tabs are rendered inside screen-village
    const BUILDING_TABS = ['portal', 'temple', 'shop', 'council'];
    const isBuildingTab = BUILDING_TABS.includes(screenId);
    const domId = isBuildingTab ? 'village' : screenId;

    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`screen-${domId}`);
    if (target) target.classList.remove('hidden');

    this.updateHUD();

    // Show/hide HUD based on screen
    const hud = document.getElementById('hud-resources');
    if (hud) {
      if (screenId === 'home') hud.classList.add('hidden');
      else hud.classList.remove('hidden');
    }

    // NPC: cleanup static-screen NPCs on every navigation
    if (typeof NPCSystem !== 'undefined') {
      NPCSystem.cleanup('barracks');
      NPCSystem.cleanup('arsenal');
    }

    switch (screenId) {
      case 'battle':
        if (!this._skipBattleInit) this.initBattle();
        this._skipBattleInit = false;
        break;
      case 'barracks':
        BarracksUI.render();
        if (typeof NPCSystem !== 'undefined') NPCSystem.init('barracks');
        break;
      case 'arsenal':
        ArsenalUI.show();
        if (typeof NPCSystem !== 'undefined') NPCSystem.init('arsenal');
        break;
      case 'villagemap':   VillageMapUI.render();     break;
      case 'worldmap':     WorldMap.render();         break;
      case 'squad_select': SquadSelect.render();      break;
      case 'village':      VillageUI.render();        break;
      case 'portal':
      case 'temple':
      case 'shop':
      case 'council':
        VillageUI.switchTab(screenId);
        break;
      case 'exchange':
        ExchangeUI.show();
        break;
      case 'library':
        LibraryUI.render();
        if (typeof NPCSystem !== 'undefined') NPCSystem.init('library');
        break;
    }
  },

  updateHomeStats() {
    const el = id => document.getElementById(id);
    if (el('stat-coins'))      el('stat-coins').textContent     = GameState.coins;
    if (el('stat-unlocked'))   el('stat-unlocked').textContent  = GameState.getUniqueUnlockedIds().length;
    if (el('stat-locations'))  el('stat-locations').textContent = GameState.isCompleted
      ? LOCATIONS.filter(l => GameState.isCompleted(l.id)).length
      : 0;
  },

  // ── Battle ─────────────────────────────────────────────────────

  _startBattle(allies, enemies) {
    const resultEl = document.getElementById('battle-result');
    if (resultEl) resultEl.classList.add('hidden');
    document.getElementById('btn-copy-battle-log')?.classList.add('hidden');

    const playerPower = typeof calculateGroupPower === 'function' ? calculateGroupPower(allies) : 0;
    const enemyPower = typeof calculateGroupPower === 'function' ? calculateGroupPower(enemies) : 0;
    const encounterId = window.__LAST_ENCOUNTER_BASE_ID__ ?? (this._currentLocation ? '—' : 'test');
    window.__LAST_BATTLE_POWER_SNAPSHOT__ = { playerPower, enemyPower, encounterId };
    if (typeof BattlePowerInfo !== 'undefined' && BattlePowerInfo.updateStrip) {
      BattlePowerInfo.updateStrip(playerPower, enemyPower, encounterId);
    }

    BattleLog.init();
    if (this._currentLocation) {
      BattleLog.addEntry({
        type: 'system',
        text: `🗺️ Зона ${this._currentLocation.zone} · ${this._currentLocation.name}`,
      });
    } else {
      BattleLog.addEntry({ type: 'system', text: '🗺️ Тренировочный бой' });
    }
    Battle.init(allies, enemies, {
      onLogEntry:      e  => BattleLog.addEntry(e),
      onRender:        st => BattlefieldUI.render(st),
      onEnd:           (result, st) => this.onBattleEnd(result, st),
      onEnableActions: u  => BattlefieldUI.updateCurrentUnitInfo(u),
      onRequestTarget: (type, payload) => BattlefieldUI.requestTarget(type, payload),
    });
  },

  initBattle() {
    this._currentLocation = null;
    window.__LAST_ENCOUNTER_BASE_ID__ = 'test';
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

    const rewardPayload = {
      coinsEarned, coinsPenalty, droppedWeapon, droppedScroll, droppedArtifact,
    };
    this.appendBattleOutcomeToLog(result, battleState, rewardPayload);
    this.showBattleRewards(result, battleState, rewardPayload);
  },

  /** Строки силы отрядов и награды в конец лога боя. */
  appendBattleOutcomeToLog(result, battleState, rewards) {
    if (typeof BattleLog === 'undefined' || !BattleLog.addEntry) return;

    const snap = window.__LAST_BATTLE_POWER_SNAPSHOT__ || {};
    let pAlly = snap.playerPower;
    let pEnemy = snap.enemyPower;
    if ((pAlly == null || pEnemy == null) && typeof calculateGroupPower === 'function') {
      pAlly = calculateGroupPower(battleState.allies || []);
      pEnemy = calculateGroupPower(battleState.enemies || []);
    }

    const enc = snap.encounterId && snap.encounterId !== '—' ? ` · встреча: ${snap.encounterId}` : '';

    BattleLog.addEntry({ type: 'round', text: '── Итог боя ──' });
    BattleLog.addEntry({
      type: 'system',
      text: `Сила отрядов: игрок ${pAlly ?? '—'} vs враг ${pEnemy ?? '—'}${enc}`,
    });

    if (result === 'victory') {
      const parts = [`Награда: +${rewards.coinsEarned} монет`];
      if (rewards.droppedWeapon)
        parts.push(`оружие: ${rewards.droppedWeapon.name}`);
      if (rewards.droppedScroll) {
        const scrollBonus =
          rewards.droppedScroll === 'gold' ? 2000
            : rewards.droppedScroll === 'silver' ? 500 : 100;
        parts.push(`свиток ${rewards.droppedScroll} (+${scrollBonus} монет)`);
      }
      if (rewards.droppedArtifact) {
        parts.push(`${rewards.droppedArtifact.icon} ${rewards.droppedArtifact.name}`);
      }
      BattleLog.addEntry({ type: 'system', text: parts.join(' · ') });
    } else {
      const pen = rewards.coinsPenalty || 0;
      BattleLog.addEntry({
        type: 'system',
        text: pen > 0 ? `После поражения: −${pen} монет` : 'Поражение: штраф по монетам не применён',
      });
    }
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

    if (typeof BattlePowerInfo !== 'undefined' && BattlePowerInfo.updateResultBlock) {
      BattlePowerInfo.updateResultBlock();
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
        ${this.backToVillageButtonHTML('btn-back-village--inline')}
      `;
    }

    overlay.classList.remove('hidden');
    document.getElementById('btn-copy-battle-log')?.classList.remove('hidden');
    this.updateHomeStats();
  },

  async copyBattleLog() {
    const btn = document.getElementById('btn-copy-battle-log');
    const text = (typeof BattleLog !== 'undefined' && BattleLog.getPlainText)
      ? BattleLog.getPlainText()
      : '';
    if (!text) {
      if (btn) btn.textContent = '📜 Лог пуст';
      setTimeout(() => { if (btn) btn.textContent = '📜 Лог боя'; }, 1300);
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      if (btn) btn.textContent = '✅ Скопировано';
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'readonly');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
      if (btn) btn.textContent = '✅ Скопировано';
    }

    setTimeout(() => { if (btn) btn.textContent = '📜 Лог боя'; }, 1400);
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
