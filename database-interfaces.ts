import type { ObjectId } from "mongoose";
import type { SpellingRule, CaseRule, SpellingRuleType } from "./models.ts";

/**
 * Interface for spelling database operations
 */
export interface ISpellingDatabase {
	/**
	 * Get all spelling rules from the database
	 *
	 * @returns The spelling rules in the database
	 */
	getRules(): Promise<SpellingRule[]>;

	/**
	 * Get all spelling rules from the database
	 * This is an alias for getRules() used by the web API
	 *
	 * @returns The spelling rules in the database
	 */
	getAllSpelling(): Promise<SpellingRule[]>;

	/**
	 * Get rules by type
	 *
	 * @param type The type of rules to get
	 * @returns The rules of the specified type
	 */
	getRulesByType(type: SpellingRuleType): Promise<SpellingRule[]>;

	/**
	 * Add a spelling rule to the database
	 *
	 * @param rule The rule to add
	 */
	addRule(rule: SpellingRule): Promise<void>;

	/**
	 * Remove a spelling rule from the database
	 *
	 * @param ruleId The ID of the rule to remove
	 */
	removeRule(ruleId: ObjectId): Promise<void>;

	/**
	 * Query rules according to "wrong" (fuzzy search) from the database
	 *
	 * @param query The query to search
	 * @param type Optional type to filter the results
	 * @returns The rules that match the query
	 */
	queryRules(query: string, type?: SpellingRuleType): Promise<SpellingRule[]>;

	/**
	 * Invalidate the spelling rules cache
	 */
	invalidateCache(): void;
}

/**
 * Interface for case database operations
 */
export interface ICaseDatabase {
	/**
	 * Get all case rules from the database
	 *
	 * @returns The case rules in the database
	 */
	getRules(): Promise<CaseRule[]>;

	/**
	 * Get all case rules from the database
	 * This is an alias for getRules() used by the web API
	 *
	 * @returns The case rules in the database
	 */
	getAllCases(): Promise<CaseRule[]>;

	/**
	 * Add a case rule to the database
	 *
	 * @param term The term to add as a case rule
	 * @param alternatives The alternatives to add as a case rule
	 */
	addRule(term: string, alternatives?: string[] | null): Promise<void>;

	/**
	 * Remove a case rule from the database
	 *
	 * @param ruleId The ID of the rule to remove
	 */
	removeRule(ruleId: ObjectId): Promise<void>;

	/**
	 * Query case rules by term (fuzzy search)
	 *
	 * @param query The query to search
	 * @returns The case rules that match the query
	 */
	queryRules(query: string): Promise<CaseRule[]>;

	/**
	 * Invalidate the case rules cache
	 */
	invalidateCache(): void;
}
