"use node";

import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import natural from "natural";

const TfIdf = natural.TfIdf;

// Compute TF-IDF vector for a document
function computeTfidfForDoc(
  tfidf: natural.TfIdf,
  docIndex: number,
  allTerms: string[]
): number[] {
  const vector: number[] = [];
  for (const term of allTerms) {
    vector.push(tfidf.tfidf(term, docIndex));
  }
  return vector;
}

// Compute cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const computeTfidfVectors = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; count: number }> => {
    // Get all spaces
    const spaces = await ctx.runQuery(internal.spaces.internalQueries.getAllSpaces);

    if (spaces.length === 0) return { success: true, count: 0 };

    // Create TF-IDF instance
    const tfidf = new TfIdf();

    // Add documents (name + tags combined)
    for (const space of spaces) {
      const document = `${space.name} ${space.tags.join(" ")}`;
      tfidf.addDocument(document);
    }

    // Collect all unique terms
    const allTermsSet = new Set<string>();
    for (let i = 0; i < spaces.length; i++) {
      tfidf.listTerms(i).forEach((item) => {
        allTermsSet.add(item.term);
      });
    }
    const allTerms = Array.from(allTermsSet);

    // Compute vectors for each space
    for (let i = 0; i < spaces.length; i++) {
      const vector = computeTfidfForDoc(tfidf, i, allTerms);
      await ctx.runMutation(internal.spaces.mutations.updateTfidfVector, {
        spaceId: spaces[i]._id,
        vector,
      });
    }

    return { success: true, count: spaces.length };
  },
});

export const computeAllSimilarities = internalAction({
  args: { threshold: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ success: boolean; links: number }> => {
    const similarityThreshold = args.threshold ?? 0.3;

    // Get all spaces with their vectors
    const spaces = await ctx.runQuery(internal.spaces.internalQueries.getAllSpaces);

    if (spaces.length < 2) return { success: true, links: 0 };

    // Delete existing links
    await ctx.runMutation(internal.spaces.mutations.deleteAllLinks);

    // Compute pairwise similarities
    const links: { spaceA: string; spaceB: string; similarity: number }[] = [];

    for (let i = 0; i < spaces.length; i++) {
      for (let j = i + 1; j < spaces.length; j++) {
        const similarity = cosineSimilarity(
          spaces[i].tfidfVector,
          spaces[j].tfidfVector
        );

        if (similarity >= similarityThreshold) {
          links.push({
            spaceA: spaces[i]._id,
            spaceB: spaces[j]._id,
            similarity,
          });
        }
      }
    }

    // Batch create links
    if (links.length > 0) {
      // Split into batches of 50 to avoid hitting limits
      const batchSize = 50;
      for (let i = 0; i < links.length; i += batchSize) {
        const batch = links.slice(i, i + batchSize);
        await ctx.runMutation(internal.spaces.mutations.batchCreateLinks, {
          links: batch as any,
        });
      }
    }

    return { success: true, links: links.length };
  },
});

export const checkSimilarSpaceExists = internalAction({
  args: {
    name: v.string(),
    tags: v.array(v.string()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const similarityThreshold = args.threshold ?? 0.5;

    const spaces = await ctx.runQuery(internal.spaces.internalQueries.getAllSpaces);
    if (spaces.length === 0) return { exists: false, similarSpaces: [] };

    // Create TF-IDF with existing spaces + new space
    const tfidf = new TfIdf();

    for (const space of spaces) {
      const document = `${space.name} ${space.tags.join(" ")}`;
      tfidf.addDocument(document);
    }

    // Add new space as last document
    const newDocument = `${args.name} ${args.tags.join(" ")}`;
    tfidf.addDocument(newDocument);

    // Get all terms
    const allTermsSet = new Set<string>();
    for (let i = 0; i <= spaces.length; i++) {
      tfidf.listTerms(i).forEach((item) => {
        allTermsSet.add(item.term);
      });
    }
    const allTerms = Array.from(allTermsSet);

    // Compute vector for new space
    const newVector = computeTfidfForDoc(tfidf, spaces.length, allTerms);

    // Check similarities with existing spaces
    const similarSpaces: { spaceId: string; name: string; similarity: number }[] =
      [];

    for (let i = 0; i < spaces.length; i++) {
      const existingVector = computeTfidfForDoc(tfidf, i, allTerms);
      const similarity = cosineSimilarity(newVector, existingVector);

      if (similarity >= similarityThreshold) {
        similarSpaces.push({
          spaceId: spaces[i]._id,
          name: spaces[i].name,
          similarity,
        });
      }
    }

    return {
      exists: similarSpaces.length > 0,
      similarSpaces: similarSpaces.sort((a, b) => b.similarity - a.similarity),
    };
  },
});

export const createSpaceAndRecluster = action({
  args: {
    name: v.string(),
    tags: v.array(v.string()),
    color: v.string(),
  },
  handler: async (ctx, args): Promise<{ spaceId: string }> => {
    const spaces = await ctx.runQuery(internal.spaces.internalQueries.getAllSpaces);
    const normalized = args.name.trim().toLowerCase();
    const existing = spaces.find(
      (space: { _id: string; name: string }) => space.name.trim().toLowerCase() === normalized
    );

    if (existing) {
      return { spaceId: existing._id };
    }

    const spaceId = await ctx.runMutation(internal.spaces.mutations.internalCreateSpace, {
      name: args.name,
      tags: args.tags,
      color: args.color,
      tfidfVector: [],
      position: { x: 0, y: 0 },
    });

    await ctx.runAction(internal.spaces.actions.computeTfidfVectors);
    await ctx.runAction(internal.spaces.actions.computeAllSimilarities, {});
    await ctx.runAction(internal.clustering.actions.computeClusters);
    await ctx.runAction(internal.clustering.actions.computeLayout);

    return { spaceId };
  },
});
