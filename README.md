# Meal Picker（今天吃什麼｜俯視地圖 × 360° Google 街景 PWA）

專為 iPhone 打造的**極簡真實地圖與 360° 街景抽籤 PWA**。打開即從 49 間台中北區口袋名單抽選下一餐，動畫結束無縫跳進店家門口的 **360° 真實 Google 街景**，可手指左右環視店面外觀；點擊「出發去吃」直接喚醒 Google Maps App 導航。

- **線上版（GitHub Pages）**：https://berton0310.github.io/meal-picker/
- **口袋名單試算表（Google Sheets）**：https://docs.google.com/spreadsheets/d/1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g/edit

---

## 三種「輪轉跳街景」動畫轉場（頂部即時切換）

1. **A 俯衝跳街景（`dive`）**：高空衛星俯視地圖在候選店間快速跳點 $\rightarrow$ 鎖定屋頂極速俯衝放大 $\rightarrow$ 穿雲切入該店 360° Google 街景（左上保留子母定位小雷達）。
2. **B 轉輪跳街景（`reel`）**：中央立體座標轉輪高速滾動店名與經緯度 $\rightarrow$ 過衝定格展開，直接揭曉背景已預載好的 360° 店門口街景。
3. **C 子母雙視角（`split`）**：上半部俯視地圖執行全區雷達掃描並推近，下半部數位快門同步跳轉該店 360° 街景，定格時上下同框呈現街道方位與店門口實景。

### 自由視角切換 ＋ 三種真實圖資
- **三種視角一鍵切換**：`滿版街景`（含左上角可點擊放大的子母雷達窗）、`上下雙視角`、`俯視地圖`（附快速按鈕跳進 360° 街景）。
- **三種真實地圖底圖（右上角切換）**：**衛星（Esri）**、**暗黑（OpenStreetMap 高對比）**、**街道（OpenStreetMap 原色）**。

---

## 目錄結構

```text
meal-picker/
├── index.html                  # 360° 街景 × 俯視地圖 × 3D 轉輪三合一主介面
├── app.js                      # 圖磚金字塔、街景背景預載、三種轉場引擎與權重計算
├── manifest.json               # PWA 全螢幕設定
├── sw.js                       # Service Worker 離線快取（v4）
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
