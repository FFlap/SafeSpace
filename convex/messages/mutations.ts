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

