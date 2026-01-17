"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";

interface SpaceSeed {
  name: string;
  tags: string[];
  color: string;
}

const SEED_SPACES: SpaceSeed[] = [
  // Mental Health Cluster
  {
    name: "Depression",
    tags: ["mental-health", "mood", "support", "therapy"],
    color: "#6366f1", // Indigo
  },
  {
    name: "Anxiety",
    tags: ["mental-health", "stress", "panic", "coping"],
    color: "#8b5cf6", // Purple
  },
  {
    name: "PTSD & Trauma",
    tags: ["mental-health", "trauma", "recovery", "healing"],
    color: "#a855f7", // Violet
  },
  {
    name: "Bipolar Support",
    tags: ["mental-health", "mood", "bipolar", "stability"],
    color: "#7c3aed", // Purple deeper
  },
  // LGBTQ+ Cluster
  {
    name: "LGBTQ+ Community",
    tags: ["identity", "lgbtq", "pride", "acceptance"],
    color: "#ec4899", // Pink
  },
  {
    name: "Trans & Non-Binary",
    tags: ["identity", "lgbtq", "gender", "transition"],
    color: "#f472b6", // Pink lighter
  },
  {
    name: "Queer People of Color",
    tags: ["identity", "lgbtq", "poc", "intersectionality"],
    color: "#db2777", // Pink darker
  },
  // POC Identity Cluster
  {
    name: "People of Color",
    tags: ["identity", "poc", "race", "community"],
    color: "#f59e0b", // Amber
  },
  {
    name: "Black Lives Matter",
    tags: ["identity", "poc", "black", "activism"],
    color: "#d97706", // Amber darker
  },
  {
    name: "Asian American",
    tags: ["identity", "poc", "asian", "culture"],
    color: "#fbbf24", // Yellow
  },
  {
    name: "Latinx Community",
    tags: ["identity", "poc", "latinx", "heritage"],
    color: "#f97316", // Orange
  },
  // Women & STEM Cluster
  {
    name: "Women in Tech",
    tags: ["women", "stem", "tech", "career"],
    color: "#06b6d4", // Cyan
  },
  {
    name: "Women's Health",
    tags: ["women", "health", "reproductive", "wellness"],
    color: "#14b8a6", // Teal
  },
  {
    name: "STEM Students",
    tags: ["stem", "education", "science", "career"],
    color: "#0ea5e9", // Sky
  },
  {
    name: "First-Gen Students",
    tags: ["education", "first-gen", "support", "college"],
    color: "#22d3ee", // Cyan lighter
  },
];

export const seedSpaces = action({
  args: {},
  handler: async (ctx) => {
    // Clear existing spaces and links
    await ctx.runMutation(internal.spaces.mutations.clearAllSpaces);

    // Create all spaces
    for (const space of SEED_SPACES) {
      await ctx.runMutation(internal.spaces.mutations.internalCreateSpace, {
        name: space.name,
        tags: space.tags,
        color: space.color,
        tfidfVector: [],
        position: { x: 0, y: 0 },
      });
    }

    // Compute TF-IDF, similarities, clusters, and layout
    // First compute TF-IDF vectors
    await ctx.runAction(internal.spaces.actions.computeTfidfVectors);

    // Then compute similarities and links
    await ctx.runAction(internal.spaces.actions.computeAllSimilarities, {});

    // Compute clusters
    await ctx.runAction(internal.clustering.actions.computeClusters);

    // Finally compute layout
    await ctx.runAction(internal.clustering.actions.computeLayout);

    return { success: true, count: SEED_SPACES.length };
  },
});
