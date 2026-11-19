/**
 * Meal Picker 免費雲端雙向同步後端（Google Apps Script）
 *
 * 部署步驟（只需 2 分鐘）：
 * 1. 打開你的「Meal Picker 口袋名單」Google 試算表。
 * 2. 點上方選單「擴充功能」→「Apps Script」。
 * 3. 清空預設程式碼，將本檔案完整貼上，並把下方 SECRET_TOKEN 改成你自己的密鑰。
 * 4. 點右上角「部署」→「新增部署作業」→ 類型選「網頁應用程式」：
 *    - 執行身分：我
 *    - 誰可以存取：所有人（由 SECRET_TOKEN 保護寫入權限）
 * 5. 按「部署」並授權後，複製產生的 Web App 網址（結尾為 /exec）。
 * 6. 回到 Meal Picker App → 右上角「名單管理」→「雲端／匯出」貼上網址與密鑰即可！
 */

const SECRET_TOKEN = 'CHANGE_ME_TO_YOUR_SECRET';
const HEADERS = [
  'id', 'name', 'category', 'rating', 'reviews', 'lat', 'lng',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  'maps_url', 'note', 'enabled'
];

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

function tryExpandShortUrlCoords(mapsUrl) {
  if (!mapsUrl || !/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(mapsUrl)) return null;
  try {
    const res = UrlFetchApp.fetch(mapsUrl, { followRedirects: false, muteHttpExceptions: true });
    const loc = res.getHeaders()['Location'] || res.getHeaders()['location'] || '';
    const m = loc.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || loc.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m) {
      return { lat: Number(m[1]), lng: Number(m[2]), expandedUrl: loc };
    }
  } catch (_) {}
  return null;
}

function placeToRowArray(p) {
  let lat = p.lat;
  let lng = p.lng;
  if ((!lat || !lng) && p.maps_url) {
    const expanded = tryExpandShortUrlCoords(p.maps_url);
    if (expanded) {
      lat = expanded.lat;
      lng = expanded.lng;
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
  return jsonResponse({ ok: true, service: 'meal-picker-sync', version: 1 });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!body.token || body.token !== SECRET_TOKEN) {
      return jsonResponse({ ok: false, error: 'INVALID_TOKEN' });
    }

    const sheet = getTargetSheet();
    const action = body.action || '';

    if (action === 'ping') {
      return jsonResponse({ ok: true, rows: Math.max(0, sheet.getLastRow() - 1) });
    }

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
