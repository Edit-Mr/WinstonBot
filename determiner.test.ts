import { suite } from "vitest";
import { Determiner } from "./determiner.ts";
import { expect } from "vitest";
import { test } from "vitest";
import { MockSpellingDatabase, MockCaseDatabase } from "./database-test-utils.ts";

suite("Determiner", () => {
	test("繁體中文規則應該套用在繁體中文上", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "你好",
				correct: ["Hello"],
				type: "spelling_correction",
				traditionalOnly: true
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "繁體中文你好";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
	});

	test("繁體中文規則應該套用在中性規則上", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "你好",
				correct: ["Hello"],
				type: "spelling_correction",
				traditionalOnly: true
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "你好";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
	});

	test("繁體中文規則不該套用在簡體中文上", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "你好",
				correct: ["Hello"],
				type: "spelling_correction",
				traditionalOnly: true
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "简体中文你好";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("非繁體中文規則應該套用在簡體中文上", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "你好",
				correct: ["Hello"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "简体中文你好";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
	});

	test("應該忽略單行反引號代碼區塊內的錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "錯誤",
				correct: ["正確"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 `錯誤` 的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該忽略多行反引號代碼區塊內的錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "錯誤",
				correct: ["正確"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是代碼：\n```\n錯誤\n```\n的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該忽略 Markdown 連結內的錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "錯誤",
				correct: ["正確"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 [錯誤](https://example.com) 的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該忽略自動連結內的錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "錯誤",
				correct: ["正確"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 <錯誤> 的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該檢查不在排除區塊內的錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "錯誤",
				correct: ["正確"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 `正確` 但是這裡有錯誤的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
		expect(result[0].wrong).toBe("錯誤");
	});

	test("應該忽略代碼區塊內的大小寫錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 `javascript` 的代碼";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該檢查不在代碼區塊內的大小寫錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 javascript 的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
		expect(result[0].wrong).toBe("javascript");
		expect(result[0].correct).toEqual(["JavaScript"]);
	});

	test("應該忽略 Markdown 連結內的大小寫錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 [javascript](https://example.com) 的連結";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該忽略自動連結內的大小寫錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 <javascript> 的自動連結";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該正確處理多個排除區塊", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "錯誤",
				correct: ["正確"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "`錯誤` [錯誤](url) <錯誤> 這裡有錯誤";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
		expect(result[0].wrong).toBe("錯誤");
	});

	test("應該正確處理空的自動連結", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "錯誤",
				correct: ["正確"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 <> 的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});
});
