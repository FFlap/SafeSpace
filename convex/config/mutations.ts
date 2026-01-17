import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const setSimilarityThreshold = mutation({
  args: { threshold: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", "similarityThreshold"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.threshold });
    } else {
      await ctx.db.insert("config", {
        key: "similarityThreshold",
        value: args.threshold,
      });
    }
  },
});

export const getSimilarityThreshold = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", "similarityThreshold"))
      .first();

    return (config?.value as number) ?? 0.3;
  },
});

export const setConfig = mutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("config", {
        key: args.key,
        value: args.value,
      });
    }
  },
});

export const getConfig = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    return config?.value ?? null;
  },
});
