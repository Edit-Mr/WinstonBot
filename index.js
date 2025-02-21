/** @format */

// index.js
import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { readFile } from "fs/promises";

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

// 載入規則
let spellingChecks = [];

async function loadRules() {
    try {
        const rulesData = await readFile("./rules.json", "utf-8");
        spellingChecks = JSON.parse(rulesData).rules;
        console.log("成功載入規則檔案");
    } catch (error) {
        console.error("載入規則檔案時發生錯誤:", error);
        process.exit(1);
    }
}

// 檢查訊息內容
function checkSpelling(content) {
    const mistakes = [];

    for (const check of spellingChecks) {
        const searchText = check.caseSensitive
            ? content
            : content.toLowerCase();
        const searchWord = check.caseSensitive
            ? check.wrong
            : check.wrong.toLowerCase();

        if (searchText.includes(searchWord)) {
            mistakes.push({
                wrong: check.wrong,
                correct: check.correct,
            });
        }
    }

    return mistakes;
}

// 當 bot 準備就緒時
client.once(Events.ClientReady, async () => {
    await loadRules();
    console.log(`Logged in as ${client.user.tag}`);
});

// 監聽訊息
client.on(Events.MessageCreate, async message => {
    // 忽略 bot 的訊息
    if (message.author.bot) return;

    const mistakes = checkSpelling(message.content);

    if (mistakes.length > 0) {
        let response = "";
        mistakes.forEach(mistake => {
            response += `什麼${mistake.wrong}？${mistake.correct}啦\n`;
        });

        await message.reply(response);
    }
});

// 登入 bot
client.login(process.env.DISCORD_TOKEN);
