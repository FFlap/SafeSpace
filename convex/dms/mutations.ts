import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export const requestDm = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.fromUserId === args.toUserId) {
      throw new Error("Cannot message yourself");
    }

    const db = ctx.db as any;
    const [userA, userB] = orderedPair(args.fromUserId, args.toUserId);

    const existingConversation = await db
      .query("dmConversations")
      .withIndex("by_userA_userB", (q: any) => q.eq("userA", userA).eq("userB", userB))
      .first();

    if (existingConversation) {
      return { conversationId: existingConversation._id, requestId: null };
    }

    const existingOutgoing = await db
      .query("dmRequests")
      .withIndex("by_from_to", (q: any) =>
        q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
      )
      .first();

    if (existingOutgoing && existingOutgoing.status === "pending") {
      return { conversationId: null, requestId: existingOutgoing._id };
    }

    const existingIncoming = await db
      .query("dmRequests")
      .withIndex("by_from_to", (q: any) =>
        q.eq("fromUserId", args.toUserId).eq("toUserId", args.fromUserId)
      )
      .first();

    if (existingIncoming && existingIncoming.status === "pending") {
      // Mirror request already exists in the opposite direction.
      return { conversationId: null, requestId: existingIncoming._id };
    }

    const requestId = await db.insert("dmRequests", {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      status: "pending",
      createdAt: Date.now(),
    });

    return { conversationId: null, requestId };
  },
});

export const respondToDmRequest = mutation({
  args: {
    requestId: v.id("dmRequests"),
    userId: v.id("users"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    if ((request as any).toUserId !== args.userId) {
      throw new Error("Not allowed to respond to this request");
    }

    if ((request as any).status !== "pending") {
      return { conversationId: (request as any).conversationId ?? null };
    }

    const now = Date.now();

    if (!args.accept) {
      await ctx.db.patch(args.requestId, { status: "declined", respondedAt: now });
      return { conversationId: null };
    }

    const [userA, userB] = orderedPair((request as any).fromUserId, (request as any).toUserId);

    let conversation = await db
      .query("dmConversations")
      .withIndex("by_userA_userB", (q: any) => q.eq("userA", userA).eq("userB", userB))
      .first();

    if (!conversation) {
      const conversationId = await db.insert("dmConversations", {
        userA,
        userB,
        createdAt: now,
        acceptedAt: now,
      });
      conversation = { _id: conversationId };
    }

    await ctx.db.patch(args.requestId, {
      status: "accepted",
      respondedAt: now,
      conversationId: conversation._id,
    });

    return { conversationId: conversation._id };
  },
});

export const sendDmMessage = internalMutation({
  args: {
    conversationId: v.id("dmConversations"),
    userId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (!body) throw new Error("Message cannot be empty");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const isParticipant =
      (conversation as any).userA === args.userId || (conversation as any).userB === args.userId;
    if (!isParticipant) throw new Error("Not a participant in this conversation");

    // Save message immediately for optimistic UI
    const db = ctx.db as any;
    const now = Date.now();
    const messageId = await db.insert("dmMessages", {
      conversationId: args.conversationId,
      senderId: args.userId,
      body,
      createdAt: now,
      isSystemMessage: false,
    });

    return messageId;
  },
});

export const setDmNameConsent = mutation({
  args: {
    conversationId: v.id("dmConversations"),
    userId: v.id("users"),
    shareName: v.boolean(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const isParticipant =
      (conversation as any).userA === args.userId || (conversation as any).userB === args.userId;
    if (!isParticipant) throw new Error("Not a participant in this conversation");

    const db = ctx.db as any;
    const now = Date.now();

    const existing = await db
      .query("dmNameConsents")
      .withIndex("by_conversation_user", (q: any) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { shareName: args.shareName, updatedAt: now });
      return existing._id;
    }

    return await db.insert("dmNameConsents", {
      conversationId: args.conversationId,
      userId: args.userId,
      shareName: args.shareName,
      updatedAt: now,
    });
  },
});
