# Meal Picker（今天吃什麼｜Bento 數據主頁 × 衛星俯視輪轉 × 口袋名單管理 PWA）

專為 iPhone 打造的**極簡吃飯抽籤 PWA**。採三段式全螢幕體驗：
1. **Bento 互動主頁**：動態 SVG 即時營業進度環、互動「今日靈感盲盒」、圖示化 3×2 品項卡片牆、49 格探索星圖 ⇄ 飲食統計雙切卡，以及底部動態衛星羅盤圓盤啟動器。
2. **俯視衛星圖縮放輪轉頁**：先停於全區衛星俯視鳥瞰待命，點擊「開始衛星輪轉」即執行「縮小地圖 (`Z14.5`) $\rightarrow$ 跨街區跳轉 $\rightarrow$ 放大衛星圖聚焦屋頂 (`Z17.4`) $\rightarrow$ 再縮小跳轉下一間 $\rightarrow$ 最終鎖定 (`Z17.6`)」，點擊「出發去吃」直接喚醒 Google Maps App 導航。
3. **口袋名單管理頁**：支援搜尋篩選、一鍵啟用／停用、貼上 Google Maps 分享文字自動擷取店名與座標、快速套用營業時間、安全刪除，並支援本機即時保存、CSV 匯出與 Google Apps Script 雙向雲端同步。

- **線上版（GitHub Pages）**：https://berton0310.github.io/meal-picker/
- **口袋名單試算表（Google Sheets）**：https://docs.google.com/spreadsheets/d/1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g/edit

---

## 目錄結構

```text
meal-picker/
├── index.html                      # 三畫面主介面（Bento 主頁 / 衛星輪轉 / 名單管理與抽屜）
├── app.js                          # Web Mercator 圖磚引擎、縮放輪轉運鏡、名單 CRUD 與同步
├── manifest.json                   # PWA 全螢幕設定
├── sw.js                           # Service Worker 離線快取（v8）
├── assets/
│   ├── icon.svg                    # 向量 App Icon
│   ├── icon-180.png                # iOS apple-touch-icon
│   └── icon-512.png                # PWA Icon
├── data/
│   ├── raw_places_source.json      # 原始 Google Maps 清單（49 間店）
│   ├── places_enriched.json        # Google Maps MCP 補齊資料
│   ├── places_normalized.json      # 正規化 JSON（座標 49/49、時段 48/49）
│   └── places_sheet.csv            # Google Sheets 匯入用表格
├── scripts/
│   ├── normalize_places.py         # 資料正規化腳本
│   ├── verify_logic.mjs            # 核心邏輯單元測試（12 項檢查）
│   └── google_apps_script.gs       # 免費 Google Sheets 雙向寫回 Web App 腳本（選用）
├── PLAN.md                         # 開發計畫
└── README.md                       # 專案說明與 iPhone 安裝指南
```

---

## iPhone 安裝至主畫面

1. 在 iPhone 使用 **Safari** 打開：https://berton0310.github.io/meal-picker/
2. 點擊底部工具列 **「分享」** $\rightarrow$ **「加入主畫面」**，即可獨立全螢幕開啟。

---

## 選用：開啟 Google Sheets 雙向雲端同步（2 分鐘）

平常單機使用已會自動儲存在手機本機 `localStorage`；日後如需與 Google Sheets 雙向同步：
1. 打開你的 Google 試算表 $\rightarrow$ **擴充功能** $\rightarrow$ **Apps Script**。
2. 貼上 `scripts/google_apps_script.gs` 並修改 `SECRET_TOKEN`，點右上角 **部署 $\rightarrow$ 網頁應用程式**（執行身分：`我`，誰可以存取：`所有人`）。
3. 回到 App「右上角管理清單 $\rightarrow$ 同步」貼上產生的 `/exec` 網址與密鑰即可。

---

## 本地驗證指令

```bash
node scripts/verify_logic.mjs
```
