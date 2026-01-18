import { query } from "../_generated/server";
import { v } from "convex/values";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export const listIncomingDmRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const requests = await db
      .query("dmRequests")
      .withIndex("by_to_status", (q: any) =>
        q.eq("toUserId", args.userId).eq("status", "pending")
      )
      .collect();

    return requests.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const listOutgoingDmRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const requests = await db
      .query("dmRequests")
      .withIndex("by_from_status", (q: any) =>
        q.eq("fromUserId", args.userId).eq("status", "pending")
      )
      .collect();

    return requests.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const getDmConversationForUsers = query({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const [userA, userB] = orderedPair(args.userId, args.otherUserId);
    const conversation = await db
      .query("dmConversations")
      .withIndex("by_userA_userB", (q: any) => q.eq("userA", userA).eq("userB", userB))
      .first();
    return conversation?._id ?? null;
  },
});

export const listMyDmConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const a = await db
      .query("dmConversations")
      .withIndex("by_userA", (q: any) => q.eq("userA", args.userId))
      .collect();
    const b = await db
      .query("dmConversations")
      .withIndex("by_userB", (q: any) => q.eq("userB", args.userId))
      .collect();

    const all = [...a, ...b].sort((x: any, y: any) => y.acceptedAt - x.acceptedAt);
    return all.map((c: any) => ({
      ...c,
      otherUserId: c.userA === args.userId ? c.userB : c.userA,
    }));
  },
});

export const listDmMessages = query({
  args: {
    conversationId: v.id("dmConversations"),
    userId: v.id("users"),
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

    const isParticipant =
      (conversation as any).userA === args.userId || (conversation as any).userB === args.userId;
    if (!isParticipant) {
      throw new Error("Not a participant in this conversation");
    }

    const limit = Math.max(1, Math.min(200, args.limit ?? 80));
    const since = args.since ?? 0;

    const messages = await db
      .query("dmMessages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .collect();

    const filtered = messages.filter((m: any) => m.createdAt >= since);
    const selected = filtered
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .reverse();

    const consents = await db
      .query("dmNameConsents")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .collect();

    const consentedUserIds = new Set<string>(
      consents.filter((c: any) => c.shareName).map((c: any) => c.userId)
    );

    const uniqueUserIds = [
      ...new Set<string>(selected.map((m: any) => m.senderId as string)),
    ];
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
      displayName: m.isSystemMessage
        ? "Safe Space AI"
        : (nameByUserId.get(m.senderId) ?? null),
      isSystemMessage: m.isSystemMessage ?? false,
    }));
  },
});

export const getDmNameConsent = query({
  args: { conversationId: v.id("dmConversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return false;

    const isParticipant =
      (conversation as any).userA === args.userId || (conversation as any).userB === args.userId;
    if (!isParticipant) throw new Error("Not a participant in this conversation");

    const db = ctx.db as any;
    const existing = await db
      .query("dmNameConsents")
      .withIndex("by_conversation_user", (q: any) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();

    return (existing?.shareName as boolean) ?? false;
  },
});
