/** @format */

//@ts-check

import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { Determiner } from "./determiner";

// 載入環境變數
config();

// 建立 client 實例
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

console.log("正在載入規則檔案……");
const determiner = await Determiner.fromFile("./rules.json").catch(err => {
    console.error(err);
    process.exit(1);
}).finally(() => {
    console.log("成功載入規則檔案");
})

// 當 bot 準備就緒時
client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

/**
 * 監聽訊息並檢查拼寫錯誤
 */
client.on(Events.MessageCreate, async message => {
    // 忽略 bot 的訊息
    if (message.author.bot) return;
    try {
        const mistakes = determiner.checkSpelling(message.content);

        if (mistakes.length > 0) {
            const response = mistakes
                .map(
                    mistake =>
                        `~~《${mistake.wrong}》（✗）~~\n「${mistake.correct}」（✓）\n`
                )
                .join("");

            await message.reply(response);
        }
    } catch (err) {
        console.error(err);
    }
});

// 登入 bot
client.login(process.env.DISCORD_TOKEN);
