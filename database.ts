import mongoose, { type ObjectId } from "mongoose";
import type { SpellingRule } from "./models.ts";

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
        await this.#collection.deleteOne(ruleId);
        this.invalidateCache();
    }

    /**
     * Query a rule according to "wrong" (fuzzy search) from the database
     *
     * @param query The query to search
     * @returns The rules that match the query
     */
    async queryRules(query: string): Promise<SpellingRule[]> {
        return await this.#collection.find({
            wrong: { $regex: query, $options: "i" },
        }).toArray();
    }

    /**
     * Invalidate the cache
     */
    invalidateCache(): void {
        this.#rules = null;
    }
}
