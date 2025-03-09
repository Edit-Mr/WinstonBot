# WinstonBot

支語、錯字檢查 Discord Bot

## 使用方法

[邀請我進你的伺服器吧！](https://discord.com/oauth2/authorize?client_id=1342364253486846032)

會自動檢查所有傳送的訊息，如果有支語或錯字會自動回覆。

> 「清了一下 docker 緩存突然有空間了」 -[EM](https://discord.com/channels/1259032762422136902/1259032897373999144/1346877622189035540)

> 「~~《緩存》（✗）~~
> 「快取」（✓）」 -[WinstonBot](https://discord.com/channels/1259032762422136902/1259032897373999144/1346877623544058000)

> 「~~媽的傻逼機器人~~」-[PT](https://discord.com/channels/1259032762422136902/1259032897373999144/1347952752545890437)

> 「幹你他媽可不可以不要亂加機器人？」 -[owen0924](https://discord.com/channels/1120284154957930588/1120284155578691676/1347239858199859220)

> 「看來這臺共語檢查機器人還是挺有用的（）。」 -[Winston Sung](https://discord.com/channels/1259032762422136902/1259032897373999144/1345753777491283989)
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
