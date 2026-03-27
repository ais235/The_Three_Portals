// ================================================================
// DEV: баланс encounter’ов — overrides в localStorage, без правки шаблонов врагов
// ================================================================

window.__BALANCE_OVERRIDES__ = window.__BALANCE_OVERRIDES__ || { encounters: {} };

const BALANCE_LS_KEY = 'balanceOverrides';

function loadBalanceOverrides() {
  try {
    const raw = localStorage.getItem(BALANCE_LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    window.__BALANCE_OVERRIDES__ = {
      encounters:
        typeof parsed.encounters === 'object' && parsed.encounters !== null
          ? { ...parsed.encounters }
          : {},
    };
  } catch (e) {
    console.warn('[BALANCE]', 'load failed', e);
  }
}

function saveBalanceOverrides() {
  try {
    localStorage.setItem(BALANCE_LS_KEY, JSON.stringify(window.__BALANCE_OVERRIDES__));
  } catch (e) {
    console.warn('[BALANCE]', 'save failed', e);
  }
}

function _escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _enemyTemplateRuName(templateId) {
  const tmpl = (typeof ENEMY_TEMPLATES !== 'undefined' && ENEMY_TEMPLATES)
    ? ENEMY_TEMPLATES[templateId]
    : null;
  return tmpl?.name || templateId || '—';
}

function findEncounterContext(encounterId) {
  if (typeof LOCATIONS === 'undefined' || !Array.isArray(LOCATIONS)) return null;
  for (const loc of LOCATIONS) {
    const enc = (loc.encounters || []).find(e => e.id === encounterId);
    if (enc) return { location: loc, encounter: enc };
  }
  return null;
}

function applyBalance(encounterId) {
  window.__BALANCE_OVERRIDES__.encounters = window.__BALANCE_OVERRIDES__.encounters || {};
  const targetEl = document.getElementById(`target_${encounterId}`);
  const weightEl = document.getElementById(`weight_${encounterId}`);
  const next = { ...(window.__BALANCE_OVERRIDES__.encounters[encounterId] || {}) };

  if (targetEl) {
    const v = targetEl.value.trim();
    if (v === '') delete next.targetPower;
    else {
      const n = Number(v);
      if (Number.isFinite(n)) next.targetPower = n;
    }
  }
  if (weightEl) {
    const v = weightEl.value.trim();
    if (v === '') delete next.weight;
    else {
      const n = Number(v);
      if (Number.isFinite(n)) next.weight = n;
    }
  }

  if (!Object.keys(next).length) {
    delete window.__BALANCE_OVERRIDES__.encounters[encounterId];
  } else {
    window.__BALANCE_OVERRIDES__.encounters[encounterId] = next;
  }

  saveBalanceOverrides();

  console.log('[BALANCE UPDATED]', encounterId, window.__BALANCE_OVERRIDES__.encounters[encounterId] ?? null);
  if (typeof BalanceTool !== 'undefined' && BalanceTool.renderTable) BalanceTool.renderTable();
}

function quickAdjust(encounterId, delta) {
  const ctx = findEncounterContext(encounterId);
  if (!ctx || typeof estimateEnemyPowerAsInBattle !== 'function') return;
  const ov = window.__BALANCE_OVERRIDES__.encounters[encounterId] || {};
  const current = estimateEnemyPowerAsInBattle(ctx.location, ctx.encounter, {
    overrideTargetPower: ov.targetPower != null && Number.isFinite(ov.targetPower) ? ov.targetPower : null,
  }).power;
  const targetEl = document.getElementById(`target_${encounterId}`);
  if (targetEl) targetEl.value = String(Math.max(0, Math.round(current + delta)));
  applyBalance(encounterId);
}

const BattlePowerInfo = {
  updateStrip(playerPower, enemyPower, encounterId) {
    const el = document.getElementById('battle-power-info');
    if (!el) return;
    const eid = encounterId ?? '—';
    el.innerHTML =
      `Игрок: <strong>${playerPower}</strong> · Враги: <strong>${enemyPower}</strong> · Encounter: <code>${_escapeHtml(eid)}</code>`;
  },

  updateResultBlock() {
    const el = document.getElementById('battle-result-power-info');
    if (!el) return;
    const s = window.__LAST_BATTLE_POWER_SNAPSHOT__;
    if (!s) {
      el.innerHTML = '';
      return;
    }
    const eid = s.encounterId ?? '—';
    el.innerHTML =
      `Игрок: <strong>${s.playerPower}</strong> · Враги: <strong>${s.enemyPower}</strong> · Encounter: <code>${_escapeHtml(eid)}</code>`;
  },
};

const BalanceTool = {
  openModal() {
    const m = document.getElementById('balance-modal');
    if (!m) return;
    this.renderTable();
    m.classList.remove('hidden');
    m.setAttribute('aria-hidden', 'false');
  },

  closeModal() {
    const m = document.getElementById('balance-modal');
    if (!m) return;
    m.classList.add('hidden');
    m.setAttribute('aria-hidden', 'true');
  },

  renderTable() {
    const tbody = document.getElementById('balance-modal-body');
    if (!tbody || typeof LOCATIONS === 'undefined' || !Array.isArray(LOCATIONS)) return;

    const sorted = [...LOCATIONS].sort((a, b) =>
      (a.zone || 0) - (b.zone || 0)
      || (a.orderX || 0) - (b.orderX || 0)
      || String(a.id).localeCompare(String(b.id)),
    );

    const rows = [];

    const appendRow = (loc, enc, poolOnly) => {
      const ov = poolOnly ? {} : (window.__BALANCE_OVERRIDES__.encounters[enc.id] || {});

      let comp = '—';
      let power = '?';
      if (typeof estimateEnemyPowerAsInBattle === 'function') {
        try {
          const est = estimateEnemyPowerAsInBattle(loc, enc, {
            overrideTargetPower: ov.targetPower != null && Number.isFinite(ov.targetPower) ? ov.targetPower : null,
          });
          power = String(est.power);
          comp = (est.spawnEncounter?.enemies || [])
            .map(_enemyTemplateRuName)
            .join(', ') || '—';
        } catch (err) {
          power = '?';
          comp = poolOnly && (loc.enemies || []).length
            ? (loc.enemies || []).map(_enemyTemplateRuName).join(', ')
            : '(ошибка)';
        }
      }

      const locLabel = loc.name || loc.id;
      const zoneLabel = loc.zoneLabel || (typeof loc.zone === 'number' ? `Зона ${loc.zone}` : '');
      const locTitle = [loc.id, zoneLabel].filter(Boolean).join(' · ');

      if (poolOnly) {
        rows.push(`
          <tr class="balance-row-pool">
            <td title="${_escapeHtml(locTitle)}">${_escapeHtml(locLabel)}</td>
            <td title="${_escapeHtml(enc.id)}"><em class="balance-pool-tag">пул врагов</em></td>
            <td class="balance-col-comp">${_escapeHtml(comp)}</td>
            <td>${_escapeHtml(power)}</td>
            <td>—</td>
            <td>—</td>
            <td class="balance-col-actions balance-col-muted">—</td>
          </tr>`);
        return;
      }

      const encIdJs = JSON.stringify(enc.id);
      const tVal = ov.targetPower != null && Number.isFinite(ov.targetPower) ? String(ov.targetPower) : '';
      const wVal = ov.weight != null && Number.isFinite(ov.weight) ? String(ov.weight) : '';

      rows.push(`
          <tr>
            <td title="${_escapeHtml(locTitle)}">${_escapeHtml(locLabel)}</td>
            <td><code>${_escapeHtml(enc.id)}</code></td>
            <td class="balance-col-comp">${_escapeHtml(comp)}</td>
            <td>${_escapeHtml(power)}</td>
            <td><input type="number" class="balance-inp" id="target_${_escapeHtml(enc.id)}" placeholder="сила в бою" value="${tVal ? _escapeHtml(tVal) : ''}"></td>
            <td><input type="number" class="balance-inp" id="weight_${_escapeHtml(enc.id)}" placeholder="weight" step="any" value="${wVal ? _escapeHtml(wVal) : ''}"></td>
            <td class="balance-col-actions">
              <button type="button" class="balance-btn" onclick="applyBalance(${encIdJs})">Применить</button>
              <button type="button" class="balance-btn balance-btn-sm" onclick="quickAdjust(${encIdJs}, 50)">+50</button>
              <button type="button" class="balance-btn balance-btn-sm" onclick="quickAdjust(${encIdJs}, -50)">−50</button>
            </td>
          </tr>`);
    };

    for (const loc of sorted) {
      const list = loc.encounters;
      if (list && list.length) {
        for (const enc of list) appendRow(loc, enc, false);
      } else {
        const enemies = loc.enemies || [];
        const pseudo = {
          id: `${loc.id}__pool`,
          enemies: [...enemies],
        };
        appendRow(loc, pseudo, true);
      }
    }

    tbody.innerHTML = rows.join('') || '<tr><td colspan="7">Нет локаций</td></tr>';
  },
};
