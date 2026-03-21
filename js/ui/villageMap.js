// ================================================================
// VILLAGE MAP — Interactive village screen with building zones
// ================================================================

const VillageMapUI = (() => {

  // Debug mode: show red zone borders if ?debug is in the URL
  const IS_DEBUG = new URLSearchParams(window.location.search).has('debug');

  // Resize observer — kept so we can disconnect on re-render
  let _resizeObs = null;

  // Building definitions
  // tipDir:   'above' | 'below'  — which side the tooltip appears
  // tipAlign: 'start' | 'center' | 'end' — horizontal alignment of tooltip
  const BUILDINGS = [
    {
      id:       'temple',
      name:     'Храм артефактов',
      icon:     '🏛️',
      desc:     'Артефакты боссов усиляют весь отряд',
      pos:      { left:'18%', top:'8%',  width:'18%', height:'26%' },
      tipDir:   'below',
      tipAlign: 'start',
      onClick:  () => _goVillageTab('temple'),
    },
    {
      id:       'library',
      name:     'Библиотека',
      icon:     '📖',
      desc:     'Справочник союзников и врагов',
      pos:      { left:'45%', top:'5%',  width:'12%', height:'25%' },
      tipDir:   'below',
      tipAlign: 'center',
      onClick:  () => _goVillageTab('library'),
    },
    {
      id:       'council',
      name:     'Совет старейшин',
      icon:     '📜',
      desc:     'Ежедневные задания и награды',
      pos:      { left:'64%', top:'8%',  width:'16%', height:'29%' },
      tipDir:   'below',
      tipAlign: 'end',
      onClick:  () => _goVillageTab('council'),
    },
    {
      id:       'exchange',
      name:     'Лавка алхимика',
      icon:     '🔄',
      desc:     'Переработка карт в пыль',
      pos:      { left:'9%',  top:'35%', width:'18%', height:'22%' },
      tipDir:   'below',
      tipAlign: 'start',
      onClick:  () => _goVillageTab('exchange'),
    },
    {
      id:       'portal',
      name:     'Портальный круг',
      icon:     '🌀',
      desc:     'Открывай свитки, получай союзников',
      pos:      { left:'44%', top:'34%', width:'13%', height:'25%' },
      tipDir:   'below',
      tipAlign: 'center',
      onClick:  () => _goVillageTab('portal'),
    },
    {
      id:       'shop',
      name:     'Магазин',
      icon:     '🛒',
      desc:     'Карты и оружие за монеты',
      pos:      { left:'60%', top:'37%', width:'18%', height:'22%' },
      tipDir:   'below',
      tipAlign: 'end',
      onClick:  () => _goVillageTab('shop'),
    },
    {
      id:       'arsenal',
      name:     'Арсенал',
      icon:     '🗡️',
      desc:     'Оружие и экипировка отряда',
      pos:      { left:'13%', top:'58%', width:'17%', height:'23%' },
      tipDir:   'above',
      tipAlign: 'start',
      onClick:  () => App.showScreen('inventory'),
    },
    {
      id:       'gate',
      name:     'Ворота',
      icon:     '🗺️',
      desc:     'Карта мира — в поход!',
      pos:      { left:'36%', top:'62%', width:'28%', height:'35%' },
      tipDir:   'above',
      tipAlign: 'center',
      onClick:  () => App.showScreen('worldmap'),
    },
    {
      id:       'barracks',
      name:     'Казарма',
      icon:     '⚔️',
      desc:     'Управление союзниками',
      pos:      { left:'70%', top:'60%', width:'23%', height:'21%' },
      tipDir:   'above',
      tipAlign: 'end',
      onClick:  () => App.showScreen('collection'),
    },
  ];

  // ── Helpers ───────────────────────────────────────────────────

  function _goVillageTab(tab) {
    App.showScreen('village');
    VillageUI.switchTab(tab);
  }

  function _dustHTML() {
    const dust = GameState.getDust();
    return [1, 2, 3, 4, 5]
      .filter(s => (dust[s] || 0) > 0)
      .map(s => `<span class="dust-chip star-${s}">★${s} ${dust[s]}</span>`)
      .join('');
  }

  function _buildZone(b) {
    const dirCls   = b.tipDir   === 'below' ? 'tip-below' : '';
    const alignCls = b.tipAlign === 'start' ? 'tip-start'
                   : b.tipAlign === 'end'   ? 'tip-end'
                   : '';

    const debugStyle = IS_DEBUG
      ? 'border: 2px solid red; background: rgba(255,0,0,0.18);'
      : '';

    const { left, top, width, height } = b.pos;

    return `
      <div id="vm-zone-${b.id}"
           class="vm-zone ${dirCls} ${alignCls}"
           style="left:${left}; top:${top}; width:${width}; height:${height}; ${debugStyle}"
           data-id="${b.id}">
        <div class="vm-tooltip">
          <span class="vm-tt-icon">${b.icon}</span>
          <span class="vm-tt-name">${b.name}</span>
          <span class="vm-tt-desc">${b.desc}</span>
        </div>
        ${IS_DEBUG ? `<div class="vm-debug-label">${b.name}</div>` : ''}
      </div>`;
  }

  // ── Zone positioning ──────────────────────────────────────────
  // Пересчитывает размер и позицию контейнера .vm-zones так, чтобы
  // он точно совпадал с видимой областью картинки (object-fit: contain).
  // Координаты зон в % от контейнера → совпадают с % от картинки.

  function _fitZones() {
    const img   = document.querySelector('.vm-bg');
    const zones = document.querySelector('.vm-zones');
    const wrap  = document.querySelector('.vm-wrap');
    if (!img || !zones || !wrap || !img.naturalWidth) return;

    const wrapW  = wrap.clientWidth;
    const wrapH  = wrap.clientHeight;
    const aspect = img.naturalWidth / img.naturalHeight;

    let rendW, rendH;
    if (wrapW / wrapH > aspect) {
      // Поля по бокам — высота заполнена
      rendH = wrapH;
      rendW = wrapH * aspect;
    } else {
      // Поля сверху/снизу — ширина заполнена
      rendW = wrapW;
      rendH = wrapW / aspect;
    }

    const offX = (wrapW - rendW) / 2;
    const offY = (wrapH - rendH) / 2;

    zones.style.left   = `${offX}px`;
    zones.style.top    = `${offY}px`;
    zones.style.width  = `${rendW}px`;
    zones.style.height = `${rendH}px`;
  }

  // ── Public ────────────────────────────────────────────────────

  function init() { /* nothing */ }

  function render() {
    // Отключаем предыдущий ResizeObserver если был
    if (_resizeObs) { _resizeObs.disconnect(); _resizeObs = null; }

    const screen = document.getElementById('screen-villagemap');
    if (!screen) return;

    const dustHtml = _dustHTML();

    screen.innerHTML = `
      <div class="vm-wrap">

        <img class="vm-bg" src="assets/village.png" alt="Деревня" draggable="false">

        <!-- Header bar -->
        <div class="vm-header">
          <div class="vm-title">🏘️ Деревня героев</div>
          <div class="vm-balance">
            <span class="vm-coins">💰 <strong id="vm-coins-val">${GameState.coins}</strong></span>
            ${dustHtml ? `<div class="vm-dust">${dustHtml}</div>` : ''}
          </div>
        </div>

        <!-- Кликабельные зоны зданий — позиционируются через _fitZones() -->
        <div class="vm-zones">
          ${BUILDINGS.map(b => _buildZone(b)).join('')}
        </div>

        ${IS_DEBUG ? '<div class="vm-debug-banner">🔴 DEBUG MODE — zone borders visible</div>' : ''}

      </div>`;

    // Клик-обработчики после отрисовки DOM
    BUILDINGS.forEach(b => {
      const el = document.getElementById(`vm-zone-${b.id}`);
      if (el) el.addEventListener('click', b.onClick);
    });

    // Подгоняем зоны под реальный размер картинки
    const img = screen.querySelector('.vm-bg');
    if (img.complete && img.naturalWidth) {
      _fitZones();
    } else {
      img.addEventListener('load', _fitZones, { once: true });
    }

    // Перепозиционируем при изменении размера окна
    const wrap = screen.querySelector('.vm-wrap');
    _resizeObs = new ResizeObserver(_fitZones);
    _resizeObs.observe(wrap);
  }

  return { init, render };
})();
