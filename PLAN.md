# 飯點抽籤工具（Meal Picker）開發計畫

## 1. 目標與核心體驗

- **目標裝置**：iPhone（純靜態 PWA 全螢幕網頁 App，透過 Safari「加入主畫面」安裝，獨立全螢幕執行、永遠不過期）。
- **極簡俯視衛星圖縮放輪轉單頁架構**：
  - 全螢幕 60fps Web Mercator 真實俯視地圖舞台，預設載入 **Esri World Imagery 真實衛星俯視圖 ＋ 道路疊層**（可於右上角切換 `衛星` / `暗黑` / `街道`）。
  - 抽籤採用「**縮小拉高 $\rightarrow$ 飛躍跳轉 $\rightarrow$ 放大衛星圖聚焦屋頂 $\rightarrow$ 縮小跳轉下一間**」的輪轉運鏡，起跳瞬間同步預載各停靠站高倍率圖磚，最後深度俯衝鎖定中獎店家並彈出極簡資訊卡（店名、分類備註、營業狀態與距離）。
  - 保留「出發去吃」一鍵跳轉 Google Maps 導航，以及自由拖曳縮放、全區鳥瞰與點選地標功能。
- **背景雲端與防重複**：
  - 內建 49 間完整種子資料（座標 `49/49`、營業時間 `48/49`），背景靜默同步 Google Sheets CSV（ID：`1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g`）。
  - 背景靜默執行雙重降權（同次略過冷卻 `×0.05` ＋ 近 5 天吃過漸進回升 ＋ 未吃過新店 `×1.30`）。

---

## 2. 階段進度與驗證結果

1. **階段一（資料補齊）**：使用 `google-maps` MCP 補齊 49 間店（座標 **49/49**、營業時間 **48/49**），寫入 `data/places_enriched.json`。
2. **階段二（正規化與雲端建立）**：透過 `scripts/normalize_places.py` 產出 `data/places_sheet.csv` 與 `data/places_normalized.json`，建立 Google Sheets「Meal Picker 口袋名單」。
3. **階段三（俯視衛星圖縮放輪轉定版）**：移除街景與多餘模式切換列，專注打磨「縮小拉高 $\rightarrow$ 跳轉 $\rightarrow$ 放大衛星圖聚焦該店 $\rightarrow$ 再縮小跳轉下一間」運鏡體驗（`sw.js` 升版至 `v5`）。
4. **階段四（驗證與 GitHub Pages 部署）**：執行 `node scripts/verify_logic.mjs` 與瀏覽器實測，推送更新至 `Berton0310/meal-picker` 並部署 GitHub Pages。
