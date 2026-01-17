import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updatePresence = mutation({
  args: {
    spaceId: v.id("spaces"),
    userId: v.id("users"),
    position: v.object({ x: v.number(), y: v.number() }),
    currentThreadId: v.optional(v.id("spaceThreads")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already has presence in this space
    const existing = await ctx.db
      .query("spacePresence")
      .withIndex("by_space_user", (q) =>
        q.eq("spaceId", args.spaceId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        position: args.position,
        currentThreadId: args.currentThreadId,
        lastSeen: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("spacePresence", {
        spaceId: args.spaceId,
        userId: args.userId,
        position: args.position,
        currentThreadId: args.currentThreadId,
        lastSeen: now,
      });
    }
  },
});

export const leaveSpace = mutation({
  args: {
    spaceId: v.id("spaces"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("spacePresence")
      .withIndex("by_space_user", (q) =>
        q.eq("spaceId", args.spaceId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const clearUserPresence = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allPresence = await ctx.db
      .query("spacePresence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const presence of allPresence) {
      await ctx.db.delete(presence._id);
    }
  },
});
