import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const createSpace = mutation({
  args: {
    name: v.string(),
    tags: v.array(v.string()),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const spaceId = await ctx.db.insert("spaces", {
      name: args.name,
      tags: args.tags,
      color: args.color,
      tfidfVector: [],
      position: { x: 0, y: 0 },
      createdAt: Date.now(),
    });

    return spaceId;
  },
});

export const updatePosition = mutation({
  args: {
    spaceId: v.id("spaces"),
    position: v.object({ x: v.number(), y: v.number() }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.spaceId, { position: args.position });
  },
});

export const updateCluster = mutation({
  args: {
    spaceId: v.id("spaces"),
    clusterId: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.spaceId, { clusterId: args.clusterId });
  },
});

export const createLink = mutation({
  args: {
    spaceA: v.id("spaces"),
    spaceB: v.id("spaces"),
    similarity: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if link already exists
    const existingA = await ctx.db
      .query("spaceLinks")
      .withIndex("by_spaceA", (q) => q.eq("spaceA", args.spaceA))
      .filter((q) => q.eq(q.field("spaceB"), args.spaceB))
      .first();

    const existingB = await ctx.db
      .query("spaceLinks")
      .withIndex("by_spaceA", (q) => q.eq("spaceA", args.spaceB))
      .filter((q) => q.eq(q.field("spaceB"), args.spaceA))
      .first();

    if (existingA || existingB) {
      return null;
    }

    return await ctx.db.insert("spaceLinks", {
      spaceA: args.spaceA,
      spaceB: args.spaceB,
      similarity: args.similarity,
    });
  },
});

export const deleteAllLinks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const links = await ctx.db.query("spaceLinks").collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }
  },
});

export const updateTfidfVector = internalMutation({
  args: {
    spaceId: v.id("spaces"),
    vector: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.spaceId, { tfidfVector: args.vector });
  },
});

export const batchUpdatePositions = internalMutation({
  args: {
    updates: v.array(
      v.object({
        spaceId: v.id("spaces"),
        position: v.object({ x: v.number(), y: v.number() }),
        clusterId: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const patch: { position: { x: number; y: number }; clusterId?: number } = {
        position: update.position,
      };
      if (update.clusterId !== undefined) {
        patch.clusterId = update.clusterId;
      }
      await ctx.db.patch(update.spaceId, patch);
    }
  },
});

export const batchCreateLinks = internalMutation({
  args: {
    links: v.array(
      v.object({
        spaceA: v.id("spaces"),
        spaceB: v.id("spaces"),
        similarity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const link of args.links) {
      await ctx.db.insert("spaceLinks", link);
    }
  },
});

export const internalCreateSpace = internalMutation({
  args: {
    name: v.string(),
    tags: v.array(v.string()),
    color: v.string(),
    tfidfVector: v.array(v.number()),
    position: v.object({ x: v.number(), y: v.number() }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("spaces", {
      name: args.name,
      tags: args.tags,
      color: args.color,
      tfidfVector: args.tfidfVector,
      position: args.position,
      createdAt: Date.now(),
    });
  },
});

export const clearAllSpaces = internalMutation({
  args: {},
  handler: async (ctx) => {
    const spaces = await ctx.db.query("spaces").collect();
    for (const space of spaces) {
      await ctx.db.delete(space._id);
    }
    const links = await ctx.db.query("spaceLinks").collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }
  },
});
