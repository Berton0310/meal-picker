# 飯點抽籤工具（Meal Picker）開發計畫

## 1. 目標與核心體驗

- **目標裝置**：iPhone（純靜態 PWA 全螢幕網頁 App，透過 Safari「加入主畫面」安裝，獨立全螢幕執行、永遠不過期）。
- **俯視地圖 × 360° Google 街景同步抽籤架構**：
  - 抽選瞬間立即於背景預載目標店家的免 Key Google 街景（`layer=c&cbll=lat,lng&output=svembed`），搭配輪轉／俯衝過場達成揭曉零等待。
  - 支援三種轉場動畫：**A 俯衝跳街景（`dive`）**、**B 轉輪跳街景（`reel`）**、**C 子母雙視角（`split`）**。
  - 支援三種視角切換：**滿版街景（含左上角子母雷達小地圖）**、**上下雙視角**、**俯視地圖（可點地標或按鈕進入 360° 街景）**。
  - 地圖底圖支援：**衛星（Esri World Imagery + 道路層）**、**暗黑（OpenStreetMap 戰術濾鏡）**、**街道（OpenStreetMap 原色繁中街道）**。
- **背景雲端與防重複**：
  - 內建 49 間完整種子資料（座標 `49/49`、營業時間 `48/49`），背景靜默同步 Google Sheets CSV（ID：`1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g`）。
  - 背景靜默執行雙重降權（同次略過冷卻 `×0.05` ＋ 近 5 天吃過漸進回升 ＋ 未吃過新店 `×1.30`）。

---

## 2. 階段進度與驗證結果

1. **階段一（資料補齊）**：使用 `google-maps` MCP 補齊 49 間店（座標 **49/49**、營業時間 **48/49**），寫入 `data/places_enriched.json`。
2. **階段二（正規化與雲端建立）**：透過 `scripts/normalize_places.py` 產出 `data/places_sheet.csv` 與 `data/places_normalized.json`，建立 Google Sheets「Meal Picker 口袋名單」。
3. **階段三（360° 街景 × 俯視地圖整合）**：更新 `index.html`、`app.js`、`sw.js`（快取 `v4`），加入背景街景預載、三種輪轉跳街景轉場與三種視角即時切換。
4. **階段四（驗證與 GitHub Pages 部署）**：執行 `node scripts/verify_logic.mjs` 與瀏覽器實測，推送更新至 `Berton0310/meal-picker` 並啟用 GitHub Pages。
