"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
  SEED_SPACES,
  DUMMY_USERS,
  getThreadTemplatesForCategory,
} from "./dummyData";

interface SpaceSeed {
  name: string;
  tags: string[];
  color: string;
}

const BASIC_SEED_SPACES: SpaceSeed[] = [
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

/**
 * Basic seed action - creates 14 spaces with TF-IDF and clustering
 */
export const seedSpaces = action({
  args: {},
  handler: async (ctx) => {
    // Clear existing spaces and links
    await ctx.runMutation(internal.spaces.mutations.clearAllSpaces);

    // Create all spaces
    for (const space of BASIC_SEED_SPACES) {
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

    return { success: true, count: BASIC_SEED_SPACES.length };
  },
});

/**
 * Helper function to get random elements from an array
 */
function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Generate a random timestamp within a range
 */
function randomTimestamp(minDaysAgo: number, maxDaysAgo: number): number {
  const now = Date.now();
  const minMs = minDaysAgo * 24 * 60 * 60 * 1000;
  const maxMs = maxDaysAgo * 24 * 60 * 60 * 1000;
  const randomMs = minMs + Math.random() * (maxMs - minMs);
  return now - randomMs;
}

/**
 * Full seed action - creates 100 spaces with 10 threads each and random members
 */
export const seedFullData = action({
  args: {},
  handler: async (ctx) => {
    console.log("Starting full data seed...");

    // Step 1: Clear existing data
    console.log("Clearing existing data...");
    await ctx.runMutation(internal.seed.mutations.clearAllThreads);
    await ctx.runMutation(internal.seed.mutations.clearDummyUsers);
    await ctx.runMutation(internal.spaces.mutations.clearAllSpaces);

    // Step 2: Create dummy users
    console.log("Creating dummy users...");
    const userIds: Id<"users">[] = [];
    for (const user of DUMMY_USERS) {
      const userId = await ctx.runMutation(
        internal.seed.mutations.createDummyUser,
        {
          clerkId: user.clerkId,
          email: user.email,
          name: user.name,
        }
      );
      userIds.push(userId);
    }
    console.log(`Created ${userIds.length} dummy users`);

    // Step 3: Create 100 spaces
    console.log("Creating 100 spaces...");
    const spaceIds: { id: Id<"spaces">; category: string }[] = [];
    for (const space of SEED_SPACES) {
      const spaceId = await ctx.runMutation(
        internal.spaces.mutations.internalCreateSpace,
        {
          name: space.name,
          tags: space.tags,
          color: space.color,
          tfidfVector: [],
          position: { x: 0, y: 0 },
        }
      );
      spaceIds.push({ id: spaceId, category: space.category });
    }
    console.log(`Created ${spaceIds.length} spaces`);

    // Step 4: Create 10 threads per space
    console.log("Creating threads...");
    let totalThreads = 0;
    let totalMembers = 0;

    for (const space of spaceIds) {
      const templates = getThreadTemplatesForCategory(space.category);

      for (const template of templates) {
        // Pick a random user to be the creator
        const creatorIndex = Math.floor(Math.random() * userIds.length);
        const creatorId = userIds[creatorIndex];

        // Generate random timestamps - thread created 1-60 days ago
        const createdAt = randomTimestamp(1, 60);
        // Last active between creation time and now (0 days ago to days since creation)
        const daysSinceCreation = (Date.now() - createdAt) / (24 * 60 * 60 * 1000);
        const lastActiveAt = randomTimestamp(0, Math.max(0.1, daysSinceCreation));

        // Create the thread
        const threadId = await ctx.runMutation(
          internal.seed.mutations.internalCreateThread,
          {
            spaceId: space.id,
            description: template.description,
            createdBy: creatorId,
            createdAt,
            lastActiveAt,
          }
        );
        totalThreads++;

        // Add 1-5 random additional members (excluding creator)
        const otherUsers = userIds.filter((_, i) => i !== creatorIndex);
        const memberCount = Math.floor(Math.random() * 5) + 1; // 1-5 members
        const randomMembers = getRandomElements(otherUsers, memberCount);

        for (const memberId of randomMembers) {
          await ctx.runMutation(internal.seed.mutations.internalAddThreadMember, {
            threadId,
            userId: memberId,
          });
          totalMembers++;
        }
      }
    }
    console.log(`Created ${totalThreads} threads with ${totalMembers} additional members`);

    // Step 5: Compute TF-IDF, similarities, clusters, and layout
    console.log("Computing TF-IDF vectors...");
    await ctx.runAction(internal.spaces.actions.computeTfidfVectors);

    console.log("Computing similarities...");
    await ctx.runAction(internal.spaces.actions.computeAllSimilarities, {});

    console.log("Computing clusters...");
    await ctx.runAction(internal.clustering.actions.computeClusters);

    console.log("Computing layout...");
    await ctx.runAction(internal.clustering.actions.computeLayout);

    console.log("Seed complete!");
    return {
      success: true,
      spaces: spaceIds.length,
      threads: totalThreads,
      additionalMembers: totalMembers,
      users: userIds.length,
    };
  },
});
