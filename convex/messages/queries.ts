import { query } from "../_generated/server";
import { v } from "convex/values";

export const listThreadMessages = query({
  args: {
    threadId: v.id("spaceThreads"),
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(200, args.limit ?? 80));
    const db = ctx.db as any;

    const messages = await db
      .query("threadMessages")
      .withIndex("by_thread", (q: any) => q.eq("threadId", args.threadId))
      .collect();

    const since = args.since ?? 0;
    const filtered = messages.filter((m: any) => m.createdAt >= since);
    const selected = filtered
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .reverse();

    const consents = await db
      .query("threadNameConsents")
      .withIndex("by_thread", (q: any) => q.eq("threadId", args.threadId))
      .collect();

    const consentedUserIds = new Set<string>(
      consents.filter((c: any) => c.shareName).map((c: any) => c.userId)
    );

    const uniqueUserIds = [...new Set<string>(selected.map((m: any) => m.userId as string))];
    const userIdsToFetch = uniqueUserIds.filter((id) => consentedUserIds.has(id));
    const users = await Promise.all(userIdsToFetch.map((id) => ctx.db.get(id as any)));

    const nameByUserId = new Map<string, string>();
    users.forEach((u) => {
      if (!u) return;
      const name = typeof (u as any).name === "string" ? ((u as any).name as string) : "";
      if (name.trim()) nameByUserId.set((u as any)._id, name.trim());
    });

    return selected.map((m: any) => ({
      ...m,
      displayName: nameByUserId.get(m.userId) ?? null,
    }));
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

export const getThreadNameConsent = query({
  args: { threadId: v.id("spaceThreads"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const existing = await db
      .query("threadNameConsents")
      .withIndex("by_thread_user", (q: any) =>
        q.eq("threadId", args.threadId).eq("userId", args.userId)
      )
      .first();

    return (existing?.shareName as boolean) ?? false;
  },
});
