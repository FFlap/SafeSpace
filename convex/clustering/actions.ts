"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";

interface SpacePosition {
  spaceId: string;
  position: { x: number; y: number };
  clusterId: number;
}

export const computeClusters = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; clusters: number }> => {
    const spaces = await ctx.runQuery(internal.spaces.internalQueries.getAllSpaces);
    const links = await ctx.runQuery(internal.spaces.internalQueries.getAllLinks);

    if (spaces.length === 0) return { success: true, clusters: 0 };

    // Build graph
    const graph = new Graph();

    // Add nodes
    for (const space of spaces) {
      graph.addNode(space._id);
    }

    // Add edges with similarity as weight
    for (const link of links) {
      if (graph.hasNode(link.spaceA) && graph.hasNode(link.spaceB)) {
        graph.addEdge(link.spaceA, link.spaceB, { weight: link.similarity });
      }
    }

    // Run Louvain community detection
    const communities = louvain(graph, { resolution: 1 });

    // Get unique cluster IDs
    const clusterIds = new Set(Object.values(communities));

    // Update spaces with cluster IDs
    const updates: SpacePosition[] = [];

    for (const space of spaces) {
      const clusterId = communities[space._id] ?? 0;
      updates.push({
        spaceId: space._id,
        position: space.position,
        clusterId,
      });
    }

    // Batch update
    if (updates.length > 0) {
      await ctx.runMutation(internal.spaces.mutations.batchUpdatePositions, {
        updates: updates as any,
      });
    }

    return { success: true, clusters: clusterIds.size };
  },
});

export const computeLayout = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean }> => {
    const spaces = await ctx.runQuery(
      internal.spaces.internalQueries.getAllSpacesForLayout
    );
    const links = await ctx.runQuery(internal.spaces.internalQueries.getAllLinks);
    const presence = await ctx.runQuery(internal.presence.internalQueries.getAllPresence);

    if (spaces.length === 0) return { success: true };

    // Group spaces by cluster
    const clusterMap = new Map<number, typeof spaces>();
    for (const space of spaces) {
      const clusterId = space.clusterId ?? 0;
      if (!clusterMap.has(clusterId)) {
        clusterMap.set(clusterId, []);
      }
      clusterMap.get(clusterId)!.push(space);
    }

    // Build link map for force calculation
    const linkMap = new Map<string, { target: string; weight: number }[]>();
    for (const link of links) {
      if (!linkMap.has(link.spaceA)) linkMap.set(link.spaceA, []);
      if (!linkMap.has(link.spaceB)) linkMap.set(link.spaceB, []);
      linkMap.get(link.spaceA)!.push({ target: link.spaceB, weight: link.similarity });
      linkMap.get(link.spaceB)!.push({ target: link.spaceA, weight: link.similarity });
    }

    // Compute cluster centers in a circle
    const clusters = Array.from(clusterMap.keys());
    const clusterCenters = new Map<number, { x: number; y: number }>();
    const centerRadius = 500;

    for (let i = 0; i < clusters.length; i++) {
      const angle = (2 * Math.PI * i) / clusters.length;
      clusterCenters.set(clusters[i], {
        x: Math.cos(angle) * centerRadius,
        y: Math.sin(angle) * centerRadius,
      });
    }

    const now = Date.now();
    const activeThreshold = now - 30000;
    const activeCounts = new Map<string, number>();
    for (const p of presence) {
      if (p.lastSeen <= activeThreshold) continue;
      activeCounts.set(p.spaceId, (activeCounts.get(p.spaceId) ?? 0) + 1);
    }

    const baseBubbleRadius = 70;
    const bubbleScale = 22;
    const bubbleRadii = new Map<string, number>();
    for (const space of spaces) {
      const activeUserCount = activeCounts.get(space._id) ?? 0;
      bubbleRadii.set(
        space._id,
        baseBubbleRadius + Math.sqrt(Math.max(1, activeUserCount)) * bubbleScale
      );
    }

    // Initialize positions near cluster centers
    const positions = new Map<string, { x: number; y: number }>();

    for (const [clusterId, clusterSpaces] of clusterMap.entries()) {
      const center = clusterCenters.get(clusterId)!;
      const avgRadius =
        clusterSpaces.reduce(
          (sum, space) => sum + (bubbleRadii.get(space._id) ?? baseBubbleRadius),
          0
        ) / clusterSpaces.length;

      for (let i = 0; i < clusterSpaces.length; i++) {
        // Spread within cluster
        const clusterAngle = (2 * Math.PI * i) / clusterSpaces.length;
        const clusterRadius = Math.min(
          300,
          Math.max(140, avgRadius * 1.4 + clusterSpaces.length * 18)
        );

        positions.set(clusterSpaces[i]._id, {
          x: center.x + Math.cos(clusterAngle) * clusterRadius,
          y: center.y + Math.sin(clusterAngle) * clusterRadius,
        });
      }
    }

    // Run simple force-directed simulation
    const iterations = 160;
    const repulsion = 6500;
    const collisionPadding = 36;
    const collisionStrength = 0.8;
    const attraction = 0.01;
    const damping = 0.9;
    const padding = 20; // Extra space between bubbles

    const getBubbleRadius = (activeUserCount: number) => {
      // Must match frontend logic in useCanvasRenderer.ts
      return 70 + Math.sqrt(Math.max(1, activeUserCount)) * 22;
    };

    const velocities = new Map<string, { vx: number; vy: number }>();
    for (const space of spaces) {
      velocities.set(space._id, { vx: 0, vy: 0 });
    }

    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion between all nodes
      // Repulsion between all nodes + Collision handling
      for (let i = 0; i < spaces.length; i++) {
        for (let j = i + 1; j < spaces.length; j++) {
          const posI = positions.get(spaces[i]._id)!;
          const posJ = positions.get(spaces[j]._id)!;

          const dx = posJ.x - posI.x;
          const dy = posJ.y - posI.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const radiusI = bubbleRadii.get(spaces[i]._id) ?? baseBubbleRadius;
          const radiusJ = bubbleRadii.get(spaces[j]._id) ?? baseBubbleRadius;
          const minDistance = radiusI + radiusJ + collisionPadding;

          // Standard repulsion
          const force = repulsion / (dist * dist);
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;

          // Collision detection
          const radiusI = getBubbleRadius(spaces[i].activeUserCount);
          const radiusJ = getBubbleRadius(spaces[j].activeUserCount);
          const minDist = radiusI + radiusJ + padding;

          if (dist < minDist) {
            // Stronger repulsion for overlap
            const overlap = minDist - dist;
            const collisionForce = overlap * 2; // Spring constant for collision
            fx += (dx / dist) * collisionForce;
            fy += (dy / dist) * collisionForce;
          }

          const velI = velocities.get(spaces[i]._id)!;
          const velJ = velocities.get(spaces[j]._id)!;

          velI.vx -= fx;
          velI.vy -= fy;
          velJ.vx += fx;
          velJ.vy += fy;

          if (dist < minDistance) {
            const overlap = minDistance - dist;
            const push = overlap * collisionStrength;
            const pushX = (dx / dist) * push;
            const pushY = (dy / dist) * push;

            velI.vx -= pushX;
            velI.vy -= pushY;
            velJ.vx += pushX;
            velJ.vy += pushY;
          }
        }
      }

      // Attraction along edges
      for (const [spaceId, neighbors] of linkMap.entries()) {
        const posA = positions.get(spaceId);
        if (!posA) continue;

        for (const { target, weight } of neighbors) {
          const posB = positions.get(target);
          if (!posB) continue;

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = dist * attraction * weight;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          const vel = velocities.get(spaceId)!;
          vel.vx += fx;
          vel.vy += fy;
        }
      }

      // Pull toward cluster center
      for (const space of spaces) {
        const clusterId = space.clusterId ?? 0;
        const center = clusterCenters.get(clusterId)!;
        const pos = positions.get(space._id)!;
        const vel = velocities.get(space._id)!;

        const dx = center.x - pos.x;
        const dy = center.y - pos.y;

        vel.vx += dx * 0.001;
        vel.vy += dy * 0.001;
      }

      // Apply velocities
      for (const space of spaces) {
        const pos = positions.get(space._id)!;
        const vel = velocities.get(space._id)!;

        pos.x += vel.vx;
        pos.y += vel.vy;

        vel.vx *= damping;
        vel.vy *= damping;
      }
    }

    // Final hard collision resolution pass
    // Run a few iterations to strictly separate overlapping circles
    for (let iter = 0; iter < 20; iter++) {
      let moved = false;
      for (let i = 0; i < spaces.length; i++) {
        for (let j = i + 1; j < spaces.length; j++) {
          const posI = positions.get(spaces[i]._id)!;
          const posJ = positions.get(spaces[j]._id)!;

          const dx = posJ.x - posI.x;
          const dy = posJ.y - posI.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

          const radiusI = getBubbleRadius(spaces[i].activeUserCount);
          const radiusJ = getBubbleRadius(spaces[j].activeUserCount);
          const minDist = radiusI + radiusJ + padding;

          if (dist < minDist) {
            const overlap = minDist - dist;
            const moveX = (dx / dist) * overlap * 0.5;
            const moveY = (dy / dist) * overlap * 0.5;

            posI.x -= moveX;
            posI.y -= moveY;
            posJ.x += moveX;
            posJ.y += moveY;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }

    // Build updates
    const updates: SpacePosition[] = spaces.map((space) => ({
      spaceId: space._id,
      position: positions.get(space._id)!,
      clusterId: space.clusterId ?? 0,
    }));

    // Batch update positions
    await ctx.runMutation(internal.spaces.mutations.batchUpdatePositions, {
      updates: updates as any,
    });

    return { success: true };
  },
});
