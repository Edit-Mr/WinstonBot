//@ts-check

import { readFile } from "node:fs/promises";
import { detectChineseType } from "./zhtw.js";

/**
 * 用於拼寫檢查的規則項目
 * @typedef {Object} SpellingRule
 * @property {string} wrong 錯誤的拼寫
 * @property {string} correct 正確的拼寫
 * @property {boolean} caseSensitive 是否區分大小寫
 * @property {"Any" | "Traditional" | "Simplified"} ruleType 規則類型
 */

/**
 * 原始的拼寫檢查輸入
 * @typedef {Object} RawSpellingRule
 * @property {string} wrong 錯誤的拼寫
 * @property {string} correct 正確的拼寫
 * @property {boolean} caseSensitive 是否區分大小寫
 */

/**
 * 拼寫錯誤的資訊
 * @typedef {Object} SpellingMistake
 * @property {string} wrong 錯誤的拼寫
 * @property {string} correct 正確的拼寫
 */

export class Determiner {
  /**
   * @param {SpellingRule[]} rules
   */
  #rules;

  /**
   * @param {SpellingRule[]} rules
   */
  constructor(rules) {
    this.#rules = rules;
  }

  /**
   * Read rules from file
   *
   * @param {string} filePath
   * @returns {Promise<Determiner>}
   */
  static async fromFile(filePath) {
    const rulesData = await readFile(filePath, "utf-8");

    /** @type {{rules: RawSpellingRule[]}} */
    const parsedData = JSON.parse(rulesData);

    /**
     * @type {SpellingRule[]}
     */
    const processedSpellingRules = parsedData.rules.map((rule) => {
      const ruleIsFor = detectChineseType(rule.wrong);
      const ruleType = ruleIsFor === "Unknown" ? "Any" : ruleIsFor;

      return {
        ...rule,
        ruleType,
      };
    });

    return new Determiner(processedSpellingRules);
  }

  /**
   * 檢查訊息內容中的拼寫錯誤
   * @param {string} content 要檢查的訊息內容
   * @returns {SpellingMistake[]} 找到的拼寫錯誤列表
   */
  checkSpelling(content) {
    /** @type {SpellingMistake[]} */
    const mistakes = [];

    const wordType = detectChineseType(content);

    for (const check of this.#rules) {
      const searchText = check.caseSensitive ? content : content.toLowerCase();
      const searchWord = check.caseSensitive
        ? check.wrong
        : check.wrong.toLowerCase();

      if (
        searchText.includes(searchWord) &&
        (check.ruleType === wordType || check.ruleType === "Any")
      ) {
        mistakes.push({
          wrong: check.wrong,
          correct: check.correct,
        });
      }
    }

    return mistakes;
  }
}
