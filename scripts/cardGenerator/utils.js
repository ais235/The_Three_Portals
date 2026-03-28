'use strict';

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function generateId() {
  return `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

module.exports = { rand, pick, generateId };
