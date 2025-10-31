import mongoose, { type ObjectId } from "mongoose";
import type { ISpellingDatabase, ICaseDatabase } from "./database-interfaces.ts";
import type { SpellingRule, CaseRule, SpellingRuleType } from "./models.ts";

interface MockSpellingRule extends SpellingRule {
	_id: string;
}

interface MockCaseRule extends CaseRule {
	_id: string;
}

/**
 * Mock implementation of ISpellingDatabase for testing
 */
export class MockSpellingDatabase implements ISpellingDatabase {
	#rules: MockSpellingRule[];

	constructor(rules: SpellingRule[] = []) {
		this.#rules = rules.map(rule => ({ ...rule, _id: new mongoose.Types.ObjectId().toString() }));
	}

	async getRules(): Promise<SpellingRule[]> {
		return this.#rules;
	}

	async getAllSpelling(): Promise<SpellingRule[]> {
		return this.getRules();
	}

	async getRulesByType(type: SpellingRuleType): Promise<SpellingRule[]> {
		return this.#rules.filter(rule => rule.type === type);
	}

	async addRule(rule: SpellingRule): Promise<void> {
		this.#rules.push({ ...rule, _id: new mongoose.Types.ObjectId().toString() });
	}

	async removeRule(ruleId: ObjectId): Promise<void> {
		this.#rules = this.#rules.filter(rule => rule._id?.toString() !== ruleId.toString());
	}

	async queryRules(query: string, type?: SpellingRuleType): Promise<SpellingRule[]> {
		let filtered = this.#rules.filter(rule => rule.wrong.toLowerCase().includes(query.toLowerCase()));

		if (type) {
			filtered = filtered.filter(rule => rule.type === type);
		}

		return filtered;
	}

	invalidateCache(): void {
		// Mock implementation - no cache to invalidate
	}
}

/**
 * Mock implementation of ICaseDatabase for testing
 */
export class MockCaseDatabase implements ICaseDatabase {
	#rules: MockCaseRule[];

	constructor(rules: CaseRule[] = []) {
		this.#rules = rules.map(rule => ({ ...rule, _id: new mongoose.Types.ObjectId().toString() }));
	}

	async getRules(): Promise<CaseRule[]> {
		return this.#rules;
	}

	async getAllCases(): Promise<CaseRule[]> {
		return this.getRules();
	}

	async addRule(term: string): Promise<void> {
		this.#rules.push({ term, _id: new mongoose.Types.ObjectId().toString() });
	}

	async removeRule(ruleId: ObjectId): Promise<void> {
		this.#rules = this.#rules.filter(rule => rule._id?.toString() !== ruleId.toString());
	}

	async queryRules(query: string): Promise<CaseRule[]> {
		return this.#rules.filter(rule => rule.term.toLowerCase().includes(query.toLowerCase()));
	}

	invalidateCache(): void {
		// Mock implementation - no cache to invalidate
	}
}
