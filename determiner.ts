import { detectChineseType } from "./zhtw.ts";
import type { SpellingCheckDatabase } from "./database.ts";

/**
 * 拼寫錯誤的資訊
 */
export interface SpellingMistake {
    wrong: string;
    correct: string;
}

export class Determiner {
    #database: SpellingCheckDatabase;

    constructor(database: SpellingCheckDatabase) {
        this.#database = database;
    }

    /**
     * 檢查訊息內容中的拼寫錯誤
     * @param content 要檢查的訊息內容
     * @returns 找到的拼寫錯誤列表
     */
    async checkSpelling(content: string): Promise<SpellingMistake[]> {
        const rules = await this.#database.getRules();
        const mistakes: SpellingMistake[] = [];

        // 先排除 URL 和 @ 開頭的字詞
        const sanitizedContent = content
            .replace(/(https?:\/\/[^\s]+)/g, "") // URL
            .replace(/@[a-zA-Z0-9_]+/g, ""); // @ 開頭的字詞

        const wordType = detectChineseType(sanitizedContent);

        for (const check of rules) {
            if (check.traditionalOnly && wordType === 'Simplified') {
                continue;
            }

            const searchText = check.caseSensitive
                ? sanitizedContent
                : sanitizedContent.toLowerCase();
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
}
