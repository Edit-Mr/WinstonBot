import { detectChineseType } from "./zhhanttw.ts";
import type { ISpellingDatabase, ICaseDatabase } from "./database-interfaces.ts";
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
	#spellingDatabase: ISpellingDatabase;
	#caseDatabase: ICaseDatabase;

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
		const mistakes: SpellingMistake[] = [];

		// 先排除 URL 和 @ 開頭的字詞
		let sanitizedContent = content
			// 移除完整網址（含 http/https）
			.replace(/https?:\/\/[^\s]+/g, "")
			// 移除 @開頭的詞
			.replace(/@[a-zA-Z0-9_]+/g, "")
			// 移除類似網址但沒 http（例如 google.com、example.org/page）
			.replace(/\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g, "")
			// 移除相對路徑（如 ./path、../img.png、/assets/icon.svg）
			.replace(/(?:\.\.?\/|\/)[^\s]+/g, "");

		// 找出所有需要排除的區塊（程式碼區塊、Markdown 連結、自動連結）
		const excludedRanges: Array<{ start: number; end: number }> = [];
		let match: RegExpExecArray | null;

		// 1. 雙反引號跳脫區塊 ``code``（必須在 match 其他反引號之前處理）
		const doubleBacktickRegex = /``[^`]*``/g;
		while ((match = doubleBacktickRegex.exec(content)) !== null) {
			excludedRanges.push({ start: match.index, end: match.index + match[0].length });
		}

		// 輔助函式：檢查範圍是否與已排除的範圍重疊
		const isOverlapping = (start: number, end: number): boolean => {
			return excludedRanges.some(range => 
				(start < range.end && end > range.start)
			);
		};

		// 2. 單列反引號程式碼區塊 `code`
		const singleBacktickRegex = /`[^`]*`/g;
		while ((match = singleBacktickRegex.exec(content)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			// 跳過已 match 雙反引號的範圍
			if (!isOverlapping(start, end)) {
				excludedRanges.push({ start, end });
			}
		}

		// 3. 多列反引號程式碼區塊 ```code```
		const tripleBacktickRegex = /```[\s\S]+?```/g;
		while ((match = tripleBacktickRegex.exec(content)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			if (!isOverlapping(start, end)) {
				excludedRanges.push({ start, end });
			}
		}

		// 4. Markdown 連結 [text](url)
		const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
		while ((match = markdownLinkRegex.exec(content)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			if (!isOverlapping(start, end)) {
				excludedRanges.push({ start, end });
			}
		}

		// 5. 自動連結 <URL>
		const autoLinkRegex = /<[^>]+>/g;
		while ((match = autoLinkRegex.exec(content)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			if (!isOverlapping(start, end)) {
				excludedRanges.push({ start, end });
			}
		}

		// 合併相鄰或重疊的排除範圍（處理 ``錯誤`` 這種情況）
		excludedRanges.sort((a, b) => a.start - b.start);
		const mergedRanges: Array<{ start: number; end: number }> = [];
		for (const range of excludedRanges) {
			if (mergedRanges.length === 0) {
				mergedRanges.push(range);
			} else {
				const lastRange = mergedRanges[mergedRanges.length - 1];
				// 如果目前的範圍與上一個範圍相鄰或重疊，則合併
				if (range.start <= lastRange.end) {
					lastRange.end = Math.max(lastRange.end, range.end);
				} else {
					mergedRanges.push(range);
				}
			}
		}

		// 輔助函式：檢查位置是否在排除區塊內
		// 根據 ranges 數量選擇最佳演算法：
		// - 少量 ranges (≤10): 線性搜尋更快（開銷小）
		// - 大量 ranges (>10): 二分搜尋更快（O(log n) vs O(n)）
		const isExcluded = (position: number): boolean => {
			if (mergedRanges.length === 0) return false;
			
			// 少量 ranges 時使用線性搜尋
			if (mergedRanges.length <= 10) {
				return mergedRanges.some(range => position >= range.start && position < range.end);
			}
			
			// 大量 ranges 時使用二分搜尋
			let left = 0;
			let right = mergedRanges.length - 1;
			let candidate = -1;
			
			// 找到最後一個 start <= position 的範圍
			while (left <= right) {
				const mid = Math.floor((left + right) / 2);
				if (mergedRanges[mid].start <= position) {
					candidate = mid;
					left = mid + 1;
				} else {
					right = mid - 1;
				}
			}
			
			// 檢查候選 range 是否包含 position
			return candidate >= 0 && position < mergedRanges[candidate].end;
		};

		const wordType = detectChineseType(sanitizedContent);

		// 檢查一般規則（proper 和 warn）
		for (const rule of rules) {
			// 如果是繁體字規則但內容是簡體字，則跳過
			if (rule.traditionalOnly && wordType === "Simplified") {
				continue;
			}
			// 一般規則不區分大小寫
			const searchText = sanitizedContent.toLowerCase();
			const searchWord = rule.wrong.toLowerCase();

			// For Chinese characters, we don't need word boundaries
			const isChinese = /[\u4e00-\u9fa5]/.test(searchWord);
			const wordRegex = isChinese ? new RegExp(searchWord, "i") : new RegExp(`\\b${searchWord}\\b`, "i");

			if (!wordRegex.test(searchText)) continue;

			// 檢查 match 的字詞是否在排除區塊內
			const regexForPosition = isChinese ? new RegExp(searchWord, "gi") : new RegExp(`\\b${searchWord}\\b`, "gi");
			let foundMatch = false;
			let matchResult;
			while ((matchResult = regexForPosition.exec(content)) !== null) {
				// 檢查 match 的開始位置是否在排除區塊內
				if (!isExcluded(matchResult.index)) {
					foundMatch = true;
					break;
				}
			}

			if (foundMatch) {
				mistakes.push({
					wrong: rule.wrong,
					correct: rule.correct,
					type: rule.type,
					traditionalOnly: rule.traditionalOnly
				});
			}
		}

		// 檢查大小寫規則
		for (const rule of caseRules) {
			const lowerTerm = rule.term.toLowerCase();
			const contentLower = sanitizedContent.toLowerCase();

			// 如果找到相同的字詞但大小寫不同
			if (!contentLower.includes(lowerTerm)) {
				continue;
			}

			const regex = new RegExp(lowerTerm, "gi");
			let matchResult;
			while ((matchResult = regex.exec(content)) !== null) {
				// 如果 match 的文字在排除區塊內，跳過大小寫檢查
				if (isExcluded(matchResult.index)) {
					continue;
				}

				const match = matchResult[0];
				if (match === rule.term) {
					continue;
				}

				// Get the characters before and after the match
				const matchIndex = matchResult.index;
				const charBefore = matchIndex > 0 ? content[matchIndex - 1] : "";
				const charAfter = matchIndex + match.length < content.length ? content[matchIndex + match.length] : "";

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
