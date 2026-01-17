import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - existing
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  // Bubble spaces - community spaces with similarity clustering
  spaces: defineTable({
    name: v.string(),
    tags: v.array(v.string()),
    color: v.string(),
    tfidfVector: v.array(v.number()),
    clusterId: v.optional(v.number()),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    createdAt: v.number(),
  })
    .index("by_cluster", ["clusterId"])
    .searchIndex("search_name", { searchField: "name" }),

  // Links between spaces based on similarity
  spaceLinks: defineTable({
    spaceA: v.id("spaces"),
    spaceB: v.id("spaces"),
    similarity: v.number(),
  })
    .index("by_spaceA", ["spaceA"])
    .index("by_spaceB", ["spaceB"])
    .index("by_similarity", ["similarity"]),

  // Threads within spaces for group discussions
  spaceThreads: defineTable({
    spaceId: v.id("spaces"),
    name: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_space", ["spaceId"])
    .index("by_last_active", ["lastActiveAt"]),

  // Thread membership tracking
  threadMembers: defineTable({
    threadId: v.id("spaceThreads"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_user", ["userId"])
    .index("by_thread_user", ["threadId", "userId"]),

  // Real-time presence in spaces
  spacePresence: defineTable({
    spaceId: v.id("spaces"),
    userId: v.id("users"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    currentThreadId: v.optional(v.id("spaceThreads")),
    lastSeen: v.number(),
  })
    .index("by_space", ["spaceId"])
    .index("by_user", ["userId"])
    .index("by_space_user", ["spaceId", "userId"]),

  // Configuration key-value store
  config: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
