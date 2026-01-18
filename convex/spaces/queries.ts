import { query } from "../_generated/server";
import { v } from "convex/values";

export const listSpaces = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spaces").collect();
  },
});

export const listAllSpaces = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spaces").collect();
  },
});

export const getSpace = query({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.spaceId);
  },
});

export const listSpacesWithPresence = query({
  args: {},
  handler: async (ctx) => {
    const spaces = await ctx.db.query("spaces").collect();
    const now = Date.now();
    const thirtySecondsAgo = now - 30000;

    const spacesWithCounts = await Promise.all(
      spaces.map(async (space) => {
        const presence = await ctx.db
          .query("spacePresence")
          .withIndex("by_space", (q) => q.eq("spaceId", space._id))
          .collect();

        const activeUsers = presence.filter((p) => p.lastSeen > thirtySecondsAgo);

        return {
          ...space,
          activeUserCount: activeUsers.length,
        };
      })
    );

    return spacesWithCounts;
  },
});

export const getSpaceLinks = query({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    const linksA = await ctx.db
      .query("spaceLinks")
      .withIndex("by_spaceA", (q) => q.eq("spaceA", args.spaceId))
      .collect();

    const linksB = await ctx.db
      .query("spaceLinks")
      .withIndex("by_spaceB", (q) => q.eq("spaceB", args.spaceId))
      .collect();

    return [...linksA, ...linksB];
  },
});

export const getAllSpaceLinks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spaceLinks").collect();
  },
});

export const searchSpaces = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return await ctx.db.query("spaces").collect();
    }

    return await ctx.db
      .query("spaces")
      .withSearchIndex("search_name", (q) => q.search("name", args.searchTerm))
      .collect();
  },
});
