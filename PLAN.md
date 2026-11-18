# 飯點抽籤工具（Meal Picker）開發計畫

## 1. 目標與核心體驗

- **目標裝置**：iPhone（純靜態 PWA 全螢幕網頁 App，透過 Safari「加入主畫面」安裝，獨立全螢幕執行、永遠不過期）。
- **極簡地圖俯視抽籤單頁架構**：
  - 整個畫面以全螢幕 60fps Web Mercator 真實衛星／街道地圖為舞台（座標覆蓋台中北區 49 間餐廳 `49/49`）。
  - 支援三種免 Key 真實圖資切換：**衛星（Esri World Imagery + 道路層）**、**暗黑（OpenStreetMap 暗黑戰術濾鏡）**、**街道（OpenStreetMap 原色繁中街道）**，具備父圖磚金字塔補繪以確保飛行過程不閃黑。
  - 頂部可即時切換三種俯視鏡頭動畫節奏：**A 跳躍俯衝（`hop`）**、**B 跨區飛行（`fly`）**、**C 鳥瞰掃描（`radar`）**，與分類／營業中篩選。
  - 鏡頭降落後才於底部卡片展開店名、分類備註與營業狀態／距離，搭配「**出發去吃**」一鍵跳轉 Google Maps 導航。
- **背景雲端與防重複**：
  - 內建 49 間完整種子資料秒開，背景靜默同步 Google Sheets CSV（ID：`1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g`）。
  - 背景靜默執行雙重降權（同次略過冷卻 `×0.05` ＋ 近 5 天吃過漸進回升 ＋ 未吃過新店 `×1.30`）。

---

## 2. 階段進度與驗證結果

1. **階段一（資料補齊）**：使用 `google-maps` MCP 補齊 49 間店（座標 **49/49**、營業時間 **48/49**），寫入 `data/places_enriched.json`。
2. **階段二（正規化與雲端建立）**：透過 `scripts/normalize_places.py` 產出 `data/places_sheet.csv` 與 `data/places_normalized.json`，並於 Google Drive 建立公開檢視的試算表「Meal Picker 口袋名單」。
3. **階段三（真實衛星／街道地圖俯視抽籤改版）**：改寫 `index.html`、`app.js`、`sw.js`（快取升版 `v3`），實作真實圖磚引擎與三種鏡頭飛行動畫，並支援手勢拖曳、縮放與點選地圖地標。
4. **階段四（驗證與 GitHub Pages 部署）**：執行 `node scripts/verify_logic.mjs` 與瀏覽器手機視窗實測，推送更新至公開 Repo `Berton0310/meal-picker` 並部署 GitHub Pages。
