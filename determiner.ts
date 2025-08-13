import { detectChineseType } from "./zhhanttw.ts";
import type { CaseDatabase, SpellingDatabase } from "./database.ts";
import { type SpellingRuleType } from "./models.ts";

/**
 * 拼寫錯誤的資訊
 */
export interface SpellingMistake {
    wrong: string;
    correct: string[];
    type: "case" | SpellingRuleType;
    traditionalOnly?: boolean;
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
        let sanitizedContent = content
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

            // For Chinese characters, we don't need word boundaries
            const isChinese = /[\u4e00-\u9fa5]/.test(searchWord);
            const wordRegex = isChinese 
                ? new RegExp(searchWord, 'i')
                : new RegExp(`\\b${searchWord}\\b`, 'i');

            if (!wordRegex.test(searchText))
                continue;

            mistakes.push({
                wrong: rule.wrong,
                correct: rule.correct,
                type: rule.type,
                traditionalOnly: rule.traditionalOnly
            });
        }

        // 檢查大小寫規則
        for (const rule of caseRules) {
            const lowerTerm = rule.term.toLowerCase();
            const contentLower = sanitizedContent.toLowerCase();

            // 如果找到相同的字詞但大小寫不同
            if (!contentLower.includes(lowerTerm)) {
                continue;
            }

            // 找出所有被反引號包圍的文字（包括單行和多行）
            const backtickMatches = sanitizedContent.match(/`[^`]+`/g) || [];
            const tripleBacktickMatches = sanitizedContent.match(/```[\s\S]+?```/g) || [];
            
            // 處理單行反引號
            const singleBacktickTexts = backtickMatches.map(match => match.slice(1, -1).toLowerCase());
            
            // 處理多行反引號，移除語言標記（如果有的話）
            const tripleBacktickTexts = tripleBacktickMatches.map(match => {
                const content = match.slice(3, -3); // 移除前後的 ```
                const firstLine = content.split('\n')[0].trim();
                // 如果第一行是語言標記，移除它
                const text = firstLine.match(/^[a-zA-Z0-9]+$/) ? content.split('\n').slice(1).join('\n') : content;
                return text.toLowerCase();
            });

            const backtickTexts = [...singleBacktickTexts, ...tripleBacktickTexts];

            const regex = new RegExp(lowerTerm, 'gi');
            const matches = sanitizedContent.match(regex);
            if (!matches) {
                continue;
            }

            for (const match of matches) {
                // 如果匹配的文字在反引號內，跳過大小寫檢查
                if (backtickTexts.some(text => text.includes(match.toLowerCase()))) {
                    continue;
                }

                if (match === rule.term) {
                    continue;
                }

                // Get the characters before and after the match
                const matchIndex = sanitizedContent.indexOf(match);
                const charBefore = matchIndex > 0 ? sanitizedContent[matchIndex - 1] : '';
                const charAfter = matchIndex + match.length < sanitizedContent.length ? 
                    sanitizedContent[matchIndex + match.length] : '';

                // Skip if there are English letters before or after
                if (!/[A-Za-z]/.test(charBefore) && !/[A-Za-z]/.test(charAfter)) {
                    mistakes.push({
                        wrong: match,
                        correct: [rule.term],
                        type: "case"
                    });
                }

                sanitizedContent = sanitizedContent.replace(match, rule.term);
                
            }
        }

        return mistakes;
    }
}
