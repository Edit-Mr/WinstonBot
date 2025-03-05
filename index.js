/** @format */

//@ts-check

// index.js
import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { readFile } from "fs/promises";

/**
 * 用於拼寫檢查的規則項目
 * @typedef {Object} SpellingRule
 * @property {string} wrong - 錯誤的拼寫
 * @property {string} correct - 正確的拼寫
 * @property {boolean} caseSensitive - 是否區分大小寫
 */

/**
 * 拼寫錯誤的資訊
 * @typedef {Object} SpellingMistake
 * @property {string} wrong - 錯誤的拼寫
 * @property {string} correct - 正確的拼寫
 */

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

/** @type {SpellingRule[]} */
let spellingChecks = [];

/**
 * 載入拼寫檢查規則
 * @returns {Promise<void>}
 */
async function loadRules() {
    try {
        const rulesData = await readFile("./rules.json", "utf-8");
        /** @type {{rules: SpellingRule[]}} */
        const parsedData = JSON.parse(rulesData);
        spellingChecks = parsedData.rules;
        console.log("成功載入規則檔案");
    } catch (error) {
        console.error("載入規則檔案時發生錯誤:", error);
        process.exit(1);
    }
}

/**
 * 檢查訊息內容中的拼寫錯誤
 * @param {string} content - 要檢查的訊息內容
 * @returns {SpellingMistake[]} - 找到的拼寫錯誤列表
 */
function checkSpelling(content) {
    /** @type {SpellingMistake[]} */
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
    console.log(`Logged in as ${client.user?.tag}`);
});

/**
 * 監聽訊息並檢查拼寫錯誤
 */
client.on(Events.MessageCreate, async message => {
    // 忽略 bot 的訊息
    if (message.author.bot) return;
    try {
        const mistakes = checkSpelling(message.content);

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
