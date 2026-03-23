// ================================================================
// ARSENAL SCREEN — Weapon grid with 2-slot equip system
// Uses WEAPONS, ALLIES, RARITIES, canEquip from cards_and_weapons.js
// Uses GameState.equipWeapon / unequipWeapon / getWeaponOwner
// ================================================================

const ArsenalUI = (() => {

  const _filters = {
    rarity: 'all',  // all, common, rare, epic, legendary
    slot:   'all',  // all, weapon, accessory
    status: 'all',  // all, equipped, free
  };

  // ── Init / Show ────────────────────────────────────────────────

  function init() { /* nothing at boot */ }

  function show() {
    // Reset filters on entry? Let's keep them all 'all'
    _filters.rarity = 'all';
    _filters.slot   = 'all';
    _filters.status = 'all';

    _renderFilters();
    _render();

    const noWeapons = (GameState.getOwnedWeapons().length === 0);
    if (typeof NPCSystem !== 'undefined') {
      NPCSystem.trigger('arsenal', noWeapons ? 'no_weapons' : 'idle');
    }
  }

  // ── Filters ────────────────────────────────────────────────────

  function _renderFilters() {
    const bar = document.getElementById('ar-filters');
    if (!bar) return;

    bar.querySelectorAll('.af').forEach(btn => {
      const f = btn.dataset.f;
      let active = false;

      if (['all', 'common', 'rare', 'epic', 'legendary'].includes(f)) {
        active = (_filters.rarity === f);
      } else if (['weapon', 'accessory'].includes(f)) {
        active = (_filters.slot === f);
      } else if (['equipped', 'free'].includes(f)) {
        active = (_filters.status === f);
      }

      btn.classList.toggle('active', active);
    });

    // Attach listeners
    bar.querySelectorAll('.af').forEach(btn => {
      btn.onclick = () => setFilter(btn.dataset.f);
    });
  }

  function setFilter(f) {
    if (['all', 'common', 'rare', 'epic', 'legendary'].includes(f)) {
      _filters.rarity = f;
    } else if (['weapon', 'accessory'].includes(f)) {
      // Toggle if already selected?
      _filters.slot = (_filters.slot === f) ? 'all' : f;
    } else if (['equipped', 'free'].includes(f)) {
      // Toggle if already selected?
      _filters.status = (_filters.status === f) ? 'all' : f;
    }

    _renderFilters();
    _render();
  }

  function _filteredWeapons() {
    const owned = new Set(GameState.getOwnedWeapons());
    return WEAPONS.filter(w => {
      if (!owned.has(w.id)) return false;

      // Filter by rarity
      if (_filters.rarity !== 'all' && w.rarity !== _filters.rarity) return false;

      // Filter by slot
      if (_filters.slot === 'weapon' && w.slot !== 'weapon') return false;
      if (_filters.slot === 'accessory' && w.slot !== 'accessory') return false;

      // Filter by status
      const isEquipped = GameState.getWeaponOwner(w.id) !== null;
      if (_filters.status === 'equipped' && !isEquipped) return false;
      if (_filters.status === 'free' && isEquipped) return false;

      return true;
    });
  }

  // ── Render grid ────────────────────────────────────────────────

  function _render() {
    const grid    = document.getElementById('weapons-grid');
    const countEl = document.getElementById('ar-count');
    if (!grid) return;

    const weapons = _filteredWeapons();
    if (countEl) countEl.textContent = `${weapons.length} оружие`;

    grid.innerHTML = weapons.map(w => _buildCard(w)).join('');
  }

  function _buildCard(weapon) {
    const ownerId = GameState.getWeaponOwner(weapon.id);
    const owner   = ownerId ? ALLIES.find(a => a.id === ownerId) : null;
    const isEquipped = !!owner;

    const slotLabel = weapon.slot === 'weapon' ? '⚔️ Оружие' : '🛡 Аксессуар';

    const rarityClass = {
      common: 'wc-common', rare: 'wc-rare',
      epic: 'wc-epic', legendary: 'wc-legendary',
    }[weapon.rarity] || 'wc-common';

    const rarityLabel = {
      common: 'Обычное', rare: 'Редкое',
      epic: 'Эпическое', legendary: 'Легендарное',
    }[weapon.rarity] || weapon.rarity;

    const bonusText = Object.entries(weapon.bonuses || {})
      .map(([k, v]) => `+${v} ${_bonusLabel(k)}`).join(' · ');

    return `
      <div class="wc ${rarityClass}${isEquipped ? ' is-equipped' : ''}"
           data-weapon-id="${weapon.id}"
           onclick="ArsenalUI.onWeaponClick('${weapon.id}')">
        <div class="wc-head">
          <div class="wc-head-top">
            ${isEquipped ? '<span class="wc-check">✓</span>' : '<span></span>'}
            <span class="wc-rarity-badge">${rarityLabel}</span>
          </div>
          <div class="wc-name">${weapon.name}</div>
        </div>
        <div class="wc-art">${weapon.icon || '⚔️'}</div>
        <div class="wc-bonus-zone">
          <div class="wc-bonus">${bonusText || '—'}</div>
        </div>
        <div class="wc-desc">${weapon.special?.desc || weapon.lore || ''}</div>
        <div class="wc-foot">
          <div class="wc-owner">
            ${isEquipped
              ? `На: <b>${owner.name}</b>`
              : '<span style="color:rgba(255,255,255,.22)">Свободно</span>'}
          </div>
          <span class="wc-slot-type">${slotLabel}</span>
        </div>
      </div>`;
  }

  // ── Click → modal ──────────────────────────────────────────────

  function onWeaponClick(weaponId) {
    const weapon = WEAPONS.find(w => w.id === weaponId);
    if (!weapon) return;

    const currentOwnerId = GameState.getWeaponOwner(weaponId);

    const compatible = ALLIES.filter(a =>
      GameState.isUnlocked(a.id) && canEquip(weapon, a.class)
    );

    _showModal(weapon, compatible, currentOwnerId);

    if (typeof NPCSystem !== 'undefined') {
      NPCSystem.trigger('arsenal',
        weapon.rarity === 'legendary' ? 'legendary_equipped' : 'weapon_equipped');
    }
  }

  function _showModal(weapon, compatible, currentOwnerId) {
    const rarityLabel = {
      common: 'Обычное', rare: 'Редкое',
      epic: 'Эпическое', legendary: 'Легендарное',
    }[weapon.rarity] || weapon.rarity;

    const bonusText = Object.entries(weapon.bonuses || {})
      .map(([k, v]) => `+${v} ${_bonusLabel(k)}`).join(' · ');

    const alliesHtml = compatible.length
      ? compatible.map(ally => {
          const slots = GameState.getEquippedSlots(ally.id);
          const slotType = weapon.slot || 'weapon';
          const isEquippedHere = slots[slotType] === weapon.id;
          const currentInSlot = slots[slotType]
            ? WEAPONS.find(w => w.id === slots[slotType]) : null;

          return `
            <div class="arm-ally-row${isEquippedHere ? ' arm-equipped' : ''}">
              <div class="arm-ally-icon">${ally.icon || '⚔️'}</div>
              <div class="arm-ally-info">
                <div class="arm-ally-name">${ally.name}</div>
                ${currentInSlot && !isEquippedHere
                  ? `<div class="arm-ally-cur">Сейчас: ${currentInSlot.icon} ${currentInSlot.name}</div>`
                  : ''}
              </div>
              <button class="arm-equip-btn${isEquippedHere ? ' armed' : ''}"
                      onclick="ArsenalUI.doEquip('${ally.id}', '${weapon.id}', ${isEquippedHere})">
                ${isEquippedHere ? '✓ Снять' : 'Экипировать'}
              </button>
            </div>`;
        }).join('')
      : '<div class="arm-no-compat">Нет совместимых союзников</div>';

    const content = `
      <div class="arm-header">
        <div class="arm-icon">${weapon.icon || '⚔️'}</div>
        <div class="arm-info">
          <div class="arm-name">${weapon.name}</div>
          <div class="arm-meta">
            <span class="arm-rarity r-${weapon.rarity}">${rarityLabel}</span>
            <span class="arm-slot">${weapon.slot === 'weapon' ? '⚔️ Оружие' : '🛡 Аксессуар'}</span>
          </div>
          <div class="arm-bonus">${bonusText}</div>
          ${weapon.special ? `<div class="arm-special">✦ ${weapon.special.desc}</div>` : ''}
        </div>
      </div>
      <div class="arm-section-title">Экипировать на:</div>
      <div class="arm-allies-list">${alliesHtml}</div>`;

    const modal = document.getElementById('ar-modal');
    const contentEl = document.getElementById('ar-modal-content');
    if (modal && contentEl) {
      contentEl.innerHTML = content;
      modal.classList.remove('hidden');
    }
  }

  function doEquip(unitId, weaponId, isEquippedHere) {
    if (isEquippedHere) {
      const weapon = WEAPONS.find(w => w.id === weaponId);
      GameState.unequipWeapon(unitId, weapon?.slot || 'weapon');
      if (typeof NPCSystem !== 'undefined') NPCSystem.trigger('arsenal', 'weapon_unequipped');
    } else {
      GameState.equipWeapon(unitId, weaponId);
      const weapon = WEAPONS.find(w => w.id === weaponId);
      if (typeof NPCSystem !== 'undefined') {
        NPCSystem.trigger('arsenal',
          weapon?.rarity === 'legendary' ? 'legendary_equipped' : 'weapon_equipped');
      }
    }
    closeModal();
    _render();
  }

  function closeModal() {
    document.getElementById('ar-modal')?.classList.add('hidden');
  }

  // ── Helpers ────────────────────────────────────────────────────

  function _bonusLabel(key) {
    const map = {
      meleeAtk: 'Ближн.атк', meleeDef: 'Ближн.защ',
      rangeAtk: 'Дальн.атк', rangeDef: 'Дальн.защ',
      magic: 'Магия', magicDef: 'Маг.защ',
      hp: 'HP', mana: 'Мана', initiative: 'Иниц.',
    };
    return map[key] || key;
  }

  return { init, show, setFilter, onWeaponClick, doEquip, closeModal };
})();
