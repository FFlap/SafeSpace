"use node";

export type ModerationResult = "SAFE" | "SELF_HARM" | "HARMFUL" | "SEXUAL";

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

// Prefilter-only check (instant, heuristics only)
export function prefilterContent(content: string): ModerationResult | null {
  const normalized = normalizeForModeration(content);
  return moderateByHeuristics(normalized);
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

// AI-only moderation (no heuristics, for background checks)
export async function aiModerateContent(content: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY not set, defaulting to SAFE");
    return "SAFE";
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

export async function moderateContent(content: string): Promise<ModerationResult> {
  const normalized = normalizeForModeration(content);
  const heuristicResult = moderateByHeuristics(normalized);
  if (heuristicResult) return heuristicResult;

  return aiModerateContent(content);
}

