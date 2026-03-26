/**
 * One-off: docs/UNITS_REFERENCE_RU.md from cards_and_weapons.js + js/data/enemies.js
 * Run: node scripts/gen_units_reference.js
 */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cwPath = path.join(root, 'cards_and_weapons.js');
const enPath = path.join(root, 'js', 'data', 'enemies.js');

const ctx = { console, Math, Date, Object, Array, String, Number, parseInt, parseFloat, isNaN, JSON };
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(cwPath, 'utf8') +
    '\n;globalThis.__ALLIES=ALLIES;globalThis.__RACES=RACES;globalThis.__CLASSES=CLASSES;',
  ctx
);
const ALLIES = ctx.__ALLIES;
const RACES = ctx.__RACES;
const CLASSES = ctx.__CLASSES;
if (!ALLIES) {
  console.error('ALLIES missing after loading cards_and_weapons.js');
  process.exit(1);
}

const ctx2 = { console, Math, Date, Object, Array, String, Number, parseInt, parseFloat, isNaN, JSON };
vm.createContext(ctx2);
vm.runInContext(
  fs.readFileSync(enPath, 'utf8') + '\n;globalThis.__ENEMY=ENEMY_TEMPLATES;',
  ctx2
);
const ENEMY_TEMPLATES = ctx2.__ENEMY;

function escPipe(s) {
  return String(s || '').replace(/\|/g, '\\|');
}

function fmtBase(b) {
  if (!b) return '—';
  const parts = [];
  if (b.hp != null) parts.push(`HP ${b.hp}`);
  if (b.meleeAtk != null) parts.push(`БА ${b.meleeAtk}`);
  if (b.meleeDef != null) parts.push(`БЗ ${b.meleeDef}`);
  if (b.rangeAtk != null) parts.push(`ДА ${b.rangeAtk}`);
  if (b.rangeDef != null) parts.push(`ДЗ ${b.rangeDef}`);
  if (b.magic != null) parts.push(`Маг ${b.magic}`);
  if (b.magicDef != null) parts.push(`МЗ ${b.magicDef}`);
  if (b.mana != null) parts.push(`Мана ${b.mana}`);
  if (b.manaRegen != null) parts.push(`Реген маны ${b.manaRegen}%`);
  if (b.initiative != null) parts.push(`Иниц ${b.initiative}`);
  return parts.join(', ');
}

function abilBlock(list) {
  if (!list || !list.length) return '—';
  return list
    .map((a) => {
      const u = a.unlockedAt ? ` (★${a.unlockedAt})` : '';
      const d = escPipe(a.desc || a.description || '—');
      return `- **${escPipe(a.name)}**${u} [${a.type || ''}]: ${d}`;
    })
    .join('\n');
}

function spellBlock(list) {
  if (!list || !list.length) return '';
  return list
    .map((s) => {
      let t = `- **${escPipe(s.name)}**`;
      if (s.cost != null) t += ` — ${s.cost} маны`;
      if (s.target) t += `, цель: \`${s.target}\``;
      if (s.damage) t += `, урон ${s.damage.min}–${s.damage.max}`;
      if (s.heal) t += `, лечение ${s.heal.min}–${s.heal.max}`;
      if (s.effect) t += `, эффект \`${s.effect}\``;
      if (s.desc) t += ` — ${escPipe(s.desc)}`;
      return t;
    })
    .join('\n');
}

let md = `# Союзники и враги — характеристики и способности

Документ сгенерирован скриптом \`scripts/gen_units_reference.js\` из данных \`cards_and_weapons.js\` (союзники) и \`js/data/enemies.js\` (враги).

**Базовые числа** — без учёта звёзд и уровня силы; в бою к ним применяются \`calcStat\` и \`calcInitiative\` из \`cards_and_weapons.js\`.

**Сокращения:** БА — ближняя атака, БЗ — ближняя защита, ДА — дальняя атака, ДЗ — дальняя защита, МЗ — магическая защита.

---

## Союзники

`;

for (const a of ALLIES) {
  const race = (RACES && RACES[a.race] && RACES[a.race].label) || a.race;
  const cls = (CLASSES && CLASSES[a.class] && CLASSES[a.class].label) || a.class;
  const sr = a.starRange ? `${a.starRange[0]}–${a.starRange[1]}` : '—';
  md += `### ${a.name} (\`${a.id}\`)\n\n`;
  md += '| Параметр | Значение |\n|----------|----------|\n';
  md += `| Раса | ${race} |\n`;
  md += `| Класс | ${cls} |\n`;
  md += `| Звёзды (диапазон) | ${sr} |\n`;
  md += `| База | ${escPipe(fmtBase(a.base))} |\n`;
  if (a.attackColumns) md += `| Атака по колонкам | ${a.attackColumns.join(', ')} |\n`;
  if (a.rangeModifiers) md += `| Модиф. дальности по кол. | \`${JSON.stringify(a.rangeModifiers)}\` |\n`;
  if (a.attackMode) md += `| Режим атаки | \`${JSON.stringify(a.attackMode)}\` |\n`;
  md += '\n**Способности**\n\n' + abilBlock(a.abilities) + '\n\n';
  const sp = spellBlock(a.spells);
  if (sp) md += '**Заклинания**\n\n' + sp + '\n\n';
  if (a.specialization) {
    md += `**Специализация (очки ${a.specialization.totalPoints ?? '—'}):** `;
    md += (a.specialization.available || []).join(', ');
    if (a.specialization.bonusPerPoint) {
      md += ` — бонус за очко: \`${JSON.stringify(a.specialization.bonusPerPoint)}\``;
    }
    md += '\n\n';
  }
  md += '---\n\n';
}

md += `## Враги (шаблоны)

`;

const enemies = Object.values(ENEMY_TEMPLATES || {}).sort((x, y) =>
  String(x.name || '').localeCompare(String(y.name || ''), 'ru')
);

for (const e of enemies) {
  const b = e.base || {};
  md += `### ${e.name} (\`${e.id}\`)\n\n`;
  if (e.isBossUnit) md += '*Босс.*\n\n';
  md += '| Параметр | Значение |\n|----------|----------|\n';
  md += `| Класс / раса | ${e.class || '—'} / ${e.race || '—'} |\n`;
  md += `| Тип атаки | ${e.attackType || '—'} |\n`;
  md += `| AI | ${e.ai || '—'} |\n`;
  md += `| Колонки атаки | ${(e.attackColumns || []).join(', ') || '—'} |\n`;
  md += `| База | ${escPipe(fmtBase(b))} |\n`;
  md += '\n**Способности**\n\n' + abilBlock(e.abilities) + '\n\n';
  const sp = spellBlock(e.spells);
  if (sp) md += '**Заклинания**\n\n' + sp + '\n\n';
  md += '---\n\n';
}

const out = path.join(root, 'docs', 'UNITS_REFERENCE_RU.md');
fs.writeFileSync(out, md, 'utf8');
console.log('Wrote', out, '| allies', ALLIES.length, '| enemies', enemies.length);
