// ================================================================
// COLLECTION SCREEN — Card collection with race/class filters
//                     + locked cards + power level upgrade (Этап 2)
// ================================================================

const CollectionUI = (() => {

  let currentFilters = { race: '', class: '', stars: '', locked: 'all' };

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
    const grid    = document.getElementById('collection-grid');
    const countEl = document.getElementById('card-count');
    if (!grid) return;

    const filtered = filterAllies();
    if (countEl) countEl.textContent = filtered.length;

    grid.innerHTML = '';
    filtered.forEach(ally => grid.appendChild(buildCard(ally)));
  }

  // ── Card building ──────────────────────────────────────────────

  function buildCard(ally) {
    const isUnlocked = GameState.isUnlocked(ally.id);
    const lvl        = isUnlocked ? GameState.getCardLevel(ally.id) : null;
    const equippedId = isUnlocked ? GameState.getEquipped(ally.id) : null;
    const weapon     = equippedId ? WEAPONS.find(w => w.id === equippedId) : null;
    const race       = RACES[ally.race] || { label: ally.race, color: '#888', bg: '#222' };
    const cls        = CLASSES[ally.class] || { label: ally.class };

    const card = document.createElement('div');
    card.className = `coll-card${weapon ? ' equipped' : ''}${isUnlocked ? '' : ' locked'}`;
    card.style.borderBottomColor = isUnlocked ? getClassColor(ally.class) : '#333';

    const stars    = lvl ? '★'.repeat(lvl.stars) : buildStarRange(ally.starRange);
    const levelStr = lvl ? `Ур.${lvl.powerLevel}` : '';

    card.innerHTML = `
      ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
      <div class="coll-card-icon" style="${isUnlocked ? '' : 'filter:grayscale(1);opacity:.45'}">${ally.icon || '⚔️'}</div>
      <div class="coll-card-name">${ally.name}</div>
      <span class="coll-card-race" style="background:${race.bg};color:${race.color};">${race.label}</span>
      <div class="coll-card-class">${cls.label}</div>
      <div class="coll-card-stars">${stars}${levelStr ? ` <small style="color:#888;font-size:0.65rem;">${levelStr}</small>` : ''}</div>
      ${weapon ? `<div class="coll-card-equip">🗡️ ${weapon.name}</div>` : ''}
      ${!isUnlocked ? '<div class="locked-label">Открыть в Деревне</div>' : ''}
    `;

    card.addEventListener('click', () => {
      if (isUnlocked) showCardDetail(ally);
      else showLockedCard(ally);
    });

    return card;
  }

  function buildStarRange([min, max]) {
    return min === max ? '★'.repeat(min) : `★${min}–★${max}`;
  }

  const CLASS_COLORS = {
    tank:'#185FA5', spearman:'#534AB7', damage:'#7a3ab7',
    archer:'#3B6D11', crossbowman:'#0F6E56',
    mage_aoe:'#BA7517', mage_single:'#7B3F00',
    mage_healer:'#1a6b6b', mage_buffer:'#5a4a1e', mage_debuff:'#4a1a4a',
  };
  function getClassColor(cls) { return CLASS_COLORS[cls] || '#444'; }

  // ── Locked card modal ──────────────────────────────────────────

  function showLockedCard(ally) {
    const race = RACES[ally.race] || { label: ally.race, color:'#888', bg:'#222' };
    App.openModal(`
      <div class="modal-card-header">
        <div class="modal-card-icon" style="filter:grayscale(1);opacity:.5">${ally.icon || '⚔️'}</div>
        <div class="modal-card-titles">
          <div class="modal-card-name" style="color:#666">${ally.name} 🔒</div>
          <div class="modal-card-sub">
            <span class="modal-race-badge" style="background:${race.bg};color:${race.color}">${race.label}</span>
          </div>
          <div class="modal-stars">${buildStarRange(ally.starRange)}</div>
        </div>
      </div>
      <div style="text-align:center;padding:20px;color:#666;">
        <p>Эта карта ещё не открыта.</p>
        <p style="margin-top:8px;font-size:0.85rem;">Откройте свитки в <strong style="color:#cc8800">Портальном Круге</strong> деревни.</p>
        ${App.backToVillageButtonHTML('btn-back-village--inline btn-back-village--spaced', 'App.forceCloseModal();App.showScreen(\'villagemap\')')}
      </div>
    `);
  }

  // ── Card detail modal ──────────────────────────────────────────

  function showCardDetail(ally) {
    App.openModal(buildDetailHTML(ally));
  }

  function buildDetailHTML(ally) {
    const race       = RACES[ally.race] || { label: ally.race, color:'#888', bg:'#222' };
    const cls        = CLASSES[ally.class] || { label: ally.class };
    const lvl        = GameState.getCardLevel(ally.id);
    const stars      = lvl ? lvl.stars : ally.starRange[0];
    const powerLevel = lvl ? lvl.powerLevel : 1;
    const equippedId = GameState.getEquipped(ally.id);
    const weapon     = equippedId ? WEAPONS.find(w => w.id === equippedId) : null;
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
                    onclick="CollectionUI.doUpgrade('${ally.id}')"
                    ${canUpgrade ? '' : 'disabled'}>
              ${canUpgrade ? '⬆️ Повысить уровень' : (dustAvail < 1 ? `Нужна пыль ★${stars}` : 'Максимум')}
            </button>
          ` : '<div class="upgrade-maxed">✦ Максимальный уровень!</div>'}
        </div>
      </div>
    `;

    const weaponSection = weapon ? `
      <div class="modal-section">
        <div class="modal-section-title">Экипировано</div>
        <div class="modal-equipped-weapon">
          <div class="mew-icon">${weapon.icon}</div>
          <div class="mew-info">
            <div class="mew-name">${weapon.name}</div>
            <div class="mew-bonuses">${formatBonuses(weapon.bonuses)}</div>
          </div>
        </div>
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
