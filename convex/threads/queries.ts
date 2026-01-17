import { query } from "../_generated/server";
import { v } from "convex/values";

export const listThreads = query({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    const threads = await ctx.db
      .query("spaceThreads")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    // Get member counts for each thread
    const threadsWithCounts = await Promise.all(
      threads.map(async (thread) => {
        const members = await ctx.db
          .query("threadMembers")
          .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
          .collect();

        return {
          ...thread,
          memberCount: members.length,
        };
      })
    );

    // Sort by lastActiveAt descending
    return threadsWithCounts.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  },
});

export const getMyMemberships = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("threadMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get thread details for each membership
    const threadsWithDetails = await Promise.all(
      memberships.map(async (membership) => {
        const thread = await ctx.db.get(membership.threadId);
        return {
          membership,
          thread,
        };
      })
    );

    return threadsWithDetails.filter((t) => t.thread !== null);
  },
});

export const getThreadMembers = query({
  args: { threadId: v.id("spaceThreads") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("threadMembers")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    // Get user details for each member
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user,
        };
      })
    );

    return membersWithUsers.filter((m) => m.user !== null);
  },
});

export const isThreadMember = query({
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

    return membership !== null;
  },
});

export const getThread = query({
  args: { threadId: v.id("spaceThreads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.threadId);
  },
});
