"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { anyApi } from "convex/server";
import { v } from "convex/values";
import { prefilterContent } from "../moderation/moderate";

const HARMFUL_WARNING =
  "Your message was blocked because it violates our community guidelines. Please keep conversations respectful and supportive of all community members.";

const SEXUAL_WARNING =
  "Your message was blocked because it contains sexual/NSFW content. Please keep conversations appropriate for all community members.";

export const sendThreadMessage = action({
  args: {
    threadId: v.id("spaceThreads"),
    userId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (!body) throw new Error("Message cannot be empty");

    // Run instant prefilter (heuristics only)
    const prefilterResult = prefilterContent(body);

    // If prefilter flags content, block immediately
    if (prefilterResult === "SEXUAL") {
      return { status: "blocked" as const, result: prefilterResult, warning: SEXUAL_WARNING };
    }
    if (prefilterResult === "HARMFUL") {
      return { status: "blocked" as const, result: prefilterResult, warning: HARMFUL_WARNING };
    }
    if (prefilterResult === "SELF_HARM") {
      // Save message immediately, add supportive response
      const messageId = await ctx.runMutation(anyApi.messages.mutations.sendThreadMessage, {
        threadId: args.threadId,
        userId: args.userId,
        body,
      });
      await ctx.runMutation(anyApi.moderation.mutations.saveThreadSystemResponse, {
        threadId: args.threadId,
        userId: args.userId,
        responseType: "self_harm",
      });
      // No background AI check needed - prefilter already classified
      return { status: "sent" as const, result: prefilterResult, messageId };
    }

    // Prefilter passed (null) - save message immediately
    const messageId = await ctx.runMutation(anyApi.messages.mutations.sendThreadMessage, {
      threadId: args.threadId,
      userId: args.userId,
      body,
    });

    // Schedule background AI moderation
    await ctx.scheduler.runAfter(0, internal.moderation.actions.moderateThreadMessage, {
      messageId,
      threadId: args.threadId,
      userId: args.userId,
      body,
    });

    return { status: "sent" as const, result: "SAFE" as const, messageId };
  },
});
