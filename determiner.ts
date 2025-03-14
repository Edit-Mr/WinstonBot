import { detectChineseType } from "./zhtw.ts";
import type { CaseDatabase, SpellingDatabase } from "./database.ts";
import { type SpellingRuleType } from "./models.ts";

/**
 * 拼寫錯誤的資訊
 */
export interface SpellingMistake {
    wrong: string;
    correct: string[];
    type: "case" | SpellingRuleType;
}

export class Determiner {
    #spellingDatabase: SpellingDatabase;
    #caseDatabase: CaseDatabase;

    constructor(spellingDatabase: SpellingDatabase, caseDatabase: CaseDatabase) {
        this.#spellingDatabase = spellingDatabase;
        this.#caseDatabase = caseDatabase;
    }

    /**
     * 檢查訊息內容中的拼寫錯誤
     * @param content 要檢查的訊息內容
     * @returns 找到的拼寫錯誤列表
     */
    async checkSpelling(content: string): Promise<SpellingMistake[]> {
        const [rules, caseRules] = await Promise.all([
            this.#spellingDatabase.getRules(),
            this.#caseDatabase.getRules(),
        ]);
        const mistakes: SpellingMistake[] = [];

        // 先排除 URL 和 @ 開頭的字詞
        const sanitizedContent = content
            .replace(/(https?:\/\/[^\s]+)/g, "") // URL
            .replace(/@[a-zA-Z0-9_]+/g, ""); // @ 開頭的字詞

        const wordType = detectChineseType(sanitizedContent);

        // 檢查一般規則（proper 和 warn）
        for (const rule of rules) {
            // 如果是繁體字規則但內容是簡體字，則跳過
            if (rule.traditionalOnly && wordType === 'Simplified') {
                continue;
            }

            // 一般規則不區分大小寫
            const searchText = sanitizedContent.toLowerCase();
            const searchWord = rule.wrong.toLowerCase();

            if (searchText.includes(searchWord)) {
                mistakes.push({
                    wrong: rule.wrong,
                    correct: rule.correct,
                    type: rule.type
                });
            }
        }

        // 檢查大小寫規則
        for (const rule of caseRules) {
            const lowerTerm = rule.term.toLowerCase();
            const contentLower = sanitizedContent.toLowerCase();

            // 如果找到相同的字詞但大小寫不同
            if (contentLower.includes(lowerTerm)) {
                const regex = new RegExp(lowerTerm, 'gi');
                const matches = sanitizedContent.match(regex);

                if (matches) {
                    for (const match of matches) {
                        if (match !== rule.term) {
                            mistakes.push({
                                wrong: match,
                                correct: [rule.term],
                                type: "case"
                            });
                        }
                    }
                }
            }
        }

        return mistakes;
    }
}
