import { query } from "../_generated/server";
import { v } from "convex/values";

export const getSpacePresence = query({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const thirtySecondsAgo = now - 30000;

    const presence = await ctx.db
      .query("spacePresence")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .filter((q) => q.gt(q.field("lastSeen"), thirtySecondsAgo))
      .collect();

    // Get user details for each presence
    const presenceWithUsers = await Promise.all(
      presence.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
          user,
        };
      })
    );

    return presenceWithUsers.filter((p) => p.user !== null);
  },
});

export const listActivePresenceCounts = query({
  args: {},
  handler: async (ctx) => {
    const thirtySecondsAgo = Date.now() - 30000;

    const presence = await ctx.db
      .query("spacePresence")
      .filter((q) => q.gt(q.field("lastSeen"), thirtySecondsAgo))
      .collect();

    const counts = new Map<string, number>();
    for (const p of presence) {
      counts.set(p.spaceId, (counts.get(p.spaceId) ?? 0) + 1);
    }

    return Array.from(counts, ([spaceId, activeUserCount]) => ({
      spaceId,
      activeUserCount,
    }));
  },
});

export const getMyPresence = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("spacePresence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});
