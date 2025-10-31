import { detectChineseType } from "./zhhanttw.ts";
import type { ISpellingDatabase, ICaseDatabase } from "./database-interfaces.ts";
import { type SpellingRuleType, type CaseRule } from "./models.ts";

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
	#spellingDatabase: ISpellingDatabase;
	#caseDatabase: ICaseDatabase;

	// https://datatracker.ietf.org/doc/html/rfc1738#section-2.1
	// https://datatracker.ietf.org/doc/html/rfc1738#section-3.1
	#URL_REGEX = /[a-zA-Z0-9+.-]*:\/\/[^\s]+/g;

	constructor(spellingDatabase: ISpellingDatabase, caseDatabase: ICaseDatabase) {
		this.#spellingDatabase = spellingDatabase;
		this.#caseDatabase = caseDatabase;
	}

	/**
	 * 檢查訊息內容中的拼寫錯誤
	 * @param content 要檢查的訊息內容
	 * @returns 找到的拼寫錯誤列表
	 */
	async checkSpelling(content: string): Promise<SpellingMistake[]> {
		const [rules, caseRules] = await Promise.all([this.#spellingDatabase.getRules(), this.#caseDatabase.getRules()]);

		const mergedRanges = this.#buildExcludedRanges(content);
		const isExcluded = this.#createIsExcludedChecker(mergedRanges);
		const sanitizedContent = this.#getSanitizedContent(content, mergedRanges);
		const wordType = detectChineseType(sanitizedContent);

		const mistakes: SpellingMistake[] = [];
		this.#checkGeneralRules(rules, content, sanitizedContent, wordType, isExcluded, mistakes);
		this.#checkCaseRules(caseRules, content, sanitizedContent, isExcluded, mistakes);

		return mistakes;
	}

	/**
	 * 建立所有需要排除檢查的區塊範圍
	 * 包含 URL、檔案路徑、程式碼區塊、@ 標記等不需要拼寫檢查的內容
	 */
	#buildExcludedRanges(content: string): Array<{ start: number; end: number }> {
		const ranges: Array<{ start: number; end: number }> = [];
		const isOverlapping = (start: number, end: number) => ranges.some(range => start < range.end && end > range.start);

		// 排除 URL、檔案路徑、@ 標記
		this.#addMatchedRanges(content, this.#URL_REGEX, ranges);
		this.#addPathRanges(content, ranges);
		this.#addMatchedRanges(content, /@[a-zA-Z0-9_]+/g, ranges, isOverlapping);

		// 排除程式碼區塊（Markdown code blocks）
		this.#addMatchedRanges(content, /```[\s\S]+?```/g, ranges);
		this.#addMatchedRanges(content, /``[^`]*``/g, ranges, isOverlapping);
		this.#addMatchedRanges(content, /`[^`]*`/g, ranges, isOverlapping);

		return this.#mergeRanges(ranges);
	}

	/**
	 * 新增符合正則表達式的範圍到排除清單
	 */
	#addMatchedRanges(content: string, regex: RegExp, ranges: Array<{ start: number; end: number }>, checkOverlap?: (start: number, end: number) => boolean): void {
		let match: RegExpExecArray | null;
		while ((match = regex.exec(content)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			if (!checkOverlap || !checkOverlap(start, end)) {
				ranges.push({ start, end });
			}
		}
	}

	/**
	 * 新增檔案路徑範圍（需要特殊處理，避免誤判 URL 中的路徑）
	 */
	#addPathRanges(content: string, ranges: Array<{ start: number; end: number }>): void {
		const BACKTRACK_LENGTH = 50;

		const pathRegex = /(?:\.\.?\/|\/)[^\s]+/g;
		let match: RegExpExecArray | null;

		while ((match = pathRegex.exec(content)) !== null) {
			const start = match.index;
			const end = start + match[0].length;

			// 檢查路徑前是否有 <scheme>://（例如 https://github.com/user/repo）
			const beforePath = content.slice(Math.max(0, start - BACKTRACK_LENGTH), start);
			if (this.#URL_REGEX.test(beforePath)) {
				continue; // 路徑是 URL 的一部分，跳過
			}

			// 處理與現有範圍的重疊
			const overlappingIndex = ranges.findIndex(r => start < r.end && end > r.start);
			if (overlappingIndex >= 0) {
				const existing = ranges[overlappingIndex];
				// 如果新範圍完全包含現有範圍，則替換
				if (start <= existing.start && end >= existing.end) {
					ranges[overlappingIndex] = { start, end };
				}
			} else {
				ranges.push({ start, end });
			}
		}
	}

	/**
	 * 合併相鄰或重疊的範圍
	 */
	#mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
		if (ranges.length === 0) return [];

		ranges.sort((a, b) => a.start - b.start);
		const merged: Array<{ start: number; end: number }> = [ranges[0]];

		for (let i = 1; i < ranges.length; i++) {
			const current = ranges[i];
			const last = merged[merged.length - 1];

			if (current.start <= last.end) {
				last.end = Math.max(last.end, current.end);
			} else {
				merged.push(current);
			}
		}

		return merged;
	}

	/**
	 * 建立檢查位置是否在排除區塊內的函式
	 * 根據範圍數量自動選擇最佳演算法（線性或二分搜尋）
	 */
	#createIsExcludedChecker(ranges: Array<{ start: number; end: number }>): (position: number) => boolean {
		if (ranges.length === 0) {
			return () => false;
		}

		if (ranges.length <= 10) {
			// 少量範圍使用線性搜尋
			return (position: number) => ranges.some(r => position >= r.start && position < r.end);
		}

		// 大量範圍使用二分搜尋
		return (position: number) => {
			let left = 0;
			let right = ranges.length - 1;
			let candidate = -1;

			while (left <= right) {
				const mid = Math.floor((left + right) / 2);
				if (ranges[mid].start <= position) {
					candidate = mid;
					left = mid + 1;
				} else {
					right = mid - 1;
				}
			}

			return candidate >= 0 && position < ranges[candidate].end;
		};
	}

	/**
	 * 從原始內容中移除排除範圍的部分
	 */
	#getSanitizedContent(content: string, ranges: Array<{ start: number; end: number }>): string {
		if (ranges.length === 0) return content;

		let result = "";
		let lastIndex = 0;

		for (const range of ranges) {
			result += content.slice(lastIndex, range.start);
			lastIndex = range.end;
		}

		return result + content.slice(lastIndex);
	}

	/**
	 * 檢查一般拼寫規則
	 */
	#checkGeneralRules(
		rules: Array<{ wrong: string; correct: string[]; type: SpellingRuleType; traditionalOnly?: boolean }>,
		content: string,
		sanitizedContent: string,
		wordType: ReturnType<typeof detectChineseType>,
		isExcluded: (position: number) => boolean,
		mistakes: SpellingMistake[]
	): void {
		const searchText = sanitizedContent.toLowerCase();

		for (const rule of rules) {
			// 如果是繁體字規則但內容是簡體字，則跳過
			if (rule.traditionalOnly && wordType === "Simplified") {
				continue;
			}

			const searchWord = rule.wrong.toLowerCase();
			const isChinese = /[\u4e00-\u9fa5]/.test(searchWord);
			const pattern = isChinese ? searchWord : `\\b${searchWord}\\b`;
			const regex = new RegExp(pattern, "i");

			if (!regex.test(searchText)) continue;

			// 在原始內容中找出非排除區塊的符合項目
			const matchRegex = new RegExp(pattern, "gi");
			let match: RegExpExecArray | null;

			while ((match = matchRegex.exec(content)) !== null) {
				if (!isExcluded(match.index)) {
					mistakes.push({
						wrong: rule.wrong,
						correct: rule.correct,
						type: rule.type,
						traditionalOnly: rule.traditionalOnly
					});
					break; // 找到一個有效符合項目即可
				}
			}
		}
	}

	/**
	 * 檢查大小寫規則
	 */
	#checkCaseRules(caseRules: CaseRule[], content: string, sanitizedContent: string, isExcluded: (position: number) => boolean, mistakes: SpellingMistake[]): void {
		const processedPositions = new Set<number>();

		for (const rule of caseRules) {
			// 收集所有有效的大小寫形式：term 和 alternatives
			const validForms = new Set<string>([rule.term]);
			if (rule.alternatives && rule.alternatives.length > 0) {
				for (const alt of rule.alternatives) {
					validForms.add(alt);
				}
			}

			const lowerTerm = rule.term.toLowerCase();
			// 先在 sanitized content 中檢查是否存在該 term，避免在排除區塊中搜尋
			if (!sanitizedContent.toLowerCase().includes(lowerTerm)) continue;

			const regex = new RegExp(lowerTerm, "gi");
			let match: RegExpExecArray | null;

			while ((match = regex.exec(content)) !== null) {
				const position = match.index;
				const matchedText = match[0];

				// 跳過已處理、排除區塊或大小寫正確的符合項目（包括 alternatives）
				if (processedPositions.has(position) || isExcluded(position) || validForms.has(matchedText)) {
					continue;
				}

				// 檢查前後是否有英文字母（避免誤判部分單字）
				const charBefore = position > 0 ? content[position - 1] : "";
				const charAfter = position + matchedText.length < content.length ? content[position + matchedText.length] : "";

				if (!/[A-Za-z]/.test(charBefore) && !/[A-Za-z]/.test(charAfter)) {
					mistakes.push({
						wrong: matchedText,
						correct: [rule.term],
						type: "case"
					});
					processedPositions.add(position);
				}
			}
		}
	}
}
