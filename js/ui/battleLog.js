// ================================================================
// BATTLE LOG UI — Scrolling log of battle events
// ================================================================

const BattleLog = (() => {

  let entries = [];

  function init() {
    entries = [];
    const el = document.getElementById('battle-log');
    if (el) el.innerHTML = '';
  }

  function addEntry({ type, text }) {
    entries.push({ type, text });

    const log = document.getElementById('battle-log');
    if (!log) return;

    const div = document.createElement('div');
    div.className = `log-entry log-${type}`;

    // Format by type
    switch (type) {
      case 'damage':
        div.innerHTML = formatDamage(text);
        break;
      case 'heal':
        div.innerHTML = formatHeal(text);
        break;
      case 'round':
        div.innerHTML = `<strong>${escHtml(text)}</strong>`;
        break;
      case 'effect':
        div.innerHTML = `<em>${escHtml(text)}</em>`;
        break;
      default:
        div.innerHTML = escHtml(text);
    }

    log.appendChild(div);

    // Auto-scroll to bottom
    log.scrollTop = log.scrollHeight;
  }

  function formatDamage(text) {
    // Highlight damage numbers in red
    return escHtml(text).replace(/(\d+) урона/g, '<span class="entry-dmg">$1 урона</span>');
  }

  function formatHeal(text) {
    return escHtml(text).replace(/(\d+) HP/g, '<span class="entry-heal">$1 HP</span>');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function getPlainText() {
    return entries.map(e => e.text).join('\n');
  }

  return { init, addEntry, getPlainText };
})();
