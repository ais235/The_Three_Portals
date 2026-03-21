// ================================================================
// INVENTORY SCREEN — Weapon inventory with equip system
// Uses WEAPONS, WEAPON_TYPES, RARITIES, ALLIES from cards_and_weapons.js
// ================================================================

const InventoryUI = (() => {

  let currentFilters = { type: '', rarity: '' };
  let selectedWeapon = null;

  // ── Init ───────────────────────────────────────────────────────

  function init() {
    populateFilters();
    render();
  }

  function populateFilters() {
    // Weapon type filter
    const typeSelect = document.getElementById('filter-wtype');
    if (typeSelect && WEAPON_TYPES) {
      typeSelect.innerHTML = '<option value="">🗡️ Все типы</option>';
      Object.entries(WEAPON_TYPES).forEach(([key, wt]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = wt.label;
        typeSelect.appendChild(opt);
      });
    }

    // Rarity filter
    const raritySelect = document.getElementById('filter-wrarity');
    if (raritySelect && RARITIES) {
      raritySelect.innerHTML = '<option value="">💎 Все редкости</option>';
      Object.entries(RARITIES).forEach(([key, r]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = r.label;
        raritySelect.appendChild(opt);
      });
    }
  }

  // ── Filters ────────────────────────────────────────────────────

  function applyFilters() {
    currentFilters.type   = document.getElementById('filter-wtype')?.value   || '';
    currentFilters.rarity = document.getElementById('filter-wrarity')?.value || '';
    render();
  }

  function filterWeapons() {
    return WEAPONS.filter(w => {
      if (currentFilters.type   && w.type   !== currentFilters.type)   return false;
      if (currentFilters.rarity && w.rarity !== currentFilters.rarity) return false;
      return true;
    });
  }

  // ── Render weapon list ─────────────────────────────────────────

  function render() {
    const list    = document.getElementById('weapon-list');
    const countEl = document.getElementById('weapon-count');
    if (!list) return;

    const filtered = filterWeapons();
    if (countEl) countEl.textContent = filtered.length;

    list.innerHTML = '';
    filtered.forEach(w => list.appendChild(buildWeaponItem(w)));

    // Re-select if previously selected weapon still visible
    if (selectedWeapon) {
      const stillVisible = filtered.find(w => w.id === selectedWeapon.id);
      if (stillVisible) selectWeapon(stillVisible, false);
      else resetPanel();
    }
  }

  function buildWeaponItem(weapon) {
    const rarity = RARITIES[weapon.rarity] || { label: weapon.rarity, color: '#888' };
    const isSelected = selectedWeapon?.id === weapon.id;

    // Find who has this equipped
    const equipOwner = findEquipOwner(weapon.id);

    const div = document.createElement('div');
    div.className = `weapon-item${isSelected ? ' selected' : ''}`;
    div.dataset.id = weapon.id;

    div.innerHTML = `
      <div class="wi-icon">${weapon.icon || '⚔️'}</div>
      <div class="wi-body">
        <div class="wi-top">
          <div class="wi-name">${weapon.name}</div>
          <span class="wi-rarity r-${weapon.rarity}">${rarity.label}</span>
        </div>
        <div class="wi-bonuses">${formatBonuses(weapon.bonuses)}</div>
        ${weapon.special ? `<div class="wi-special">✦ ${weapon.special.desc}</div>` : ''}
        <div class="wi-lore">${weapon.lore || ''}</div>
      </div>
      ${equipOwner ? `
        <div class="wi-equip-badge">
          ${equipOwner.icon || '⚔️'} ${equipOwner.name}
        </div>
      ` : ''}
    `;

    div.addEventListener('click', () => selectWeapon(weapon, true));
    return div;
  }

  // ── Select weapon → show equip panel ──────────────────────────

  function selectWeapon(weapon, scrollIntoView = false) {
    selectedWeapon = weapon;

    // Update selection highlight
    document.querySelectorAll('.weapon-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.id === weapon.id);
    });

    // Update panel header
    const panelIcon  = document.getElementById('ep-weapon-icon');
    const panelTitle = document.getElementById('ep-weapon-name');
    if (panelIcon)  panelIcon.textContent  = weapon.icon || '⚔️';
    if (panelTitle) panelTitle.textContent = weapon.name;

    // Update details section
    const detailsEl = document.getElementById('ep-weapon-details');
    if (detailsEl) {
      const rarity = RARITIES[weapon.rarity] || { label: weapon.rarity, color: '#888' };
      const wtype  = WEAPON_TYPES[weapon.type] || { label: weapon.type };
      detailsEl.innerHTML = `
        <div class="ep-detail-row">
          <span class="ep-detail-label">Тип:</span>
          <span class="ep-detail-value">${wtype.label}</span>
        </div>
        <div class="ep-detail-row">
          <span class="ep-detail-label">Редкость:</span>
          <span class="ep-detail-value" style="color:${rarity.color}">${rarity.label}</span>
        </div>
        <div class="ep-detail-row">
          <span class="ep-detail-label">Бонусы:</span>
          <span class="ep-bonuses">${formatBonuses(weapon.bonuses)}</span>
        </div>
        ${weapon.special ? `
          <div class="ep-special-desc">✦ ${weapon.special.desc}</div>
        ` : ''}
        ${weapon.lore ? `<div class="ep-lore">"${weapon.lore}"</div>` : ''}
      `;
    }

    // Build compatible allies list
    renderCompatibleAllies(weapon);

    const section = document.getElementById('ep-allies-section');
    if (section) section.classList.remove('hidden');

    if (scrollIntoView) {
      const panel = document.getElementById('equip-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderCompatibleAllies(weapon) {
    const list = document.getElementById('ep-allies-list');
    if (!list) return;

    // Find all compatible allies
    const compatible = ALLIES.filter(ally => canEquip(weapon, ally.class));

    if (!compatible.length) {
      list.innerHTML = '<div style="color:#666;font-style:italic;font-size:0.82rem;">Нет совместимых союзников</div>';
      return;
    }

    list.innerHTML = '';
    compatible.forEach(ally => {
      list.appendChild(buildAllyEquipRow(ally, weapon));
    });
  }

  function buildAllyEquipRow(ally, weapon) {
    const equippedWeaponId = GameState.getEquipped(ally.id);
    const isEquippedHere   = equippedWeaponId === weapon.id;
    const curWeapon = equippedWeaponId ? WEAPONS.find(w => w.id === equippedWeaponId) : null;
    const cls = CLASSES[ally.class] || { label: ally.class };

    const div = document.createElement('div');
    div.className = `ep-ally-item${isEquippedHere ? ' equipped-here' : ''}`;

    div.innerHTML = `
      <div class="ep-ally-icon">${ally.icon || '⚔️'}</div>
      <div class="ep-ally-info">
        <div class="ep-ally-name">${ally.name}</div>
        <div class="ep-ally-class">${cls.label}</div>
        ${curWeapon && !isEquippedHere ? `<div class="ep-ally-cur-weapon">Сейчас: ${curWeapon.name}</div>` : ''}
      </div>
      <button class="ep-ally-equip-btn${isEquippedHere ? ' equipped' : ''}">
        ${isEquippedHere ? '✓ Экипировано' : 'Экипировать'}
      </button>
    `;

    const btn = div.querySelector('.ep-ally-equip-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isEquippedHere) {
        unequipWeapon(ally.id);
      } else {
        equipWeaponToAlly(weapon.id, ally.id);
      }
    });

    return div;
  }

  // ── Equip / unequip logic ──────────────────────────────────────

  function equipWeaponToAlly(weaponId, allyId) {
    GameState.equipWeapon(allyId, weaponId);
    refreshAll();
  }

  function unequipWeapon(allyId) {
    GameState.unequipWeapon(allyId);
    refreshAll();
  }

  function refreshAll() {
    // Re-render weapon list and ally panel
    render();
    if (selectedWeapon) renderCompatibleAllies(selectedWeapon);
    // Update collection screen if visible
    if (CollectionUI && CollectionUI.refresh) CollectionUI.refresh();
  }

  function resetPanel() {
    selectedWeapon = null;
    const panelIcon  = document.getElementById('ep-weapon-icon');
    const panelTitle = document.getElementById('ep-weapon-name');
    if (panelIcon)  panelIcon.textContent  = '⚔️';
    if (panelTitle) panelTitle.textContent = 'Выберите оружие';

    const details = document.getElementById('ep-weapon-details');
    if (details) details.innerHTML = '<p class="ep-hint">Нажмите на оружие слева чтобы увидеть детали и экипировать его союзнику.</p>';

    const section = document.getElementById('ep-allies-section');
    if (section) section.classList.add('hidden');
  }

  // ── Helpers ────────────────────────────────────────────────────

  function findEquipOwner(weaponId) {
    const equipped = GameState.getAllEquipped();
    for (const [allyId, wid] of Object.entries(equipped)) {
      if (wid === weaponId) {
        return ALLIES.find(a => a.id === allyId) || null;
      }
    }
    return null;
  }

  function formatBonuses(bonuses) {
    if (!bonuses) return '—';
    return Object.entries(bonuses)
      .map(([k, v]) => `+${v} ${getBonusLabel(k)}`)
      .join(', ');
  }

  function getBonusLabel(key) {
    const map = {
      meleeAtk:'Ближн.атк', meleeDef:'Ближн.защ',
      rangeAtk:'Дальн.атк', rangeDef:'Дальн.защ',
      magic:'Магия', magicDef:'Маг.защ',
      hp:'HP', mana:'Мана', initiative:'Иниц.',
    };
    return map[key] || key;
  }

  return { init, applyFilters, render };
})();
