import mongoose, { type ObjectId } from "mongoose";
import type { SpellingRule, SpellingRuleType } from "./models.ts";

export class SpellingCheckDatabase {
    #rules: SpellingRule[] | null;
    #collection: mongoose.Collection<SpellingRule>;

    constructor(collection: mongoose.Collection<SpellingRule>) {
        this.#collection = collection;
        this.#rules = null;
    }

    static async fromConnectionString(connectionString: string): Promise<SpellingCheckDatabase> {
        const db = await mongoose.connect(connectionString);
        const collection = db.connection.collection<SpellingRule>("spelling_rules");

        return new SpellingCheckDatabase(collection);
    }

    /**
     * Get all rules from the database
     *
     * @returns The rules in the database
     */
    async getRules(): Promise<SpellingRule[]> {
        // check if the rules have been loaded
        if (!this.#rules) {
            this.#rules = await this.#collection.find().toArray();
        }

        return this.#rules;
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
     * Add a rule to the database
     *
     * @param rule The rule to add
     */
    async addRule(rule: SpellingRule): Promise<void> {
        await this.#collection.insertOne(rule);
        this.invalidateCache();
    }

    /**
     * Remove a rule from the database
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
     * Invalidate the cache
     */
    invalidateCache(): void {
        this.#rules = null;
    }
}
