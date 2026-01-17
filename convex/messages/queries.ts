import { query } from "../_generated/server";
import { v } from "convex/values";

export const listThreadMessages = query({
  args: {
    threadId: v.id("spaceThreads"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(200, args.limit ?? 80));
    const db = ctx.db as any;

    const messages = await db
      .query("threadMessages")
      .withIndex("by_thread", (q: any) => q.eq("threadId", args.threadId))
      .collect();

    return messages
      .sort((a: any, b: any) => a.createdAt - b.createdAt)
      .slice(-limit);
  },
});

export const listThreadChatters = query({
  args: { threadId: v.id("spaceThreads") },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const messages = await db
      .query("threadMessages")
      .withIndex("by_thread", (q: any) => q.eq("threadId", args.threadId))
      .collect();

    const chatters = new Set<string>();
    for (const message of messages) {
      chatters.add(message.userId);
    }
    return [...chatters];
  },
});

