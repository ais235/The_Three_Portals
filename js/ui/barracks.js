// ================================================================
// BARRACKS SCREEN — Card collection with race/class filters
//                     + locked cards + power level upgrade (Этап 2)
// ================================================================

const BarracksUI = (() => {

  let currentFilters = { race: '', class: '', stars: '', locked: 'unlocked' };

  // ── Init ───────────────────────────────────────────────────────

  function init() {
    populateFilters();
    render();
  }

  function populateFilters() {
    const raceSelect = document.getElementById('filter-race');
    if (raceSelect && RACES) {
      raceSelect.innerHTML = '<option value="">🌍 Все расы</option>';
      Object.entries(RACES).forEach(([key, r]) => {
        const o = document.createElement('option');
        o.value = key; o.textContent = r.label;
        raceSelect.appendChild(o);
      });
    }

    const classSelect = document.getElementById('filter-class');
    if (classSelect && CLASSES) {
      classSelect.innerHTML = '<option value="">⚔️ Все классы</option>';
      Object.entries(CLASSES).forEach(([key, c]) => {
        const o = document.createElement('option');
        o.value = key; o.textContent = c.label;
        classSelect.appendChild(o);
      });
    }

    const lockedSelect = document.getElementById('filter-locked');
    if (lockedSelect) {
      lockedSelect.innerHTML = `
        <option value="all">🔓 Все карты</option>
        <option value="unlocked">✅ Открытые</option>
        <option value="locked">🔒 Закрытые</option>
      `;
      lockedSelect.value = 'unlocked';
    }
  }

  // ── Filters ────────────────────────────────────────────────────

  function applyFilters() {
    currentFilters.race   = document.getElementById('filter-race')?.value   || '';
    currentFilters.class  = document.getElementById('filter-class')?.value  || '';
    currentFilters.stars  = document.getElementById('filter-stars')?.value  || '';
    currentFilters.locked = document.getElementById('filter-locked')?.value || 'all';
    render();
  }

  function filterAllies() {
    return ALLIES.filter(ally => {
      if (currentFilters.race  && ally.race  !== currentFilters.race)  return false;
      if (currentFilters.class && ally.class !== currentFilters.class) return false;
      if (currentFilters.stars) {
        const s = parseInt(currentFilters.stars);
        if (ally.starRange[0] > s || ally.starRange[1] < s) return false;
      }
      const isUnlocked = GameState.isUnlocked(ally.id);
      if (currentFilters.locked === 'unlocked' && !isUnlocked) return false;
      if (currentFilters.locked === 'locked'   && isUnlocked)  return false;
      return true;
    });
  }

  // ── Render ─────────────────────────────────────────────────────

  function render() {
    const grid    = document.getElementById('barracks-grid');
    const countEl = document.getElementById('barracks-card-count');
    if (!grid) return;

    const filtered = filterAllies();
    if (countEl) countEl.textContent = filtered.length;

    grid.innerHTML = filtered.map(ally => {
      const isOwned = GameState.isUnlocked(ally.id);
      return UnitCard.buildMiniCard(ally, { showLocked: !isOwned });
    }).join('');

    UnitCard.attachCardClicks(grid);
  }

  // ── Card modals ────────────────────────────────────────────────

  function showLockedCard(ally) {
    // unitCard.js умеет показывать залоченные карты через showCardDetail
    if (typeof UnitCard !== 'undefined') {
      UnitCard.showCardDetail(ally.id);
    } else {
      App.openModal(`<div style="text-align:center;padding:20px;color:#666;">
        <p>${ally.name} 🔒</p>
        <p>Откройте свитки в <strong style="color:#cc8800">Портальном Круге</strong> деревни.</p>
      </div>`);
    }
  }

  function showCardDetail(ally) {
    if (typeof UnitCard !== 'undefined') {
      UnitCard.showCardDetail(ally.id);
    } else {
      App.openModal(buildDetailHTML(ally));
    }
  }

  function buildDetailHTML(ally) {
    const race       = RACES[ally.race] || { label: ally.race, color:'#888', bg:'#222' };
    const cls        = CLASSES[ally.class] || { label: ally.class };
    const lvl        = GameState.getCardLevel(ally.id);
    const stars      = lvl ? lvl.stars : ally.starRange[0];
    const powerLevel = lvl ? lvl.powerLevel : 1;
    const equippedSlots = GameState.getEquippedSlots ? GameState.getEquippedSlots(ally.id) : { weapon: GameState.getEquipped(ally.id), accessory: null };
    const weapon     = equippedSlots.weapon    ? WEAPONS.find(w => w.id === equippedSlots.weapon)    : null;
    const accessory  = equippedSlots.accessory ? WEAPONS.find(w => w.id === equippedSlots.accessory) : null;
    const dust       = GameState.getDust();
    const dustAvail  = dust[stars] || 0;
    const maxPower   = stars * 10;
    const canUpgrade = powerLevel < maxPower && dustAvail >= 1;

    // Compute stats at current level
    const b = ally.base;
    const stats = {
      HP:           calcStat(b.hp       || 0, stars, powerLevel),
      'Ближн. атк': calcStat(b.meleeAtk || 0, stars, powerLevel) || '—',
      'Ближн. защ': calcStat(b.meleeDef || 0, stars, powerLevel) || '—',
      'Дальн. атк': calcStat(b.rangeAtk || 0, stars, powerLevel) || '—',
      'Дальн. защ': calcStat(b.rangeDef || 0, stars, powerLevel) || '—',
      Магия:        calcStat(b.magic    || 0, stars, powerLevel) || '—',
      'Маг. защ':   calcStat(b.magicDef || 0, stars, powerLevel) || '—',
      Мана:         b.mana ? calcStat(b.mana, stars, powerLevel) : '—',
      Инициатива:   calcInitiative(b.initiative, stars, powerLevel),
    };

    // Next level stats for comparison
    const nextPL = Math.min(powerLevel + 1, maxPower);
    const nextStats = {
      HP:    calcStat(b.hp || 0, stars, nextPL),
      Магия: calcStat(b.magic || 0, stars, nextPL) || null,
    };

    const statsGrid = Object.entries(stats).map(([k, v]) => `
      <div class="modal-stat-item">
        <div class="modal-stat-label">${k}</div>
        <div class="modal-stat-value">${v}</div>
      </div>
    `).join('');

    const upgradeSection = `
      <div class="modal-section">
        <div class="modal-section-title">Уровень силы</div>
        <div class="upgrade-box">
          <div class="upgrade-level-row">
            <div class="upgrade-level-info">
              <span class="upgrade-stars">${'★'.repeat(stars)}</span>
              <span class="upgrade-pl">Уровень <strong>${powerLevel}</strong> / ${maxPower}</span>
            </div>
            <div class="upgrade-bar-wrap">
              <div class="upgrade-bar-fill" style="width:${(powerLevel/maxPower*100).toFixed(0)}%"></div>
            </div>
          </div>
          ${powerLevel < maxPower ? `
            <div class="upgrade-cost-row">
              <span class="upgrade-preview">HP: ${stats.HP} → <strong style="color:#4ade80">${nextStats.HP}</strong></span>
              <span class="upgrade-cost">
                Стоимость: <span class="dust-chip star-${stars} small">1 пыль ★${stars}</span>
                (есть: ${dustAvail})
              </span>
            </div>
            <button id="upgrade-btn" class="upgrade-btn ${canUpgrade ? '' : 'disabled'}"
                    onclick="BarracksUI.doUpgrade('${ally.id}')"
                    ${canUpgrade ? '' : 'disabled'}>
              ${canUpgrade ? '⬆️ Повысить уровень' : (dustAvail < 1 ? `Нужна пыль ★${stars}` : 'Максимум')}
            </button>
          ` : '<div class="upgrade-maxed">✦ Максимальный уровень!</div>'}
        </div>
      </div>
    `;

    const weaponSection = (weapon || accessory) ? `
      <div class="modal-section">
        <div class="modal-section-title">Экипировано</div>
        ${weapon ? `
        <div class="modal-equipped-weapon">
          <div class="mew-icon">${weapon.icon}</div>
          <div class="mew-info">
            <div class="mew-name">${weapon.name} <span style="font-size:9px;opacity:.5">⚔️ Оружие</span></div>
            <div class="mew-bonuses">${formatBonuses(weapon.bonuses)}</div>
          </div>
        </div>` : ''}
        ${accessory ? `
        <div class="modal-equipped-weapon" style="margin-top:6px">
          <div class="mew-icon">${accessory.icon}</div>
          <div class="mew-info">
            <div class="mew-name">${accessory.name} <span style="font-size:9px;opacity:.5">🛡 Аксессуар</span></div>
            <div class="mew-bonuses">${formatBonuses(accessory.bonuses)}</div>
          </div>
        </div>` : ''}
      </div>
    ` : '';

    return `
      <div class="modal-card-header">
        <div class="modal-card-icon">${ally.icon || '⚔️'}</div>
        <div class="modal-card-titles">
          <div class="modal-card-name">${ally.name}</div>
          <div class="modal-card-sub">
            <span class="modal-race-badge" style="background:${race.bg};color:${race.color}">${race.label}</span>
            <span class="modal-class-badge">${cls.label}</span>
          </div>
          <div class="modal-stars">${'★'.repeat(stars)} ур.${powerLevel}</div>
        </div>
      </div>

      ${upgradeSection}

      <div class="modal-section">
        <div class="modal-section-title">Характеристики (текущие)</div>
        <div class="modal-stats-grid">${statsGrid}</div>
      </div>

      ${buildAbilitiesHtml(ally)}
      ${buildSpellsHtml(ally)}
      ${weaponSection}
      ${buildLoreHtml(ally)}
    `;
  }

  function doUpgrade(id) {
    const result = GameState.upgradeCard(id);
    if (result.ok) {
      if (typeof NPCSystem !== 'undefined') {
        if (result.reachedMax) NPCSystem.trigger('barracks', 'max_level');
        else NPCSystem.trigger('barracks', 'card_upgraded');
      }
      const ally = ALLIES.find(a => a.id === id);
      if (ally) App.openModal(buildDetailHTML(ally));
      render();
      VillageUI.renderBalance();
      if (result.reachedMax && typeof UnitCard !== 'undefined' && UnitCard.showMaxLevelCelebration) {
        UnitCard.showMaxLevelCelebration(id);
      }
    } else {
      const isDust = result.reason && result.reason.toLowerCase().includes('пыл');
      if (typeof NPCSystem !== 'undefined') {
        NPCSystem.trigger('barracks', isDust ? 'no_dust' : 'no_dust');
      }
      // Show error on button
      const btn = document.getElementById('upgrade-btn');
      if (btn) { btn.textContent = result.reason; btn.style.color = '#f66'; }
    }
  }

  // ── Abilities / spells / lore ──────────────────────────────────

  function buildAbilitiesHtml(ally) {
    const abs = ally.abilities || [];
    if (!abs.length) return '';
    return `
      <div class="modal-section">
        <div class="modal-section-title">Способности</div>
        <div class="modal-abilities">
          ${abs.map(a => `
            <div class="modal-ability type-${a.type || 'passive'}">
              <div class="modal-ability-header">
                <div class="modal-ability-name">${a.name}</div>
                <div class="modal-ability-unlock">★${a.unlockedAt}</div>
                <div class="modal-ability-type">${getAbilityTypeLabel(a.type)}</div>
              </div>
              <div class="modal-ability-desc">${a.desc || a.description || ''}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function buildSpellsHtml(ally) {
    const spells = ally.spells || [];
    if (!spells.length) return '';
    return `
      <div class="modal-section">
        <div class="modal-section-title">Заклинания</div>
        <div class="modal-abilities">
          ${spells.map(s => `
            <div class="modal-ability type-active">
              <div class="modal-ability-header">
                <div class="modal-ability-name">${s.name}</div>
                ${s.unlockedAt ? `<div class="modal-ability-unlock">★${s.unlockedAt}</div>` : ''}
                <div class="modal-ability-type">${s.cost ? `💧${s.cost}` : 'Пассив'}</div>
              </div>
              <div class="modal-ability-desc">
                ${s.damage ? `Урон: ${s.damage.min}–${s.damage.max} · ` : ''}
                ${s.heal   ? `Лечение: ${s.heal.min}–${s.heal.max} · ` : ''}
                ${s.desc || ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function buildLoreHtml(ally) {
    if (!ally.lore) return '';
    const entries = Object.entries(ally.lore);
    if (!entries.length) return '';
    const text = typeof entries[0][1] === 'string' ? entries[0][1] : (entries[0][1].flavor || '');
    if (!text) return '';
    return `
      <div class="modal-section">
        <div class="modal-section-title">Лор</div>
        <div class="modal-lore">"${text}"</div>
      </div>`;
  }

  function getAbilityTypeLabel(type) {
    return { passive:'Пассив', active:'Актив', aura:'Аура', on_hit:'При ударе' }[type] || (type || 'Пассив');
  }

  function formatBonuses(bonuses) {
    if (!bonuses) return '';
    const labels = { meleeAtk:'ближн.атк', meleeDef:'ближн.защ', rangeAtk:'дальн.атк',
      rangeDef:'дальн.защ', magic:'магия', magicDef:'маг.защ', hp:'HP', mana:'Мана', initiative:'Иниц.' };
    return Object.entries(bonuses).map(([k,v]) => `+${v} ${labels[k]||k}`).join(', ');
  }

  function refresh() { render(); }

  return { init, applyFilters, render, refresh, showCardDetail, doUpgrade };
})();
