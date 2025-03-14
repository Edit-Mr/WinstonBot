import mongoose, { type ObjectId } from "mongoose";

/**
 * 一般拼字檢查規則（proper 和 warn）
 */
export interface SpellingRule {
  type: "proper" | "warn";
  wrong: string;
  correct: string[];
  traditionalOnly: boolean;
}

export type SpellingRuleType = SpellingRule["type"];

export const spellingRule = new mongoose.Schema<SpellingRule>({
  type: {
    type: String,
    enum: ["proper", "warn"],
    required: true
  },
  wrong: { type: String, required: true, unique: true },
  correct: {
    type: [String],
    required: true,
    validate: {
      validator: function (v: string[]) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'correct must be a non-empty array of strings'
    }
  },
  traditionalOnly: { type: Boolean, default: false }
});

export const SpellingRuleModel = mongoose.model<SpellingRule>('SpellingRule', spellingRule);

/**
 * 大小寫規則
 */
export interface CaseRule {
  term: string;  // 正確的大小寫形式
}

export const caseRule = new mongoose.Schema<CaseRule>({
  term: {
    type: String,
    required: true,
    unique: true
  }
});

export const CaseRuleModel = mongoose.model<CaseRule>('CaseRule', caseRule);
