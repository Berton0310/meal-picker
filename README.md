# Meal Picker（今天吃什麼｜真實地圖俯視飛躍抽籤 PWA）

專為 iPhone 打造的**極簡真實地圖俯視抽籤 PWA**。打開即載入台中北區 49 間口袋名單的真實經緯度座標與免 Key 衛星／街道底圖，依目前營業時段與距離抽出下一餐，點擊「出發去吃」直接喚醒 Google Maps App 導航；背景自動同步 Google Sheets 與記憶近期吃過紀錄，避免天天重複。

- **線上版（GitHub Pages）**：https://berton0310.github.io/meal-picker/
- **口袋名單試算表（Google Sheets）**：https://docs.google.com/spreadsheets/d/1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g/edit

---

## 三種俯視鏡頭動畫節奏（頂部一鍵切換比較）

1. **A 跳躍俯衝（`hop`）**：高空俯視 $\rightarrow$ 鏡頭在最多 4 間候選餐廳座標間快速跳躍切換 $\rightarrow$ 最後俯衝拉近鎖定中獎店家並彈出資訊卡。
2. **B 跨區飛行（`fly`）**：從上一間餐廳座標以拋物線高度曲線平滑飛行（先拉高鳥瞰台中街區、再俯衝降落），沿途繪製飛行弧線，抵達後展開店家資訊卡。
3. **C 鳥瞰掃描（`radar`）**：鏡頭先退至全區鳥瞰視角框住所有候選店，瞄準光標於各座標間由快而慢跳躍閃爍 $\rightarrow$ 定格後垂直推進放大鎖定目標。

### 內建三種免 API Key 真實底圖（右上角切換）
- **衛星**：Esri World Imagery 真實衛星俯視圖 ＋ World Transportation 路網疊層
- **暗黑**：OpenStreetMap 繁體中文街道圖資（深夜高對比戰術暗黑濾鏡）
- **街道**：OpenStreetMap 原色繁體中文清晰街道底圖

---

## 目錄結構

```text
meal-picker/
├── index.html                  # 全螢幕地圖俯視抽籤介面與懸浮 HUD
├── app.js                      # Web Mercator 圖磚金字塔、3 種鏡頭飛行動畫與抽籤邏輯
├── manifest.json               # PWA 全螢幕設定
├── sw.js                       # Service Worker 離線快取（外部圖磚直接聯網）
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

## iPhone 安裝至主畫面（只要 10 秒）

1. 在 iPhone 使用 **Safari** 打開：https://berton0310.github.io/meal-picker/
2. 點擊底部工具列正中央的 **「分享」** $\rightarrow$ 選擇 **「加入主畫面」**。
3. 桌面點擊圖示啟動即可享受無網址列全螢幕體驗，支援手動拖曳／雙指縮放地圖與直接點選地圖座標切換餐廳。

---

## 日後維護口袋名單

直接打開上方的 [Google Sheets 試算表](https://docs.google.com/spreadsheets/d/1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g/edit) 增刪或修改營業時間（欄位規範：`id, name, category, rating, reviews, lat, lng, mon~sun, maps_url, note, enabled`），手機下次打開 PWA 就會在背景自動同步最新名單。

---

## 本地驗證指令

```bash
node scripts/verify_logic.mjs
```
