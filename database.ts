import mongoose, { type ObjectId } from "mongoose";
import type { SpellingRule, CaseRule, SpellingRuleType } from "./models.ts";
import type { ISpellingDatabase, ICaseDatabase } from "./database-interfaces.ts";

export class SpellingDatabase implements ISpellingDatabase {
	#rules: SpellingRule[] | null;
	#collection: mongoose.Collection<SpellingRule>;

	constructor(collection: mongoose.Collection<SpellingRule>) {
		this.#collection = collection;
		this.#rules = null;
	}

	static async fromConnectionString(connectionString: string): Promise<SpellingDatabase> {
		const db = await mongoose.connect(connectionString);
		const collection = db.connection.collection<SpellingRule>("spelling_rules");
		return new SpellingDatabase(collection);
	}

	/**
	 * Get all spelling rules from the database
	 *
	 * @returns The spelling rules in the database
	 */
	async getRules(): Promise<SpellingRule[]> {
		if (!this.#rules) {
			this.#rules = await this.#collection.find().toArray();
		}
		return this.#rules;
	}

	/**
	 * Get all spelling rules from the database
	 * This is an alias for getRules() used by the web API
	 *
	 * @returns The spelling rules in the database
	 */
	async getAllSpelling(): Promise<SpellingRule[]> {
		return this.getRules();
	}

	/**
	 * Get rules by type
	 *
	 * @param type The type of rules to get
	 * @returns The rules of the specified type
	 */
	async getRulesByType(type: SpellingRuleType): Promise<SpellingRule[]> {
		return await this.#collection.find({ type }).toArray();
	}

	/**
	 * Add a spelling rule to the database
	 *
	 * @param rule The rule to add
	 */
	async addRule(rule: SpellingRule): Promise<void> {
		await this.#collection.insertOne(rule);
		this.invalidateCache();
	}

	/**
	 * Remove a spelling rule from the database
	 *
	 * @param ruleId The ID of the rule to remove
	 */
	async removeRule(ruleId: ObjectId): Promise<void> {
		await this.#collection.deleteOne({ _id: ruleId });
		this.invalidateCache();
	}

	/**
	 * Query rules according to "wrong" (fuzzy search) from the database
	 *
	 * @param query The query to search
	 * @param type Optional type to filter the results
	 * @returns The rules that match the query
	 */
	async queryRules(query: string, type?: SpellingRuleType): Promise<SpellingRule[]> {
		const searchQuery: mongoose.mongo.Filter<SpellingRule> = {
			wrong: { $regex: query, $options: "i" }
		};

		if (type) {
			searchQuery.type = type;
		}

		return await this.#collection.find(searchQuery).toArray();
	}

	/**
	 * Invalidate the spelling rules cache
	 */
	invalidateCache(): void {
		this.#rules = null;
	}
}

export class CaseDatabase implements ICaseDatabase {
	#rules: CaseRule[] | null;
	#collection: mongoose.Collection<CaseRule>;

	constructor(collection: mongoose.Collection<CaseRule>) {
		this.#collection = collection;
		this.#rules = null;
	}

	static async fromConnectionString(connectionString: string): Promise<CaseDatabase> {
		const db = await mongoose.connect(connectionString);
		const collection = db.connection.collection<CaseRule>("case_rules");
		return new CaseDatabase(collection);
	}

	/**
	 * Get all case rules from the database
	 *
	 * @returns The case rules in the database
	 */
	async getRules(): Promise<CaseRule[]> {
		if (!this.#rules) {
			this.#rules = await this.#collection.find().toArray();
		}
		return this.#rules;
	}

	/**
	 * Get all case rules from the database
	 * This is an alias for getRules() used by the web API
	 *
	 * @returns The case rules in the database
	 */
	async getAllCases(): Promise<CaseRule[]> {
		return this.getRules();
	}

	/**
	 * Add a case rule to the database
	 *
	 * @param term The term to add as a case rule
	 * @param alternatives The alternatives to add as a case rule
	 */
	async addRule(term: string, alternatives?: string[] | null): Promise<void> {
		await this.#collection.insertOne({ term, alternatives });
		this.invalidateCache();
	}

	/**
	 * Remove a case rule from the database
	 *
	 * @param ruleId The ID of the rule to remove
	 */
	async removeRule(ruleId: ObjectId): Promise<void> {
		await this.#collection.deleteOne({ _id: ruleId });
		this.invalidateCache();
	}

	/**
	 * Query case rules by term (fuzzy search)
	 *
	 * @param query The query to search
	 * @returns The case rules that match the query
	 */
	async queryRules(query: string): Promise<CaseRule[]> {
		return await this.#collection
			.find({
				term: { $regex: query, $options: "i" }
			})
			.toArray();
	}

	/**
	 * Invalidate the case rules cache
	 */
	invalidateCache(): void {
		this.#rules = null;
	}
}
