# Meal Picker（今天吃什麼｜俯視衛星圖縮放輪轉抽籤 PWA）

專為 iPhone 打造的**極簡真實俯視衛星圖抽籤 PWA**。打開即載入台中北區 49 間口袋名單的真實經緯度座標與免 API Key 衛星俯視圖；按下「輪轉抽下一間」，鏡頭會在多間候選餐廳之間**縮小拉高 $\rightarrow$ 飛躍跳轉 $\rightarrow$ 放大衛星圖聚焦屋頂 $\rightarrow$ 縮小跳轉下一間**，最後深度俯衝鎖定中獎店家，點擊「出發去吃」直接喚醒 Google Maps App 導航。

- **線上版（GitHub Pages）**：https://berton0310.github.io/meal-picker/
- **口袋名單試算表（Google Sheets）**：https://docs.google.com/spreadsheets/d/1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g/edit

---

## 核心互動與視覺亮點

1. **俯視衛星圖縮放輪轉**：每次抽籤會自動挑選空間分散的候選路徑並提前預載高倍率衛星圖磚；鏡頭依序「拉高縮小 (`Z14.5`) $\rightarrow$ 跳轉飛往候選店 $\rightarrow$ 放大聚焦屋頂 (`Z17.4`) 短暫停留確認 $\rightarrow$ 再縮小跳轉下一間」，最後俯衝至 `Z17.6` 鎖定中獎店家並彈出資訊卡。
2. **三種免 Key 真實底圖（右上角一鍵切換）**：
   - **衛星（預設）**：Esri World Imagery 真實衛星俯視圖 ＋ World Transportation 路網疊層
   - **暗黑**：OpenStreetMap 繁體中文高對比暗黑街道圖
   - **街道**：OpenStreetMap 原色繁體中文街道圖
3. **自由探索**：支援拖曳平移、雙指／滾輪縮放、右側 `＋`/`－`/`全區` 按鈕，以及**直接點擊地圖上任一餐廳圓點**平滑飛往該店。

---

## 目錄結構

```text
meal-picker/
├── index.html                  # 全螢幕俯視衛星圖介面與極簡懸浮 HUD
├── app.js                      # Web Mercator 圖磚金字塔、縮放輪轉鏡頭引擎與抽籤邏輯
├── manifest.json               # PWA 全螢幕設定
├── sw.js                       # Service Worker 離線快取（v5）
├── assets/
│   ├── icon.svg                # 向量 App Icon
│   ├── icon-180.png            # iOS apple-touch-icon
│   └── icon-512.png            # PWA Icon
├── data/
│   ├── raw_places_source.json  # 原始 Google Maps 清單（49 間店）
│   ├── places_enriched.json    # Google Maps MCP 補齊資料
│   ├── places_normalized.json  # 正規化 JSON（座標 49/49、時段 48/49）
│   └── places_sheet.csv        # Google Sheets 匯入用表格
├── scripts/
│   ├── normalize_places.py     # 資料正規化腳本
│   └── verify_logic.mjs        # 核心邏輯單元測試（12 項檢查）
├── PLAN.md                     # 開發計畫
└── README.md                   # 專案說明與 iPhone 安裝指南
```

---

## iPhone 安裝至主畫面

1. 在 iPhone 使用 **Safari** 打開：https://berton0310.github.io/meal-picker/
2. 點擊底部工具列 **「分享」** $\rightarrow$ **「加入主畫面」**，即可獨立全螢幕開啟。

---

## 本地驗證指令

```bash
node scripts/verify_logic.mjs
```
