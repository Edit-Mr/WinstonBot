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

	test("應該忽略單行反引號程式碼區塊內的錯誤", async () => {
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

	test("應該忽略多行反引號有語言標記程式碼區塊內的錯誤", async () => {
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
		const text = "這是程式碼：\n```javascript\n錯誤\n```\n的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該忽略多行反引號有其他標記程式碼區塊內的錯誤", async () => {
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
		const text = "這是程式碼：\n```javascript line=5\n錯誤\n```\n的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該忽略多行反引號程式碼區塊內的錯誤", async () => {
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
		const text = "這是程式碼：\n```\n錯誤\n```\n的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該處理 Markdown 連結內的錯誤", async () => {
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
		expect(result).toHaveLength(1);
		expect(result[0].wrong).toBe("錯誤");
		expect(result[0].correct).toEqual(["正確"]);
	});

	test("應該處理 Markdown 無效連結區塊內的錯誤", async () => {
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
		const text = "這是 [hi](錯誤) 的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
		expect(result[0].wrong).toBe("錯誤");
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
		const text = "這是 <http://錯誤> 的文字";

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

	test("應該忽略程式碼區塊內的大小寫錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 `javascript` 的程式碼";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該檢查不在程式碼區塊內的大小寫錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 javascript 的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
		expect(result[0].wrong).toBe("javascript");
		expect(result[0].correct).toEqual(["JavaScript"]);
	});

	test("應該處理 Markdown 連結內的大小寫錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 [javascript](https://example.com) 的連結";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
		expect(result[0].wrong).toBe("javascript");
		expect(result[0].correct).toEqual(["JavaScript"]);
	});

	test("應該忽略程式碼區塊內的 http case rule 錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "HTTP" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 `http example.com` 的程式碼";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該忽略多行程式碼區塊內的 http case rule 錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "HTTP" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是程式碼：\n```\nhttp example.com\n```\n的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("應該檢查不在程式碼區塊內的 http case rule 錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "HTTP" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 http example.com 的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
		expect(result[0].wrong).toBe("http");
		expect(result[0].correct).toEqual(["HTTP"]);
	});

	test("應該忽略程式碼區塊內包含 URL 的 http case rule 錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([{ term: "HTTP" }]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "1. 在瀏覽器中開啟 `http://localhost:3000`（或你設定的其他連接埠）";

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
		const text = "`錯誤` [錯誤](url) <http://錯誤> 這裡有錯誤";

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

	suite("超過兩個反引號內的文字應該被忽略 (inline code block)", async () => {
		// We support up to 6 backticks
		for (let i = 2; i <= 6; i++) {
			test(`超過 ${i} 個反引號內的文字應該被忽略 (inline code block)`, async () => {
				const backticks = "`".repeat(i);
				const text = `這是 ${backticks}javascript${backticks} 的文字`;
				const spellingDb = new MockSpellingDatabase([]);
				const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

				const determiner = new Determiner(spellingDb, caseDb);
				const result = await determiner.checkSpelling(text);
				expect(result).toHaveLength(0);
			});
		}
	});

	test("應該無視只有單邊的空反引號", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "test",
				correct: ["測試"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 `` 然後這裡有 test 錯誤";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(1);
		expect(result[0].wrong).toBe("test");
		expect(result[0].correct).toEqual(["測試"]);
	});

	test("網址不該被誤判為錯誤", async () => {
		const spellingDb = new MockSpellingDatabase([
			{
				wrong: "example",
				correct: ["Example"],
				type: "spelling_correction",
				traditionalOnly: false
			}
		]);
		const caseDb = new MockCaseDatabase([]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "這是 https://example.com 的文字";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	test("不應該處理網址的大小寫問題", async () => {
		const spellingDb = new MockSpellingDatabase([]);
		const caseDb = new MockCaseDatabase([
			{
				term: "Instagram"
			}
		]);

		const determiner = new Determiner(spellingDb, caseDb);
		const text = "[Instagram](https://instagram.com/em.tec.blog)";

		const result = await determiner.checkSpelling(text);
		expect(result).toHaveLength(0);
	});

	suite("URL 大小寫排除邏輯", () => {
		test("應該忽略 http:// URL 中的大小寫錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "Google" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "造訪 http://google.com/search 查詢";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("應該忽略 https:// URL 中的大小寫錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "Facebook" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "前往 https://facebook.com/profile";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("應該忽略 rtmp:// URL 中的大小寫錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "Example" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "前往 rtmp://example.com/stream";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("應該忽略相對路徑中的大小寫錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "Image" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "載入 ./image.png 檔案";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("應該忽略父目錄路徑中的大小寫錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "Config" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "讀取 ../config.json 設定";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("應該忽略絕對路徑中的大小寫錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "Asset" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 /asset/icon.svg 圖示";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("URL 外的文字仍應檢查大小寫", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 javascript 開發，參考 https://javascript.info";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(1);
			expect(result[0].wrong).toBe("javascript");
			expect(result[0].correct).toEqual(["JavaScript"]);
		});

		test("多個 URL 都應該被排除", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "Google" }, { term: "Facebook" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "造訪 https://google.com 和 http://facebook.com";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("URL 與 Markdown 連結混合時，URL 部分應被排除", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "Instagram" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "這是 [連結](https://instagram.com/user) 的文字";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});
	});

	suite("@ 開頭的詞排除邏輯", () => {
		test("應該忽略 @ 開頭的詞中的拼寫錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([
				{
					wrong: "test",
					correct: ["Test"],
					type: "spelling_correction",
					traditionalOnly: false
				}
			]);
			const caseDb = new MockCaseDatabase([]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "提到 @test_user 的使用者";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("應該忽略 @ 開頭的詞中的大小寫錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "標記 @javascript 開發者";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("@ 開頭的詞應該支援底線和數字", async () => {
			const spellingDb = new MockSpellingDatabase([
				{
					wrong: "user",
					correct: ["User"],
					type: "spelling_correction",
					traditionalOnly: false
				}
			]);
			const caseDb = new MockCaseDatabase([]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "提到 @user_123 和 @test_user";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("@ 開頭的詞外的文字仍應檢查", async () => {
			const spellingDb = new MockSpellingDatabase([
				{
					wrong: "user",
					correct: ["User"],
					type: "spelling_correction",
					traditionalOnly: false
				}
			]);
			const caseDb = new MockCaseDatabase([]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "提到 @user123 這裡有 user";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(1);
			expect(result[0].wrong).toBe("user");
		});

		test("多個 @ 開頭的詞都應該被排除", async () => {
			const spellingDb = new MockSpellingDatabase([
				{
					wrong: "user",
					correct: ["User"],
					type: "spelling_correction",
					traditionalOnly: false
				}
			]);
			const caseDb = new MockCaseDatabase([{ term: "JavaScript" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "提到 @user1 @user2 和 @admin";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("@ 開頭的詞與 URL 混合時都應被排除", async () => {
			const spellingDb = new MockSpellingDatabase([
				{
					wrong: "user",
					correct: ["User"],
					type: "spelling_correction",
					traditionalOnly: false
				}
			]);
			const caseDb = new MockCaseDatabase([{ term: "Google" }]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "提到 @user 造訪 https://google.com";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});
	});

	suite("caserules alternatives 功能", () => {
		test("應該接受 alternatives 中列出的有效大小寫形式", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "JavaScript",
					alternatives: ["JAVASCRIPT", "javascript"]
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 JavaScript, JAVASCRIPT, javascript 開發";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("應該標記不在 term 或 alternatives 中的大小寫形式為錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "JavaScript",
					alternatives: ["JAVASCRIPT", "javascript"]
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 JavaScript 和 JavaScrIPT 開發";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(1);
			expect(result[0].wrong).toBe("JavaScrIPT");
			expect(result[0].correct).toEqual(["JavaScript"]);
			expect(result[0].type).toBe("case");
		});

		test("當 alternatives 為空陣列時應該像沒有 alternatives 一樣運作", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "TypeScript",
					alternatives: []
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 TypeScript 和 typescript 開發";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(1);
			expect(result[0].wrong).toBe("typescript");
			expect(result[0].correct).toEqual(["TypeScript"]);
		});

		test("當 alternatives 為 null 時應該像沒有 alternatives 一樣運作", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "Python",
					alternatives: null
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 Python 和 python 開發";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(1);
			expect(result[0].wrong).toBe("python");
			expect(result[0].correct).toEqual(["Python"]);
		});

		test("當 alternatives 為 undefined 時應該像沒有 alternatives 一樣運作", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "React"
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 React 和 react 開發";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(1);
			expect(result[0].wrong).toBe("react");
			expect(result[0].correct).toEqual(["React"]);
		});

		test("應該支援多個 alternatives", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "API",
					alternatives: ["Api", "api", "APIs"]
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 API, Api, api, APIs 開發";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("多個 alternatives 中，不在清單中的應該被標記為錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "API",
					alternatives: ["Api", "api"]
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 API, Api, api, ApI 開發";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(1);
			expect(result[0].wrong).toBe("ApI");
			expect(result[0].correct).toEqual(["API"]);
		});

		test("應該忽略程式碼區塊內的 alternatives 大小寫", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "JavaScript",
					alternatives: ["javascript"]
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "這是 `JAVASCRIPT` 的程式碼";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(0);
		});

		test("應該檢查不在程式碼區塊內的 alternatives 大小寫錯誤", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "JavaScript",
					alternatives: ["javascript"]
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "這是 JAVASCRIPT 的文字";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(1);
			expect(result[0].wrong).toBe("JAVASCRIPT");
			expect(result[0].correct).toEqual(["JavaScript"]);
		});

		test("多個規則都應該正確處理各自的 alternatives", async () => {
			const spellingDb = new MockSpellingDatabase([]);
			const caseDb = new MockCaseDatabase([
				{
					term: "JavaScript",
					alternatives: ["javascript"]
				},
				{
					term: "TypeScript",
					alternatives: ["TypeScript"]
				}
			]);

			const determiner = new Determiner(spellingDb, caseDb);
			const text = "使用 JavaScript, javascript, TypeScript, typescript 開發";

			const result = await determiner.checkSpelling(text);
			expect(result).toHaveLength(1);
			expect(result[0].wrong).toBe("typescript");
			expect(result[0].correct).toEqual(["TypeScript"]);
		});
	});
});
