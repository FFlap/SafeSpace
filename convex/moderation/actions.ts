"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { aiModerateContent } from "./moderate";

// Moderate a DM message (message already saved, delete if harmful)
export const moderateDmMessage = internalAction({
  args: {
    messageId: v.id("dmMessages"),
    conversationId: v.id("dmConversations"),
    senderId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await aiModerateContent(args.body);

    if (result === "SAFE") {
      // Message already saved, nothing to do
    } else if (result === "SELF_HARM") {
      // Message stays, add supportive response
      await ctx.runMutation(internal.moderation.mutations.saveDmSystemResponse, {
        conversationId: args.conversationId,
        senderId: args.senderId,
        responseType: "self_harm",
      });
    } else if (result === "SEXUAL" || result === "HARMFUL") {
      // Delete the disallowed message - client will detect and show warning
      await ctx.runMutation(internal.moderation.mutations.deleteDmMessage, {
        messageId: args.messageId,
      });
    }

    return { result };
  },
});

// Moderate a thread message (message already saved, delete if harmful)
export const moderateThreadMessage = internalAction({
  args: {
    messageId: v.id("threadMessages"),
    threadId: v.id("spaceThreads"),
    userId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await aiModerateContent(args.body);

    if (result === "SAFE") {
      // Message already saved, nothing to do
    } else if (result === "SELF_HARM") {
      // Message stays, add supportive response
      await ctx.runMutation(internal.moderation.mutations.saveThreadSystemResponse, {
        threadId: args.threadId,
        userId: args.userId,
        responseType: "self_harm",
      });
    } else if (result === "SEXUAL" || result === "HARMFUL") {
      // Delete the disallowed message - client will detect and show warning
      await ctx.runMutation(internal.moderation.mutations.deleteThreadMessage, {
        messageId: args.messageId,
      });
    }

    return { result };
  },
});
