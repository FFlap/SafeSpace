import { internalQuery } from "../_generated/server";

export const getAllSpaces = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spaces").collect();
  },
});

export const getAllLinks = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spaceLinks").collect();
  },
});

export const getAllSpacesForLayout = internalQuery({
  args: {},
  handler: async (ctx) => {
    const spaces = await ctx.db.query("spaces").collect();
    const now = Date.now();
    const thirtySecondsAgo = now - 30000;

    const spacesWithPresence = await Promise.all(
      spaces.map(async (space) => {
        // We need an accurate count for the radius
        const presence = await ctx.db
          .query("spacePresence")
          .withIndex("by_space", (q) => q.eq("spaceId", space._id))
          .collect();

        const activeCount = presence.filter(
          (p) => p.lastSeen > thirtySecondsAgo
        ).length;

        return {
          ...space,
          activeUserCount: activeCount,
        };
      })
    );

    return spacesWithPresence;
  },
});
