# WinstonBot

支語、錯字檢查 Discord Bot

## 使用方法

[邀請連結](https://discord.com/oauth2/authorize?client_id=1342364253486846032)

會自動檢查所有傳送的訊息，如果有支語或錯字會自動回覆。

## 新增規則

你可以在 [`rules.json`](rules.json) 資料夾中新增規則。如果有任何建議也歡迎提交 Pull Request。

## 開發

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