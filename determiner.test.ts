import { suite } from "vitest";
import { Determiner, type SpellingRule } from "./determiner.ts";
import { expect } from "vitest";
import { test } from "vitest";

suite("Determiner", () => {
    test("繁體中文規則應該套用在繁體中文上", () => {
        const rules: SpellingRule[] = [
            {
                wrong: "你好",
                correct: "Hello",
                caseSensitive: false,
                traditionalOnly: true,
            },
        ];

        const determiner = new Determiner(rules);
        const text = "繁體中文你好";

        const result = determiner.checkSpelling(text);
        expect(result).toHaveLength(1);
    });

    test("繁體中文規則應該套用在中性規則上", () => {
        const rules: SpellingRule[] = [
            {
                wrong: "你好",
                correct: "Hello",
                caseSensitive: false,
                traditionalOnly: true,
            },
        ];

        const determiner = new Determiner(rules);
        const text = "你好";

        const result = determiner.checkSpelling(text);
        expect(result).toHaveLength(1);
    });

    test("繁體中文規則不該套用在簡體中文上", () => {
        const rules: SpellingRule[] = [
            {
                wrong: "你好",
                correct: "Hello",
                caseSensitive: false,
                traditionalOnly: true,
            },
        ];

        const determiner = new Determiner(rules);
        const text = "简体中文你好";

        const result = determiner.checkSpelling(text);
        expect(result).toHaveLength(0);
    });

    test("非繁體中文規則應該套用在簡體中文上", () => {
        const rules: SpellingRule[] = [
            {
                wrong: "你好",
                correct: "Hello",
                caseSensitive: false,
                traditionalOnly: false,
            },
        ];

        const determiner = new Determiner(rules);
        const text = "简体中文你好";

        const result = determiner.checkSpelling(text);
        expect(result).toHaveLength(1);
    })
})
