import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from '../app.js';

const {
  DEFAULT_PLACES,
  DEFAULT_SHEET_CSV_URL,
  parseCSV,
  csvToPlaces,
  haversineMeters,
  formatDistance,
  getOpenStatus,
  computeWeightDetail,
  pickWeightedCandidate,
  parseGoogleMapsInput,
  placeToCsvRow
} = app;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT_DIR, 'data', 'places_sheet.csv');

let passedCount = 0;
function test(name, fn) {
  fn();
  passedCount += 1;
  console.log(`  ✔ ${name}`);
}

console.log('=== Meal Picker Verification Suite ===\n');

// 1. 資料完整性檢查
console.log('[1] Checking data/places_sheet.csv & DEFAULT_PLACES...');
const csvRaw = fs.readFileSync(CSV_PATH, 'utf-8');
const csvPlaces = csvToPlaces(csvRaw);

test('CSV contains all 49 places with valid name & maps_url', () => {
  assert.equal(csvPlaces.length, 49);
  for (const p of csvPlaces) {
    assert.ok(p.name && p.name.length > 0, `Missing name for ${p.id}`);
    assert.ok(p.maps_url && p.maps_url.startsWith('https://'), `Invalid maps_url for ${p.id}`);
  }
});

test('DEFAULT_PLACES matches CSV count (49) and DEFAULT_SHEET_CSV_URL is populated', () => {
  assert.equal(DEFAULT_PLACES.length, 49);
  assert.ok(DEFAULT_SHEET_CSV_URL.includes('/spreadsheets/d/1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g/export?format=csv'));
});

const coordsCovered = csvPlaces.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)).length;
const hoursCovered = csvPlaces.filter(p => Object.values(p.hours).some(Boolean)).length;
console.log(`    Coverage -> Coords: ${coordsCovered}/49, Hours: ${hoursCovered}/49\n`);

// 2. RFC 4180 CSV 解析測試
console.log('[2] Testing RFC 4180 parseCSV...');
test('parseCSV handles BOM, CRLF/LF, quoted commas, escaped quotes, empty cells', () => {
  const sample = '\uFEFFid,name,mon,note\r\np01,"Test ""Quote"" Shop","11:00-14:00,17:00-20:00",ok\np02,Plain,,""\n';
  const rows = parseCSV(sample);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ['id', 'name', 'mon', 'note']);
  assert.deepEqual(rows[1], ['p01', 'Test "Quote" Shop', '11:00-14:00,17:00-20:00', 'ok']);
  assert.deepEqual(rows[2], ['p02', 'Plain', '', '']);
});

test('csvToPlaces allows empty id and skips enabled=FALSE', () => {
  const sample = 'id,name,category,rating,reviews,lat,lng,mon,tue,wed,thu,fri,sat,sun,maps_url,note,enabled\n' +
    ',手動新店,健康餐,4.5,10,24.16,120.68,11:00-20:00,,,,,,,https://maps.google.com/?q=24.16,備註,TRUE\n' +
    'p99,停用店家,健康餐,,,,,,,,,,,,"https://maps.google.com/?q=1",,FALSE\n';
  const res = csvToPlaces(sample);
  assert.equal(res.length, 1);
  assert.equal(res[0].id, '手動新店');
});

// 3. 營業時間引擎測試
console.log('\n[3] Testing getOpenStatus...');
test('Split shifts (lunch, afternoon break, closing soon)', () => {
  const p02 = csvPlaces.find(p => p.id === 'p02'); // 11:00-14:00,16:30-19:30, sun: 休
  assert.equal(getOpenStatus(p02, new Date('2026-11-18T12:30:00+08:00')).state, 'open');
  assert.equal(getOpenStatus(p02, new Date('2026-11-18T13:45:00+08:00')).state, 'closing_soon');
  assert.equal(getOpenStatus(p02, new Date('2026-11-18T15:00:00+08:00')).state, 'closed');
  assert.equal(getOpenStatus(p02, new Date('2026-11-18T17:30:00+08:00')).state, 'open');
  assert.equal(getOpenStatus(p02, new Date('2026-11-22T12:00:00+08:00')).state, 'closed'); // Sunday 休
});

test('Midnight spillover from previous day & 24:00 end time', () => {
  const p11 = csvPlaces.find(p => p.id === 'p11'); // 17:00-01:00 daily
  // Thursday 00:15 AM (carried over from Wednesday 17:00-01:00)
  const afterMidnight = getOpenStatus(p11, new Date('2026-11-19T00:15:00+08:00'));
  assert.equal(afterMidnight.state, 'open');
  // Thursday 00:40 AM -> 20 mins left -> closing_soon
  const closingAfterMidnight = getOpenStatus(p11, new Date('2026-11-19T00:40:00+08:00'));
  assert.equal(closingAfterMidnight.state, 'closing_soon');
  assert.equal(closingAfterMidnight.remainingMins, 20);
  // Thursday 01:30 AM -> closed
  assert.equal(getOpenStatus(p11, new Date('2026-11-19T01:30:00+08:00')).state, 'closed');

  const p18 = csvPlaces.find(p => p.id === 'p18'); // Mon-Thu 16:30-24:00, Fri closed
  assert.equal(getOpenStatus(p18, new Date('2026-11-18T23:45:00+08:00')).state, 'closing_soon');
  // Friday 00:10 AM should NOT carry over past 24:00
  assert.equal(getOpenStatus(p18, new Date('2026-11-20T00:10:00+08:00')).state, 'closed');
});

test('Unknown hours and 24-hour place handling', () => {
  const p48 = csvPlaces.find(p => p.id === 'p48');
  assert.equal(getOpenStatus(p48, new Date('2026-11-18T18:00:00+08:00')).state, 'unknown');

  const alwaysOpen = { hours: { mon: '00:00-24:00', tue: '00:00-24:00', wed: '00:00-24:00', thu: '00:00-24:00', fri: '00:00-24:00', sat: '00:00-24:00', sun: '00:00-24:00' } };
  assert.equal(getOpenStatus(alwaysOpen, new Date('2026-11-18T23:50:00+08:00')).state, 'open');
});

// 4. Haversine 距離計算測試
console.log('\n[4] Testing haversineMeters & formatDistance...');
test('Distance calculation & formatting', () => {
  // ~1.11 km per 0.01 deg latitude
  const d = haversineMeters(24.1558, 120.6822, 24.1658, 120.6822);
  assert.ok(d > 1100 && d < 1120, `Expected ~1112m, got ${d}`);
  assert.equal(formatDistance(420), '420 m');
  assert.equal(formatDistance(1250), '1.3 km');
  assert.equal(formatDistance(Infinity), '距離未知');
});

// 5. 雙重降權與破蛋嚐鮮權重計算測試
console.log('\n[5] Testing computeWeightDetail & pickWeightedCandidate...');
test('History decay tiers, new store boost, and session pass cooldown', () => {
  const nowMs = Date.parse('2026-11-18T12:30:00+08:00');
  const day = 86400000;
  const historyMap = {
    p01: { key: 'p01', count: 1, lastAteAt: nowMs - 0.2 * day }, // <1d -> 0.05
    p02: { key: 'p02', count: 1, lastAteAt: nowMs - 1.5 * day }, // 1~2d -> 0.20
    p03: { key: 'p03', count: 1, lastAteAt: nowMs - 2.5 * day }, // 2~3d -> 0.40
    p04: { key: 'p04', count: 1, lastAteAt: nowMs - 3.5 * day }, // 3~5d -> 0.70
    p05: { key: 'p05', count: 1, lastAteAt: nowMs - 6.0 * day }  // >=5d -> 1.00
  };
  const passedSet = new Set(['p05']);

  assert.equal(computeWeightDetail({ id: 'p99', name: '新店' }, historyMap, passedSet, nowMs, true).weight, 1.3);
  assert.equal(computeWeightDetail({ id: 'p01', name: 'A' }, historyMap, passedSet, nowMs, true).weight, 0.05);
  assert.equal(computeWeightDetail({ id: 'p02', name: 'B' }, historyMap, passedSet, nowMs, true).weight, 0.2);
  assert.equal(computeWeightDetail({ id: 'p03', name: 'C' }, historyMap, passedSet, nowMs, true).weight, 0.4);
  assert.equal(computeWeightDetail({ id: 'p04', name: 'D' }, historyMap, passedSet, nowMs, true).weight, 0.7);
  assert.equal(computeWeightDetail({ id: 'p05', name: 'E' }, historyMap, passedSet, nowMs, true).weight, 0.05); // 1.0 * 0.05 pass
  assert.equal(computeWeightDetail({ id: 'p01', name: 'A' }, historyMap, passedSet, nowMs, false).weight, 1.0); // unweighted mode
});

test('pickWeightedCandidate resets passedSet when all candidates were passed', () => {
  const candidates = [
    { id: 'p01', name: 'A', weightInfo: { weight: 1 } },
    { id: 'p02', name: 'B', weightInfo: { weight: 1 } }
  ];
  const passedSet = new Set(['p01', 'p02']);
  const { chosen, resetPassed } = pickWeightedCandidate(candidates, passedSet, 'p01', true, () => 0.5);
  assert.equal(resetPassed, true);
  assert.equal(passedSet.size, 0);
  assert.equal(chosen.id, 'p02');
});

// 6. Google Maps 連結解析與 CSV 列匯出測試
console.log('\n[6] Testing parseGoogleMapsInput & placeToCsvRow...');
test('parseGoogleMapsInput parses place URL, coordinates, and iOS multi-line share text', () => {
  const fullUrl = 'https://www.google.com/maps/place/%E6%9C%A8%E8%88%8D%E6%B2%99%E6%8B%89/@24.1662468,120.6848374,17z/data=!3m1!4b1';
  const r1 = parseGoogleMapsInput(fullUrl);
  assert.equal(r1.name, '木舍沙拉');
  assert.equal(r1.lat, 24.1662468);
  assert.equal(r1.lng, 120.6848374);
  assert.equal(r1.maps_url, fullUrl);

  const shareText = '一中隱藏拉麵 - 北區推薦\nhttps://maps.app.goo.gl/abcXYZ123';
  const r2 = parseGoogleMapsInput(shareText);
  assert.equal(r2.name, '一中隱藏拉麵');
  assert.equal(r2.maps_url, 'https://maps.app.goo.gl/abcXYZ123');
});

test('placeToCsvRow round-trips cleanly with parseCSV', () => {
  const row = placeToCsvRow({
    id: 'c_1',
    name: '測試店',
    category: '健康餐',
    rating: 4.6,
    lat: 24.15,
    lng: 120.68,
    hours: { mon: '11:00-14:00,17:00-20:00' },
    maps_url: 'https://maps.google.com/?q=24.15,120.68',
    note: '超好吃,必點',
    enabled: true
  });
  const parsed = parseCSV(row);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].length, 17);
  assert.equal(parsed[0][7], '11:00-14:00,17:00-20:00');
  assert.equal(parsed[0][15], '超好吃,必點');
});

// 7. 前端 DOM 結構與 ID 綁定一致性檢查
console.log('\n[7] Checking index.html & app.js DOM ID bindings...');
test('All getElementById calls in app.js match elements in index.html', () => {
  const htmlText = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
  const jsText = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf-8');
  const ids = [...jsText.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]);
  const uniqueIds = [...new Set(ids)];
  assert.ok(uniqueIds.length >= 45, `Expected at least 45 DOM IDs, found ${uniqueIds.length}`);
  const missing = uniqueIds.filter(id => !htmlText.includes(`id="${id}"`));
  assert.deepEqual(missing, [], `Missing DOM IDs in index.html: ${missing.join(', ')}`);
});

console.log(`\nAll ${passedCount} verification checks passed!`);
