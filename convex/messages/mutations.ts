import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const sendThreadMessage = mutation({
  args: {
    threadId: v.id("spaceThreads"),
    userId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (!body) {
      throw new Error("Message cannot be empty");
    }

    const now = Date.now();
    const db = ctx.db as any;

    const membership = await db
      .query("threadMembers")
      .withIndex("by_thread_user", (q: any) =>
        q.eq("threadId", args.threadId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new Error("Must join the thread to send messages");
    }

    const messageId = await db.insert("threadMessages", {
      threadId: args.threadId,
      userId: args.userId,
      body,
      createdAt: now,
    });

    await ctx.db.patch(args.threadId, { lastActiveAt: now });

    return messageId;
  },
});

export const setThreadNameConsent = mutation({
  args: {
    threadId: v.id("spaceThreads"),
    userId: v.id("users"),
    shareName: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const db = ctx.db as any;

    const existing = await db
      .query("threadNameConsents")
      .withIndex("by_thread_user", (q: any) =>
        q.eq("threadId", args.threadId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { shareName: args.shareName, updatedAt: now });
      return existing._id;
    }

    return await db.insert("threadNameConsents", {
      threadId: args.threadId,
      userId: args.userId,
      shareName: args.shareName,
      updatedAt: now,
    });
  },
});
