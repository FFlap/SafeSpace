import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createThread = mutation({
  args: {
    spaceId: v.id("spaces"),
    name: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the thread
    const threadId = await ctx.db.insert("spaceThreads", {
      spaceId: args.spaceId,
      name: args.name,
      createdBy: args.userId,
      createdAt: now,
      lastActiveAt: now,
    });

    // Auto-join the creator
    await ctx.db.insert("threadMembers", {
      threadId,
      userId: args.userId,
      joinedAt: now,
    });

    return threadId;
  },
});

export const joinThread = mutation({
  args: {
    threadId: v.id("spaceThreads"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already a member
    const existing = await ctx.db
      .query("threadMembers")
      .withIndex("by_thread_user", (q) =>
        q.eq("threadId", args.threadId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();

    // Add membership
    const membershipId = await ctx.db.insert("threadMembers", {
      threadId: args.threadId,
      userId: args.userId,
      joinedAt: now,
    });

    // Update thread lastActiveAt
    await ctx.db.patch(args.threadId, { lastActiveAt: now });

    return membershipId;
  },
});

export const leaveThread = mutation({
  args: {
    threadId: v.id("spaceThreads"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("threadMembers")
      .withIndex("by_thread_user", (q) =>
        q.eq("threadId", args.threadId).eq("userId", args.userId)
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);
    }
  },
});

export const touchThread = mutation({
  args: { threadId: v.id("spaceThreads") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, { lastActiveAt: Date.now() });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("spaceThreads") },
  handler: async (ctx, args) => {
    // Delete all memberships first
    const members = await ctx.db
      .query("threadMembers")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete the thread
    await ctx.db.delete(args.threadId);
  },
});
