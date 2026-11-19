/**
 * Meal Picker 免費個人後端（Google Apps Script）
 * 功能：
 * 1. 雙向寫回 Google Sheets（新增 / 編輯 / 停用 / 刪除 / 整份同步）
 * 2. 解析 Google Maps 短網址（maps.app.goo.gl）＋ 呼叫 Google Places API (New)
 *    自動抓回「完整店名、精準經緯度座標、週一～週日營業時間、分類推測」
 *
 * 部署步驟（約 3 分鐘）：
 * 1. 打開你的「Meal Picker 口袋名單」Google 試算表 → 選單「擴充功能」→「Apps Script」。
 * 2. 清空原本內容，把這整份程式碼貼上去。
 * 3. 修改下方兩個常數：
 *    - SECRET_TOKEN：自己取一組防誤寫密鑰（例如 'my-meal-2026'）
 *    - GOOGLE_PLACES_API_KEY：從 Google Cloud Console 啟用「Places API (New)」取得 API Key
 *      （金鑰只存在你私人的 Apps Script 裡，絕對不會公開到 GitHub！）
 * 4. 點右上角「部署」→「新增部署作業」→ 類型選「網頁應用程式」：
 *    - 執行身分：我
 *    - 誰可以存取：所有人
 * 5. 授權完成後複製 Web App 網址（結尾為 /exec），回到 App「管理清單 → 同步」貼上網址與密鑰即可！
 */

const SECRET_TOKEN = 'CHANGE_ME_TO_YOUR_SECRET';
const GOOGLE_PLACES_API_KEY = 'PASTE_YOUR_GOOGLE_PLACES_API_KEY_HERE';

// 預設搜尋中心（台中北區），僅在貼入純店名無座標時作為 locationBias
const DEFAULT_BIAS_LAT = 24.1558;
const DEFAULT_BIAS_LNG = 120.6822;

const HEADERS = [
  'id', 'name', 'category', 'rating', 'reviews', 'lat', 'lng',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  'maps_url', 'note', 'enabled'
];

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getTargetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function hasValidPlacesKey() {
  return Boolean(
    GOOGLE_PLACES_API_KEY &&
    GOOGLE_PLACES_API_KEY.trim() !== '' &&
    GOOGLE_PLACES_API_KEY !== 'PASTE_YOUR_GOOGLE_PLACES_API_KEY_HERE'
  );
}

/**
 * 展開 Google Maps 短網址（maps.app.goo.gl / goo.gl/maps）最多 5 層重導向
 */
function expandMapsUrl(rawUrl) {
  let current = String(rawUrl || '').trim();
  if (!current || !/^https?:\/\//i.test(current)) return current;

  for (let hop = 0; hop < 5; hop += 1) {
    if (!/maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs/i.test(current)) break;
    try {
      const res = UrlFetchApp.fetch(current, {
        followRedirects: false,
        muteHttpExceptions: true
      });
      const code = res.getResponseCode();
      const headers = res.getHeaders();
      const loc = headers['Location'] || headers['location'] || '';
      if (code >= 300 && code < 400 && loc) {
        current = loc;
      } else {
        break;
      }
    } catch (_) {
      break;
    }
  }
  return current;
}

function parseBasicMapsInput(rawText) {
  const raw = String(rawText || '').trim();
  const urlMatch = raw.match(/https?:\/\/[^\s"'<>]+/i);
  const originalUrl = urlMatch ? urlMatch[0] : '';
  const expandedUrl = originalUrl ? expandMapsUrl(originalUrl) : '';
  const targetUrl = expandedUrl || originalUrl;

  let lat = null;
  let lng = null;
  const atMatch = targetUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const dMatch = targetUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const qCoordMatch = targetUrl.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (dMatch) {
    lat = Number(dMatch[1]);
    lng = Number(dMatch[2]);
  } else if (atMatch) {
    lat = Number(atMatch[1]);
    lng = Number(atMatch[2]);
  } else if (qCoordMatch) {
    lat = Number(qCoordMatch[1]);
    lng = Number(qCoordMatch[2]);
  }

  let name = '';
  const placeMatch = targetUrl.match(/\/maps\/place\/([^/?#]+)/i);
  if (placeMatch) {
    try {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
    } catch (_) {
      name = placeMatch[1].replace(/\+/g, ' ').trim();
    }
  }

  if (!name && targetUrl) {
    const qMatch = targetUrl.match(/[?&](?:q|query)=([^&]+)/i);
    if (qMatch && !/^-?\d+\.\d+,-?\d+\.\d+$/.test(qMatch[1])) {
      try {
        name = decodeURIComponent(qMatch[1].replace(/\+/g, ' ')).trim();
      } catch (_) {
        name = qMatch[1].replace(/\+/g, ' ').trim();
      }
    }
  }

  if (!name) {
    const lines = raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !/^https?:\/\//i.test(l));
    if (lines.length > 0) {
      name = lines[0].replace(/\s*[-–|｜].*$/, '').trim() || lines[0];
    }
  }

  return {
    name,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    maps_url: targetUrl || originalUrl
  };
}

function pad2(n) {
  return String(Number(n) || 0).padStart(2, '0');
}

/**
 * 將 Google Places API (New) regularOpeningHours.periods 轉成 mon~sun 24小時制字串
 */
function convertOpeningPeriods(regularOpeningHours) {
  const result = { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' };
  if (!regularOpeningHours || !Array.isArray(regularOpeningHours.periods) || regularOpeningHours.periods.length === 0) {
    return result;
  }

  const periods = regularOpeningHours.periods;

  // 24 小時全年無休特例（只有一筆 open: {day:0, hour:0, minute:0} 且無 close）
  if (
    periods.length === 1 &&
    periods[0].open &&
    !periods[0].close &&
    periods[0].open.day === 0 &&
    periods[0].open.hour === 0 &&
    periods[0].open.minute === 0
  ) {
    DAY_KEYS.forEach(k => { result[k] = '00:00-24:00'; });
    return result;
  }

  const byDay = { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };

  periods.forEach(p => {
    if (!p || !p.open || typeof p.open.day !== 'number') return;
    const dayKey = DAY_KEYS[p.open.day];
    if (!dayKey) return;

    const startH = Number(p.open.hour || 0);
    const startM = Number(p.open.minute || 0);
    const startStr = `${pad2(startH)}:${pad2(startM)}`;

    let endStr = '24:00';
    if (p.close && typeof p.close.hour === 'number') {
      const closeH = Number(p.close.hour || 0);
      const closeM = Number(p.close.minute || 0);
      if (closeH === 0 && closeM === 0 && p.close.day !== p.open.day) {
        endStr = '24:00';
      } else {
        endStr = `${pad2(closeH)}:${pad2(closeM)}`;
      }
    }

    byDay[dayKey].push({
      sortKey: startH * 60 + startM,
      text: `${startStr}-${endStr}`
    });
  });

  DAY_KEYS.forEach(k => {
    if (byDay[k].length === 0) {
      result[k] = '休';
    } else {
      byDay[k].sort((a, b) => a.sortKey - b.sortKey);
      result[k] = byDay[k].map(item => item.text).join(',');
    }
  });

  return result;
}

function inferCategory(name, primaryTypeDisplay, types) {
  const hay = `${name || ''} ${primaryTypeDisplay || ''} ${(types || []).join(' ')}`.toLowerCase();
  if (/沙拉|水煮|舒肥|健康餐|poke|salad|輕食|健康/.test(hay)) return '健康餐';
  if (/早餐|早午餐|蛋餅|飯糰|豆漿|吐司|漢堡|包子|饅頭|breakfast|brunch/.test(hay)) return '早午餐';
  if (/火鍋|羊肉爐|鍋物|熱炒|現炒|薑母鴨|麻辣鍋|燒烤|hot_pot|shabu/.test(hay)) return '鍋物熱炒';
  if (/麵|拉麵|水餃|抄手|臭豆腐|蔥油餅|大阪燒|滷味|小吃|乾麵|牛肉麵|noodle|ramen|dumpling/.test(hay)) return '麵食小吃';
  return '便當飯類';
}

function lookupPlaceViaPlacesApi(basic) {
  const query = basic.name || (Number.isFinite(basic.lat) && Number.isFinite(basic.lng) ? `${basic.lat},${basic.lng}` : '');
  if (!query) return null;

  const hasCoords = Number.isFinite(basic.lat) && Number.isFinite(basic.lng);
  const payload = {
    textQuery: query,
    languageCode: 'zh-TW',
    pageSize: 1,
    locationBias: {
      circle: {
        center: {
          latitude: hasCoords ? basic.lat : DEFAULT_BIAS_LAT,
          longitude: hasCoords ? basic.lng : DEFAULT_BIAS_LNG
        },
        radius: hasCoords ? 500.0 : 8000.0
      }
    }
  };

  const res = UrlFetchApp.fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY.trim(),
      'X-Goog-FieldMask': [
        'places.displayName',
        'places.location',
        'places.regularOpeningHours',
        'places.googleMapsUri',
        'places.rating',
        'places.userRatingCount',
        'places.primaryTypeDisplayName',
        'places.types',
        'places.editorialSummary'
      ].join(',')
    },
    payload: JSON.stringify(payload)
  });

  if (res.getResponseCode() !== 200) {
    throw new Error(`PLACES_HTTP_${res.getResponseCode()}: ${res.getContentText().slice(0, 180)}`);
  }

  const data = JSON.parse(res.getContentText() || '{}');
  const first = data && Array.isArray(data.places) ? data.places[0] : null;
  if (!first) return null;

  const displayName = (first.displayName && first.displayName.text) || basic.name || '';
  const primaryTypeText = (first.primaryTypeDisplayName && first.primaryTypeDisplayName.text) || '';
  const summaryText = (first.editorialSummary && first.editorialSummary.text) || '';
  const lat = first.location && typeof first.location.latitude === 'number' ? first.location.latitude : basic.lat;
  const lng = first.location && typeof first.location.longitude === 'number' ? first.location.longitude : basic.lng;
  const hours = convertOpeningPeriods(first.regularOpeningHours);
  const category = inferCategory(displayName, primaryTypeText, first.types || []);

  return {
    name: displayName,
    category,
    rating: typeof first.rating === 'number' ? first.rating : null,
    reviews: typeof first.userRatingCount === 'number' ? first.userRatingCount : null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    hours,
    maps_url: first.googleMapsUri || basic.maps_url || '',
    note: summaryText || primaryTypeText || ''
  };
}

function placeToRowArray(p) {
  let lat = p.lat;
  let lng = p.lng;
  if ((!lat || !lng) && p.maps_url) {
    const basic = parseBasicMapsInput(p.maps_url);
    if (Number.isFinite(basic.lat) && Number.isFinite(basic.lng)) {
      lat = basic.lat;
      lng = basic.lng;
    }
  }
  const h = p.hours || {};
  return [
    p.id || '',
    p.name || '',
    p.category || '便當飯類',
    p.rating ?? '',
    p.reviews ?? '',
    lat ?? '',
    lng ?? '',
    h.mon || '',
    h.tue || '',
    h.wed || '',
    h.thu || '',
    h.fri || '',
    h.sat || '',
    h.sun || '',
    p.maps_url || '',
    p.note || '',
    p.enabled === false ? 'FALSE' : 'TRUE'
  ];
}

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'meal-picker-sync',
    version: 2,
    placesApiConfigured: hasValidPlacesKey()
  });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!body.token || body.token !== SECRET_TOKEN) {
      return jsonResponse({ ok: false, error: 'INVALID_TOKEN' });
    }

    const action = body.action || '';

    if (action === 'ping') {
      const sheet = getTargetSheet();
      return jsonResponse({
        ok: true,
        rows: Math.max(0, sheet.getLastRow() - 1),
        placesApiConfigured: hasValidPlacesKey()
      });
    }

    if (action === 'lookup') {
      const rawInput = String(body.input || '').trim();
      if (!rawInput) return jsonResponse({ ok: false, error: 'EMPTY_INPUT' });

      const basic = parseBasicMapsInput(rawInput);

      if (hasValidPlacesKey()) {
        const enriched = lookupPlaceViaPlacesApi(basic);
        if (enriched) {
          return jsonResponse({
            ok: true,
            source: 'google_places_api',
            place: enriched
          });
        }
      }

      return jsonResponse({
        ok: true,
        source: 'url_expand_only',
        placesApiConfigured: hasValidPlacesKey(),
        place: {
          name: basic.name,
          category: null,
          rating: null,
          reviews: null,
          lat: basic.lat,
          lng: basic.lng,
          hours: null,
          maps_url: basic.maps_url,
          note: ''
        }
      });
    }

    const sheet = getTargetSheet();

    if (action === 'upsert' && body.place) {
      const rowValues = placeToRowArray(body.place);
      const id = String(rowValues[0] || '');
      const lastRow = sheet.getLastRow();
      let foundRow = -1;

      if (id && lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i += 1) {
          if (String(ids[i][0]).trim() === id) {
            foundRow = i + 2;
            break;
          }
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, HEADERS.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
      return jsonResponse({
        ok: true,
        action: foundRow > 0 ? 'updated' : 'inserted',
        lat: rowValues[5],
        lng: rowValues[6]
      });
    }

    if (action === 'delete' && body.id) {
      const targetId = String(body.id).trim();
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = ids.length - 1; i >= 0; i -= 1) {
          if (String(ids[i][0]).trim() === targetId) {
            sheet.deleteRow(i + 2);
            return jsonResponse({ ok: true, deleted: targetId });
          }
        }
      }
      return jsonResponse({ ok: true, deleted: null });
    }

    if (action === 'sync_all' && Array.isArray(body.places)) {
      const rows = [HEADERS].concat(body.places.map(placeToRowArray));
      sheet.clearContents();
      sheet.getRange(1, 1, rows.length, HEADERS.length).setValues(rows);
      return jsonResponse({ ok: true, synced: body.places.length });
    }

    return jsonResponse({ ok: false, error: 'UNKNOWN_ACTION' });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}
