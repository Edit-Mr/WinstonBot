import mongoose from "mongoose";

/**
 * 原始的拼寫檢查輸入
 */
export interface SpellingRule extends mongoose.Document {
  wrong: string;
  correct: string;
  caseSensitive: boolean;
  traditionalOnly?: boolean;
}

export const spellingRule = new mongoose.Schema<SpellingRule>({
    wrong: { type: String, required: true },
    correct: { type: String, required: true },
    caseSensitive: { type: Boolean, required: true },
    traditionalOnly: { type: Boolean, default: false },
});

export const SpellingRuleModel = mongoose.model<SpellingRule>('SpellingRule', spellingRule);
