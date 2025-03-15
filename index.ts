import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { Determiner } from "./determiner.ts";
import { SpellingDatabase, CaseDatabase } from "./database.ts";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

// 載入環境變數
config();

// 建立斜線指令
const commands = [
    new SlashCommandBuilder()
        .setName("invalidate")
        .setDescription("清除所有快取，從資料庫抓取資料。"),
    new SlashCommandBuilder()
        .setName("summary")
        .setDescription("查看目前資料筆數。"),
];

// 建立 client 實例
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri) {
    throw new Error("MONGODB_URI is not defined");
}

const spellingDatabase = await SpellingDatabase.fromConnectionString(mongodbUri);
const caseDatabase = await CaseDatabase.fromConnectionString(mongodbUri);
const determiner = new Determiner(spellingDatabase, caseDatabase);

// 當 bot 準備就緒時
client.once(Events.ClientReady, async (c) => {
    console.log(`Logged in as ${c.user.tag}`);

    // 註冊斜線指令
    const rest = new REST();
    try {
        console.log("開始註冊斜線指令");
        await rest.put(
            Routes.applicationCommands(c.user.id),
            { body: commands },
        );
        console.log("成功註冊斜線指令");
    } catch (error) {
        console.error("註冊斜線指令時發生錯誤：", error);
    }
});

// 處理斜線指令
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
        case "invalidate":
            try {
                spellingDatabase.invalidateCache();
                caseDatabase.invalidateCache();
                await interaction.reply({ content: "已清除所有快取！", ephemeral: true });
            } catch (error) {
                console.error("清除快取時發生錯誤：", error);
                await interaction.reply({
                    content: "清除快取時發生錯誤，請稍後再試。",
                    ephemeral: true
                });
            }
            break;

        case "summary":
            const spellingCount = await spellingDatabase.getRules();
            const caseCount = await caseDatabase.getRules();

            await interaction.reply({ content: `目前有拼寫規則 ${spellingCount} 筆，大小寫規則 ${caseCount} 筆。`, ephemeral: true });
            break;
    }
});

/**
 * 監聽訊息並檢查拼寫錯誤
 */
client.on(Events.MessageCreate, async message => {
    // 忽略 bot 的訊息
    if (message.author.bot) return;

    try {
        const mistakes = await determiner.checkSpelling(message.content);

        if (mistakes.length > 0) {
            const response = mistakes
                .map(mistake => {
                    const correctTerms = mistake.correct.join("、");
                    switch (mistake.type) {
                        case "case":
                            return `「${correctTerms}」是專有名詞，請注意拼法及大小寫（你拼成 ${mistake.wrong}）。\n`;
                        case "political_terminology":
                            return `「${mistake.wrong}」為含有政治色彩的中國用語，請改用「${correctTerms}」\n`;
                        case "regional_difference":
                            return `「${mistake.wrong}」為兩岸用法不同的中國用語，台灣用語是「${correctTerms}」\n`;
                        case "spelling_correction":
                            return `錯字，「${mistake.wrong}」應寫成「${correctTerms}」\n`;
                        case "term_ambiguity_check":
                            return `你確定你想說的是「${mistake.wrong}」而不是「${correctTerms}」嗎？\n`;
                        default:
                            return `「${mistake.wrong}」應改為「${correctTerms}」\n`;
                    }
                })
                .join("");

            await message.reply(response);
        }
    } catch (err) {
        console.error(err);
    }
});

// 登入 bot
client.login(process.env.DISCORD_TOKEN);
