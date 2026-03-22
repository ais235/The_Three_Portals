// ================================================================
// UNIT CARD — Универсальный компонент карточки юнита
// buildMiniCard(card, options) — мини-карточка (thumbnail)
// showCardDetail(cardId)       — детальный оверлей поверх экрана
// ================================================================

// Перечисли id карт у которых есть PNG-арт в assets/units/
const CARDS_WITH_ART = [];

// ── Вспомогательные функции ───────────────────────────────────

function getCardStats(card, stars, pl) {
  const b = card.base;
  return {
    hp:       calcStat(b.hp       || 0, stars, pl),
    atk:      calcStat((b.meleeAtk || b.rangeAtk || b.magic || 0), stars, pl),
    def:      calcStat(b.meleeDef  || 0, stars, pl),
    rangeDef: calcStat(b.rangeDef  || 0, stars, pl),
    magicDef: calcStat(b.magicDef  || 0, stars, pl),
    special:  calcStat((b.mana     || b.magicDef || 0), stars, pl),
  };
}

function getNextHP(card, stars, pl) {
  return calcStat(card.base.hp || 0, stars, Math.min(pl + 1, stars * 10));
}

function getBgClass(cls) {
  const map = {
    tank: 'fc-tank', spearman: 'fc-spear', damage: 'fc-damage',
    archer: 'fc-archer', crossbowman: 'fc-crossbow',
    mage_aoe: 'fc-mage-aoe', mage_single: 'fc-mage',
    mage_healer: 'fc-healer', mage_buffer: 'fc-buffer',
    mage_debuff: 'fc-debuff', beast: 'fc-beast',
    magic_beast: 'fc-magic-beast', construct: 'fc-construct', spirit: 'fc-spirit',
  };
  return map[cls] || 'fc-tank';
}

function getAtkIcon(card)  {
  if (card.class.includes('mage'))   return '🔮';
  if (card.class.includes('archer') || card.class === 'crossbowman') return '🏹';
  return '⚔️';
}
function getAtkLabel(card) {
  if (card.class.includes('mage'))   return 'МАГ';
  if (card.class.includes('archer') || card.class === 'crossbowman') return 'ДА';
  return 'БА';
}
function getMagicIcon(card)    { return card.class.includes('mage') ? '💧' : '✨'; }
function getSpecialLabel(card) { return card.class.includes('mage') ? 'МАНА' : 'МЗ'; }

function getAbColor(ability) {
  return ({ passive:'#888780', active:'#185FA5', on_hit:'#A32D2D',
             aura:'#3B6D11', spell:'#534AB7' })[ability.type] || '#888';
}
function _truncate(str, n) {
  return str && str.length > n ? str.slice(0, n) + '…' : (str || '');
}
function getCardArt(card) {
  return CARDS_WITH_ART.includes(card.id)
    ? `<img src="assets/units/${card.id}.png"
            style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    : `<span style="font-size:48px;line-height:1">${card.icon || '⚔️'}</span>`;
}

// ── buildMiniCard ─────────────────────────────────────────────
// Возвращает HTML-строку мини-карточки юнита.
// options.showLocked = true  → показывает замок-оверлей
function buildMiniCard(card, options = {}) {
  const { showLocked = false } = options;
  const lvl        = GameState.getCardLevel(card.id);
  const stars      = lvl ? lvl.stars      : card.starRange[0];
  const powerLevel = lvl ? lvl.powerLevel : 1;
  const maxPower   = stars * 10;
  const stats      = getCardStats(card, stars, powerLevel);
  const raceLabel  = RACES[card.race]?.label  || card.race;
  const cls        = CLASSES[card.class]       || { label: card.class, column: '?' };
  const bgClass    = getBgClass(card.class);

  return `
    <div class="fc ${bgClass} fc-r${stars}${showLocked ? ' fc-locked' : ''}"
         data-id="${card.id}">
      <div class="fc-hd">
        <span class="fc-cls-lbl">${cls.label.toUpperCase()}</span>
        <span class="fc-stars fc-stars-${stars}">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>
      </div>
      <div class="fc-art">
        <div class="fc-med">${getCardArt(card)}</div>
        <div class="fc-s fc-stl">
          <span class="si">${getAtkIcon(card)}</span>
          <span class="sv">${stats.atk}</span>
          <span class="sl">${getAtkLabel(card)}</span>
        </div>
        <div class="fc-s fc-str">
          <span class="si">🛡</span>
          <span class="sv">${stats.def}</span>
          <span class="sl">DEF</span>
        </div>
        <div class="fc-s fc-sbl">
          <span class="si">❤️</span>
          <span class="sv">${stats.hp}</span>
          <span class="sl">HP</span>
        </div>
        <div class="fc-s fc-sbr">
          <span class="si">${getMagicIcon(card)}</span>
          <span class="sv">${stats.special}</span>
          <span class="sl">${getSpecialLabel(card)}</span>
        </div>
        ${showLocked ? '<div class="fc-lock-overlay">🔒</div>' : ''}
      </div>
      <div class="fc-nb">
        <div class="fc-name${stars === 5 ? ' fc-name-legend' : ''}">${card.name}</div>
        <div class="fc-sub">${raceLabel} · ур.${powerLevel}/${maxPower}</div>
      </div>
      <div class="fc-abs">
        ${(card.abilities || []).slice(0, 2).map(a => `
          <div class="fc-ab">
            <div class="fc-ab-dot" style="background:${getAbColor(a)}"></div>
            <span class="fc-ab-text">${a.name}: ${_truncate(a.desc || a.description || '', 28)}</span>
          </div>`).join('')}
      </div>
      <div class="fc-ft">
        <span>⚡ Иниц: ${calcInitiative(card.base.initiative, stars, powerLevel).toFixed(1)}</span>
        <span class="fc-ft-col">Кол. ${cls.column || '?'}</span>
      </div>
    </div>`;
}

// ── showCardDetail ────────────────────────────────────────────
// Показывает детальный оверлей поверх body.
// При наличии BarracksUI — делегирует ему для полного содержимого.
function showCardDetail(cardId) {
  closeCardDetail(); // закрыть предыдущий если был

  const card = ALLIES.find(c => c.id === cardId);
  if (!card) return;

  const isOwned    = GameState.isUnlocked(cardId);
  const lvl        = GameState.getCardLevel(cardId);
  const stars      = lvl ? lvl.stars      : card.starRange[0];
  const powerLevel = lvl ? lvl.powerLevel : 1;
  const maxPower   = stars * 10;
  const stats      = getCardStats(card, stars, powerLevel);
  const dust       = GameState.getDust();
  const dustAvail  = dust[stars] || 0;
  const canUpgrade = isOwned && powerLevel < maxPower && dustAvail >= 1;

  const raceLabel = RACES[card.race]?.label || card.race;
  const cls       = CLASSES[card.class] || { label: card.class };

  // Правая панель — содержимое
  const rightContent = isOwned ? `
    <div class="dm-sec">УРОВЕНЬ СИЛЫ</div>
    <div class="dm-lvl">
      <div class="dm-lr">
        <span>${'★'.repeat(stars)}</span>
        <b>ур.${powerLevel} / ${maxPower}</b>
      </div>
      <div class="dm-bar"><div class="dm-bf" style="width:${(powerLevel / maxPower * 100).toFixed(0)}%"></div></div>
      <div class="dm-hp">HP: ${stats.hp} → <b>${getNextHP(card, stars, powerLevel)}</b>
        · Стоимость: 1 пыль ★${stars} (есть: ${dustAvail})</div>
    </div>
    <button class="dm-btn${canUpgrade ? '' : ' dm-btn-disabled'}"
            onclick="UnitCard.doUpgrade('${cardId}')"
            ${canUpgrade ? '' : 'disabled'}>
      ${canUpgrade ? '⬆ Повысить уровень' : (powerLevel >= maxPower ? '✦ Максимум' : `Нужна пыль ★${stars}`)}
    </button>

    <div class="dm-sec">ХАРАКТЕРИСТИКИ</div>
    <div class="dm-stats">
      ${[
        ['HP',   stats.hp],
        [getAtkLabel(card), stats.atk],
        ['БЗ',   stats.def],
        ['ДЗ',   stats.rangeDef],
        ['МЗ',   stats.magicDef],
        ['ИНИЦ', calcInitiative(card.base.initiative, stars, powerLevel).toFixed(1)],
      ].map(([l, v]) => `
        <div class="dm-st">
          <div class="dm-sv">${v}</div>
          <div class="dm-sl">${l}</div>
        </div>`).join('')}
    </div>

    <div class="dm-sec">СПОСОБНОСТИ</div>
    <div class="dm-abs">
      ${(card.abilities || []).map(a => `
        <div class="dm-ab" style="border-color:${getAbColor(a)}">
          <div class="dm-abn">${a.name}
            <span class="dm-ab-tag">★${a.unlockedAt || 1} · ${a.type || 'passive'}</span>
          </div>
          <div class="dm-abd">${a.desc || a.description || ''}</div>
        </div>`).join('')}
      ${(card.spells || []).map(s => `
        <div class="dm-ab" style="border-color:#7F77DD">
          <div class="dm-abn">${s.name}
            <span class="dm-ab-tag">${s.cost ? s.cost + ' маны' : 'Пассив'}</span>
          </div>
          <div class="dm-abd">${s.desc || ''}</div>
        </div>`).join('')}
    </div>
  ` : `
    <div class="dm-locked-hint">
      🔒 Карта не открыта<br>
      <small>Открой свитки в Портальном Круге деревни</small>
    </div>
    <div class="dm-sec">ХАРАКТЕРИСТИКИ</div>
    <div class="dm-stats">
      ${[
        ['HP',   stats.hp],
        [getAtkLabel(card), stats.atk],
        ['БЗ',   stats.def],
        ['ИНИЦ', calcInitiative(card.base.initiative, stars, powerLevel).toFixed(1)],
      ].map(([l, v]) => `
        <div class="dm-st">
          <div class="dm-sv" style="opacity:.45">${v}</div>
          <div class="dm-sl">${l}</div>
        </div>`).join('')}
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'card-detail-overlay';
  overlay.innerHTML = `
    <div class="card-detail-modal" onclick="event.stopPropagation()">
      <div class="dm">
        <div class="dm-left ${getBgClass(card.class)}">
          ${buildMiniCard(card, { showLocked: !isOwned })}
        </div>
        <div class="dm-r">
          <button class="dm-close" onclick="closeCardDetail()">✕</button>
          ${rightContent}
        </div>
      </div>
    </div>`;

  overlay.addEventListener('click', closeCardDetail);
  document.body.appendChild(overlay);
}

function closeCardDetail() {
  document.querySelector('.card-detail-overlay')?.remove();
}

function doUpgrade(cardId) {
  const result = GameState.upgradeCard(cardId);
  if (result.ok) {
    // Перерисовать оверлей с обновлёнными данными
    closeCardDetail();
    showCardDetail(cardId);
    if (typeof BarracksUI !== 'undefined') BarracksUI.render();
    if (typeof VillageUI  !== 'undefined') VillageUI.renderBalance();
  } else {
    const btn = document.querySelector('.dm-btn');
    if (btn) { btn.textContent = result.reason; btn.classList.add('dm-btn-disabled'); }
  }
}

// Прикрепляет обработчики клика на все .fc[data-id] внутри container
function attachCardClicks(container = document) {
  container.querySelectorAll('.fc[data-id]').forEach(el => {
    el.addEventListener('click', () => showCardDetail(el.dataset.id));
  });
}

// Публичный API — явно на window для надёжного доступа из других файлов
window.UnitCard = { buildMiniCard, showCardDetail, closeCardDetail, doUpgrade, attachCardClicks };
