import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a dummy user without Clerk authentication
 */
export const createDummyUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
    });
  },
});

/**
 * Clear all dummy users (those with clerkId starting with "dummy_")
 */
export const clearDummyUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let deleted = 0;

    for (const user of users) {
      if (user.clerkId.startsWith("dummy_")) {
        // Delete all related data first
        // Thread memberships
        const memberships = await ctx.db
          .query("threadMembers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        for (const m of memberships) {
          await ctx.db.delete(m._id);
        }

        // Thread name consents
        const consents = await ctx.db
          .query("threadNameConsents")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        for (const c of consents) {
          await ctx.db.delete(c._id);
        }

        // Thread messages
        const messages = await ctx.db
          .query("threadMessages")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        for (const m of messages) {
          await ctx.db.delete(m._id);
        }

        // Space presence
        const presence = await ctx.db
          .query("spacePresence")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        for (const p of presence) {
          await ctx.db.delete(p._id);
        }

        // Delete the user
        await ctx.db.delete(user._id);
        deleted++;
      }
    }

    return { deleted };
  },
});

/**
 * Create a thread (internal mutation for seeding)
 */
export const internalCreateThread = internalMutation({
  args: {
    spaceId: v.id("spaces"),
    description: v.string(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdAt = args.createdAt ?? now;
    const lastActiveAt = args.lastActiveAt ?? createdAt;

    const threadId = await ctx.db.insert("spaceThreads", {
      spaceId: args.spaceId,
      description: args.description,
      createdBy: args.createdBy,
      createdAt,
      lastActiveAt,
    });

    // Auto-join the creator
    await ctx.db.insert("threadMembers", {
      threadId,
      userId: args.createdBy,
      joinedAt: createdAt,
    });

    return threadId;
  },
});

/**
 * Add a member to a thread (internal mutation for seeding)
 */
export const internalAddThreadMember = internalMutation({
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

    return await ctx.db.insert("threadMembers", {
      threadId: args.threadId,
      userId: args.userId,
      joinedAt: Date.now(),
    });
  },
});

/**
 * Clear all threads, thread members, and related data
 */
export const clearAllThreads = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete all thread messages
    const messages = await ctx.db.query("threadMessages").collect();
    for (const m of messages) {
      await ctx.db.delete(m._id);
    }

    // Delete all thread name consents
    const consents = await ctx.db.query("threadNameConsents").collect();
    for (const c of consents) {
      await ctx.db.delete(c._id);
    }

    // Delete all thread members
    const members = await ctx.db.query("threadMembers").collect();
    for (const m of members) {
      await ctx.db.delete(m._id);
    }

    // Delete all threads
    const threads = await ctx.db.query("spaceThreads").collect();
    for (const t of threads) {
      await ctx.db.delete(t._id);
    }

    return {
      messages: messages.length,
      consents: consents.length,
      members: members.length,
      threads: threads.length,
    };
  },
});
