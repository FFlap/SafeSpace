"use node";

import { action } from "../_generated/server";
import { anyApi } from "convex/server";
import { v } from "convex/values";
import { moderateContent } from "../moderation/moderate";

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

    const result = await moderateContent(body);

    if (result === "SAFE" || result === "SELF_HARM") {
      const messageId = await ctx.runMutation(anyApi.messages.mutations.sendThreadMessage, {
        threadId: args.threadId,
        userId: args.userId,
        body,
      });

      if (result === "SELF_HARM") {
        await ctx.runMutation(anyApi.moderation.mutations.saveThreadSystemResponse, {
          threadId: args.threadId,
          userId: args.userId,
          responseType: "self_harm",
        });
      }

      return { status: "sent" as const, result, messageId };
    }

    return {
      status: "blocked" as const,
      result,
      warning: result === "SEXUAL" ? SEXUAL_WARNING : HARMFUL_WARNING,
    };
  },
});

