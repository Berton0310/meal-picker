# Meal Picker（今天吃什麼｜iPhone 極簡抽籤 PWA）

專為 iPhone 打造的**極簡無雜訊吃飯抽籤 PWA**。打開即自動依目前營業時段與位置推薦一間台中北區口袋名單，點擊「出發去吃」直接喚醒 Google Maps App 導航；背景自動同步 Google Sheets 與記憶近期吃過紀錄，避免天天重複。

- **線上版（GitHub Pages）**：https://berton0310.github.io/meal-picker/
- **口袋名單試算表（Google Sheets）**：https://docs.google.com/spreadsheets/d/1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g/edit

---

## 四種視覺與互動動畫（目前皆可在頂部即時切換試玩）

1. **A 機械拉霸**：Braun 復古工業面板，滾筒動態模糊滑動並「咔噠」過衝定格，下方資訊列翻牌揭曉。
2. **B 3D 牌疊**：Kinfolk 雜誌厚磅餐牌，支援按鈕扇形洗牌 3D 翻牌，以及手指／滑鼠**左右拖曳丟飛換張**。
3. **C 日式食籤**：昭和和紙與明體字配朱印方章，點擊後搖晃 SVG 木籤筒、抽出木籤展開「今日食籤」。
4. **D 物理轉盤**：Swiss Grid 黑膠轉盤，依當前篩選結果動態繪製切片，具 5 圈真實角動量減速與指針卡頓微彈跳。

---

## 目錄結構

```text
meal-picker/
├── index.html                  # 極簡抽籤主畫面（四種視覺動畫引擎）
├── app.js                      # 核心邏輯（49 間內建種子、Google Sheets 同步、權重與營業引擎）
├── manifest.json               # PWA 全螢幕設定
├── sw.js                       # Service Worker 離線快取
├── assets/
│   ├── icon.svg                # 向量 App Icon
│   ├── icon-180.png            # iOS apple-touch-icon
│   └── icon-512.png            # PWA Icon
├── data/
│   ├── raw_places_source.json  # 原始 Google Maps 清單（49 間店）
│   ├── places_enriched.json    # Google Maps MCP 補齊資料
│   ├── places_normalized.json  # 正規化 JSON
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
3. 桌面點擊圖示啟動即可享受無網址列的全螢幕體驗，也支援斷網秒開與 iOS 定位排序。

---

## 日後維護口袋名單

直接打開上方的 [Google Sheets 試算表](https://docs.google.com/spreadsheets/d/1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g/edit) 增刪或修改營業時間（欄位規範：`id, name, category, rating, reviews, lat, lng, mon~sun, maps_url, note, enabled`），手機下次打開 PWA 就會在背景自動同步最新名單。

---

## 本地驗證指令

```bash
node scripts/verify_logic.mjs
```
