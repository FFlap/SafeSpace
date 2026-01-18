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

export const listSpaces = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spaces").collect();
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
