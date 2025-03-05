import { readFile } from "node:fs/promises";
import { detectChineseType } from "./zhtw.ts";

/**
 * 原始的拼寫檢查輸入
 */
export interface SpellingRule {
  wrong: string;
  correct: string;
  caseSensitive: boolean;
  traditionalOnly?: boolean;
}

/**
 * 拼寫錯誤的資訊
 */
export interface SpellingMistake {
  wrong: string;
  correct: string;
}

export class Determiner {
  #rules: SpellingRule[];

  constructor(rules: SpellingRule[]) {
    this.#rules = rules;
  }

  /**
   * Read rules from file
   *
   * @param {string} filePath
   * @returns {Promise<Determiner>}
   */
  static async fromFile(filePath: string): Promise<Determiner> {
    const rulesData = await readFile(filePath, "utf-8");

    const parsedData: { rules: SpellingRule[] } = JSON.parse(rulesData);

    return new Determiner(parsedData.rules);
  }

  /**
   * 檢查訊息內容中的拼寫錯誤
   * @param {string} content 要檢查的訊息內容
   * @returns {SpellingMistake[]} 找到的拼寫錯誤列表
   */
  checkSpelling(content: string): SpellingMistake[] {
    const mistakes: SpellingMistake[] = [];

    const wordType = detectChineseType(content);

    for (const check of this.#rules) {
      if (check.traditionalOnly && wordType === 'Simplified') {
        continue;
      }

      const searchText = check.caseSensitive ? content : content.toLowerCase();
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
