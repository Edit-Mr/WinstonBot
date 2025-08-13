# WinstonBot - 文字檢查工具

WinstonBot 是一個多功能的文字檢查工具，可以檢查拼寫錯誤、大小寫問題、政治色彩用語等。它提供了 Discord Bot 和網頁介面兩種使用方式。

## 功能特點

- 檢查拼寫錯誤
- 檢查專有名詞大小寫
- 識別政治色彩用語
- 識別兩岸用語差異
- 檢查詞彙混淆問題

## 安裝與設定

### 前置需求

- Node.js 18 或更高版本
- MongoDB 資料庫
- Discord 開發者帳號（如果要使用 Discord Bot 功能）

### 安裝步驟

1. 複製專案
   ```
   git clone https://github.com/yourusername/winstonbot.git
   cd winstonbot
   ```

2. 安裝依賴
   ```
   pnpm install
   ```

3. 設定環境變數
   在專案根目錄建立 `.env` 檔案，並填入以下內容：
   ```
   DISCORD_TOKEN=你的Discord機器人Token
   MONGODB_URI=你的MongoDB連線字串
   WEB_PORT=3000
   ```

## 使用方法

### 啟動應用程式

```
pnpm start
```

這將同時啟動 Discord Bot 和網頁伺服器。

### Discord Bot 使用方法

將 Bot 邀請到你的 Discord 伺服器後，它會自動檢查所有訊息中的拼寫錯誤和用詞問題。

#### 斜線指令

- `/invalidate` - 清除所有快取，從資料庫重新抓取資料
- `/summary` - 查看目前資料庫中的規則筆數

### 網頁介面使用方法

1. 在瀏覽器中開啟 `http://localhost:3000`（或你設定的其他連接埠）
2. 在文字框中輸入要檢查的文字
3. 點擊「檢查」按鈕
4. 查看檢查結果

## 資料庫結構

WinstonBot 使用 MongoDB 儲存兩種類型的規則：

1. 拼寫規則 (SpellingRule)：
   - 錯誤用詞
   - 正確用詞
   - 規則類型（政治色彩、兩岸用法、錯字、詞彙混淆）
   - 是否僅適用於繁體中文

2. 大小寫規則 (CaseRule)：
   - 正確的大小寫形式

## 開發與貢獻

歡迎提交 Pull Request 或開 Issue 來改進這個專案！

## 授權

本專案採用 Apache 2.0 授權。

```bash
git clone https://github.com/Edit-Mr/WinstonBot.git
cd WinstonBot
pnpm install
```

設定 `.env` 檔案

```env
DISCORD_TOKEN=
```

```bash
pnpm start
```
