/**
 * Генерация пачки карт (архетип → статы → способности → авто-баланс по силе).
 * Run: node scripts/run_card_generator.js
 * Вывод: data/generated_cards.json
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { generateCardBatch } = require('./cardGenerator/generator');

const root = path.join(__dirname, '..');
const outPath = path.join(root, 'data', 'generated_cards.json');

const COUNT = Number(process.env.CARD_COUNT || 100);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const cards = generateCardBatch(COUNT);
fs.writeFileSync(outPath, JSON.stringify(cards, null, 2), 'utf8');

console.log(`Wrote ${cards.length} cards → ${outPath}`);
