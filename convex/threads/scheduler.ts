import { internalMutation } from "../_generated/server";

export const cleanupInactiveThreads = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Find threads that haven't been active in 24 hours
    const inactiveThreads = await ctx.db
      .query("spaceThreads")
      .withIndex("by_last_active")
      .filter((q) => q.lt(q.field("lastActiveAt"), twentyFourHoursAgo))
      .collect();

    let deletedCount = 0;

    for (const thread of inactiveThreads) {
      // Delete all memberships
      const members = await ctx.db
        .query("threadMembers")
        .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
        .collect();

      for (const member of members) {
        await ctx.db.delete(member._id);
      }

      // Delete the thread
      await ctx.db.delete(thread._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});
