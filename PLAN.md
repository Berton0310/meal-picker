# 飯點抽籤工具（Meal Picker）開發計畫

## 1. 目標與核心體驗

- **目標裝置**：iPhone（純靜態 PWA 全螢幕網頁 App，透過 Safari「加入主畫面」安裝，獨立全螢幕執行、永遠不過期）。
- **極簡設計原則（去儀表板化）**：
  - 砍掉所有統計數據格、進度環、命中率標籤與設定抽屜，只保留**單一「抽籤主畫面」**。
  - 主畫面只呈現：**店名**、**分類 · 招牌菜備註**、**一行營業狀態與距離**，搭配「**出發去吃**」與「**再抽一次**」雙按鈕。
- **四種視覺動畫試玩引擎**：
  - **方案 A：Braun 機械滾輪拉霸機**（復古消光米灰工業面板、滾筒立體遮罩、動態模糊加速＋過衝定格與翻牌資訊列）
  - **方案 B：3D 實體牌疊洗牌 ＆ 滑卡**（Kinfolk 厚磅奶油白餐牌、扇形洗牌＋3D `rotateY` 翻牌、支援手指／滑鼠左右拖曳丟飛換張）
  - **方案 C：日式搖籤筒／今日食籤**（昭和和紙與明體字、朱印方章、SVG 木製籤筒搖晃抽出木籤後展開和紙食籤）
  - **方案 D：慣性物理美食轉盤**（Swiss Grid 午夜墨藍黑膠輪盤、動態繪製切片、5 圈真實角動量減速與頂部指針物理彈跳）
- **背景雲端與防重複**：
  - 內建 49 間完整種子資料秒開，背景靜默同步 Google Sheets CSV（ID：`1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g`）。
  - 背景靜默執行雙重降權（同次略過冷卻 `×0.05` ＋ 近 5 天吃過漸進回升 ＋ 未吃過新店 `×1.30`）。

---

## 2. 階段進度與驗證結果

1. **階段一（資料補齊）**：使用 `google-maps` MCP 補齊 49 間店（座標 **49/49**、營業時間 **48/49**），寫入 `data/places_enriched.json`。
2. **階段二（正規化與雲端建立）**：透過 `scripts/normalize_places.py` 產出 `data/places_sheet.csv` 與 `data/places_normalized.json`，並於 Google Drive 建立公開檢視的試算表「Meal Picker 口袋名單」。
3. **階段三（極簡 PWA 重構）**：產出 `index.html`、`app.js`、`manifest.json`、`sw.js`、`assets/icon*`。
4. **階段四（自動化測試與 GitHub 部署）**：`node scripts/verify_logic.mjs` 12 項核心檢查全數通過，並初始化 Git 推送至公開 Repo `Berton0310/meal-picker` 與啟用 GitHub Pages。
