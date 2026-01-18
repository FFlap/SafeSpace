import { mutation } from "../_generated/server";

/**
 * Migration to convert old `name` field to `description` for existing threads.
 * Run this once, then it can be removed.
 */
export const migrateThreadsNameToDescription = mutation({
  args: {},
  handler: async (ctx) => {
    const threads = await ctx.db.query("spaceThreads").collect();
    let migratedCount = 0;

    for (const thread of threads) {
      // If thread has name but no description, migrate it
      if (thread.name && !thread.description) {
        await ctx.db.patch(thread._id, {
          description: thread.name,
        });
        migratedCount++;
      }
    }

    return { migratedCount, totalThreads: threads.length };
  },
});
