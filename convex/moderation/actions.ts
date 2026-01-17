"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

type ModerationResult = "SAFE" | "SELF_HARM" | "HARMFUL" | "SEXUAL";

const MODERATION_PROMPT = `You are a content moderation system. Analyze the following message and classify it into exactly ONE of these categories:

1. SELF_HARM - Message contains suicide ideation, self-harm mentions, expressions of severe hopelessness, or cries for help related to mental health crises (about the speaker). Do NOT use for encouraging someone else to self-harm; that is HARMFUL.

2. SEXUAL - Message contains sexual content (including pornography, nudity, explicit sexual descriptions, or sexual solicitation).

3. HARMFUL - Message contains racial slurs, homophobic slurs, direct threats of violence, hate speech, severe harassment, or encouragement of self-harm (e.g., "kys", "kill yourself").

4. SAFE - Normal conversation that doesn't fall into the above categories.

Respond with ONLY the category name (SELF_HARM, SEXUAL, HARMFUL, or SAFE). Nothing else.

Message to analyze:
`;

const SEXUAL_CONTENT_PATTERNS: RegExp[] = [
  /\bsex(?:ual|ually|y)?\b/i,
  /\bnsfw\b/i,
  /\bporn(?:ography|ographic)?\b/i,
  /\b(nude|nudes|nudity|naked)\b/i,
  /\bonlyfans\b/i,
  /\bxxx\b/i,
  /\bsext(?:ing)?\b/i,
  /\bhook\s*up\b/i,
  /\bstrip(?:per|ping)?\b/i,
];

const SELF_HARM_HARASSMENT_PATTERNS: RegExp[] = [
  /\bkys\b/i,
  /\bkill\s*yourself\b/i,
  /\bgo\s+die\b/i,
  /\bunalive\s+yourself\b/i,
  /\bend\s+your\s+life\b/i,
];

const END_IT_ALL_PATTERN = /\bend\s+it\s+all\b/i;
const FIRST_PERSON_CONTEXT_PATTERN =
  /\b(i|me|my|mine|myself|im|i['’]m|ive|i['’]ve)\b/i;
const SECOND_PERSON_CONTEXT_PATTERN = /\b(you|your|yours|yourself)\b/i;

function normalizeForModeration(content: string): string {
  return content.normalize("NFKC");
}

function looksSexual(normalized: string): boolean {
  return SEXUAL_CONTENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function looksSelfHarmHarassment(normalized: string): boolean {
  return SELF_HARM_HARASSMENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function moderateByHeuristics(normalized: string): ModerationResult | null {
  if (looksSexual(normalized)) return "SEXUAL";
  if (looksSelfHarmHarassment(normalized)) return "HARMFUL";
  if (END_IT_ALL_PATTERN.test(normalized)) {
    if (SECOND_PERSON_CONTEXT_PATTERN.test(normalized)) return "HARMFUL";
    if (FIRST_PERSON_CONTEXT_PATTERN.test(normalized)) return "SELF_HARM";
    return "HARMFUL";
  }
  return null;
}

function parseModerationResult(raw: unknown): ModerationResult | null {
  if (typeof raw !== "string") return null;
  const upper = raw.toUpperCase();
  if (/\bSELF[\s_-]?HARM\b/.test(upper)) return "SELF_HARM";
  if (/\bSEXUAL\b/.test(upper)) return "SEXUAL";
  if (/\bHARMFUL\b/.test(upper)) return "HARMFUL";
  if (/\bSAFE\b/.test(upper)) return "SAFE";
  return null;
}

async function moderateContent(content: string): Promise<ModerationResult> {
  const normalized = normalizeForModeration(content);
  const heuristicResult = moderateByHeuristics(normalized);
  if (heuristicResult) return heuristicResult;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY not set, defaulting to SAFE");
    return "SAFE";
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hackthebias.app",
        "X-Title": "HackTheBias Safe Space",
      },
      body: JSON.stringify({
        model: "xiaomi/mimo-v2-flash:free",
        messages: [
          {
            role: "user",
            content: MODERATION_PROMPT + content,
          },
        ],
        max_tokens: 20,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.error("OpenRouter API error:", response.status, await response.text());
      return "SAFE";
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    const result = parseModerationResult(raw);

    if (result === "SELF_HARM") return "SELF_HARM";
    if (result === "SEXUAL") return "SEXUAL";
    if (result === "HARMFUL") return "HARMFUL";
    return "SAFE";
  } catch (error) {
    console.error("Moderation API error:", error);
    return "SAFE";
  }
}

// Moderate a DM message (message already saved, delete if harmful)
export const moderateDmMessage = internalAction({
  args: {
    messageId: v.id("dmMessages"),
    conversationId: v.id("dmConversations"),
    senderId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await moderateContent(args.body);

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
      // Delete the disallowed message (client is responsible for showing any warning).
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
    const result = await moderateContent(args.body);

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
      // Delete the disallowed message (client is responsible for showing any warning).
      await ctx.runMutation(internal.moderation.mutations.deleteThreadMessage, {
        messageId: args.messageId,
      });
    }

    return { result };
  },
});
