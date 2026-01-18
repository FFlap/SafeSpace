import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Helpline resources for self-harm content
const SELF_HARM_RESPONSE = `If you or someone you know is struggling, help is available:

• 988 Suicide & Crisis Lifeline - Call or text 988
• Crisis Text Line - Text HOME to 741741
• SAMHSA Helpline - 1-800-662-4357
• Trevor Project (LGBTQ+) - 1-866-488-7386

You are not alone. These services are free, confidential, and available 24/7.`;

// Internal mutation to delete a DM message (for harmful content)
export const deleteDmMessage = internalMutation({
  args: {
    messageId: v.id("dmMessages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});

// Internal mutation to delete a thread message (for harmful content)
export const deleteThreadMessage = internalMutation({
  args: {
    messageId: v.id("threadMessages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});

// Internal mutation to save a system response for DM
export const saveDmSystemResponse = internalMutation({
  args: {
    conversationId: v.id("dmConversations"),
    senderId: v.id("users"),
    responseType: v.literal("self_harm"),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const now = Date.now();
    const body = SELF_HARM_RESPONSE;

    return await db.insert("dmMessages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      body,
      createdAt: now,
      isSystemMessage: true,
    });
  },
});

// Internal mutation to save a system response for thread
export const saveThreadSystemResponse = internalMutation({
  args: {
    threadId: v.id("spaceThreads"),
    userId: v.id("users"),
    responseType: v.literal("self_harm"),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const now = Date.now();
    const body = SELF_HARM_RESPONSE;

    const messageId = await db.insert("threadMessages", {
      threadId: args.threadId,
      userId: args.userId,
      body,
      createdAt: now,
      isSystemMessage: true,
    });

    // Update thread last active time
    await ctx.db.patch(args.threadId, { lastActiveAt: now });

    return messageId;
  },
});
