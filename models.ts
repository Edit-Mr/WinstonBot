import mongoose from "mongoose";

/**
 * 拼字檢查規則的類型
 */
export const spellingRuleTypes = {
  case: "case",  // 大小寫規則
  proper: "proper",  // 一般糾正規則
  warn: "warn",  // 提醒規則
} as const;

export type SpellingRuleType = typeof spellingRuleTypes[keyof typeof spellingRuleTypes];

/**
 * 拼字檢查規則
 */
export interface SpellingRule extends mongoose.Document {
    type: SpellingRuleType,
    wrong: string;
    correct: string[];
    traditionalOnly: boolean;
}

export const spellingRule = new mongoose.Schema<SpellingRule>({
    type: { 
        type: String,
        enum: spellingRuleTypes,
        required: true 
    },
    wrong: { type: String, required: true },
    correct: { 
        type: [String],
        required: true,
        validate: {
            validator: function(v: string[]) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'correct must be a non-empty array of strings'
        }
    },
    traditionalOnly: { type: Boolean, default: false }
});

export const SpellingRuleModel = mongoose.model<SpellingRule>('SpellingRule', spellingRule);
