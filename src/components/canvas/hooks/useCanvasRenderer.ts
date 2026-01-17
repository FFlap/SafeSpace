import { useEffect, useRef, useCallback } from "react";
import type { Camera } from "./useCamera";

interface PhysicsNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
}

export interface SpaceData {
  _id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  activeUserCount: number;
}

interface UseCanvasRendererOptions {
  camera: Camera;
  spaces: SpaceData[];
  onSpaceClick?: (spaceId: string) => void;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

function clamp255(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function mixWithWhite(
  rgb: { r: number; g: number; b: number },
  amount: number
): { r: number; g: number; b: number } {
  const a = Math.max(0, Math.min(1, amount));
  return {
    r: Math.round(rgb.r * (1 - a) + 255 * a),
    g: Math.round(rgb.g * (1 - a) + 255 * a),
    b: Math.round(rgb.b * (1 - a) + 255 * a),
  };
}

function mixWithBlack(
  rgb: { r: number; g: number; b: number },
  amount: number
): { r: number; g: number; b: number } {
  const a = Math.max(0, Math.min(1, amount));
  return {
    r: Math.round(rgb.r * (1 - a)),
    g: Math.round(rgb.g * (1 - a)),
    b: Math.round(rgb.b * (1 - a)),
  };
}

export function useCanvasRenderer({
  camera,
  spaces,
  onSpaceClick,
}: UseCanvasRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const physicsStateRef = useRef<Map<string, PhysicsNode>>(new Map());
  const lastTimeRef = useRef<number>(0);

  // Calculate bubble radius based on active user count
  const getBubbleRadius = useCallback((activeUserCount: number) => {
    return 70 + Math.sqrt(Math.max(1, activeUserCount)) * 22;
  }, []);

  // Sync physics state with spaces prop
  useEffect(() => {
    const currentState = physicsStateRef.current;
    const newIds = new Set(spaces.map((s) => s._id));

    // Remove old spaces
    for (const id of currentState.keys()) {
      if (!newIds.has(id)) {
        currentState.delete(id);
      }
    }

    // Add or update spaces
    spaces.forEach((space) => {
      const radius = getBubbleRadius(space.activeUserCount);
      if (!currentState.has(space._id)) {
        currentState.set(space._id, {
          x: space.position.x,
          y: space.position.y,
          vx: 0,
          vy: 0,
          targetX: space.position.x,
          targetY: space.position.y,
          radius,
        });
      } else {
        const node = currentState.get(space._id)!;
        node.targetX = space.position.x;
        node.targetY = space.position.y;
        node.radius = radius;
      }
    });
  }, [spaces, getBubbleRadius]);

  const updatePhysics = useCallback(() => {
    const state = physicsStateRef.current;
    const nodes = Array.from(state.values());
    const padding = 20;

    // Constants
    const attractionStrength = 0.02; // Pull to target
    const repulsionStrength = 0.8;   // Overlap push
    const damping = 0.95;            // Friction (increased)
    const maxVelocity = 2.0;         // Speed limit

    // 1. Apply forces
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Attraction to target
      const dx = node.targetX - node.x;
      const dy = node.targetY - node.y;
      node.vx += dx * attractionStrength;
      node.vy += dy * attractionStrength;

      // Repulsion from other nodes (Collision)
      for (let j = i + 1; j < nodes.length; j++) {
        const other = nodes[j];
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

        const minDist = node.radius + other.radius + padding;

        if (dist < minDist) {
          const overlap = minDist - dist;
          // Normalized vector
          const nx = dx / dist;
          const ny = dy / dist;

          // Force proportional to overlap
          const force = overlap * repulsionStrength;

          const fx = nx * force;
          const fy = ny * force;

          // Apply equal and opposite force
          node.vx -= fx;
          node.vy -= fy;
          other.vx += fx;
          other.vy += fy;
        }
      }
    }

    // 2. Update positions
    for (const node of nodes) {
      // Clamp velocity
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > maxVelocity) {
        node.vx = (node.vx / speed) * maxVelocity;
        node.vy = (node.vy / speed) * maxVelocity;
      }

      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
    }
  }, []);

  // Hit detection for bubbles
  const hitTest = useCallback(
    (screenX: number, screenY: number): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const centerX = dimensionsRef.current.width / 2;
      const centerY = dimensionsRef.current.height / 2;

      // Check spaces in reverse order (top-most first)
      for (let i = spaces.length - 1; i >= 0; i--) {
        const space = spaces[i];
        const node = physicsStateRef.current.get(space._id);
        const radius = node ? node.radius : getBubbleRadius(space.activeUserCount);
        const posX = node ? node.x : space.position.x;
        const posY = node ? node.y : space.position.y;

        // Transform space position to screen coordinates
        const sx = (posX - camera.x) * camera.zoom + centerX;
        const sy = (posY - camera.y) * camera.zoom + centerY;
        const sr = radius * camera.zoom;

        const dx = screenX - sx;
        const dy = screenY - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= sr) {
          return space._id;
        }
      }

      return null;
    },
    [spaces, camera, getBubbleRadius]
  );

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Run physics step
    updatePhysics();

    const width = dimensionsRef.current.width;
    const height = dimensionsRef.current.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background (white grid)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const minorSpacing = 80;
    const majorSpacing = minorSpacing * 5;
    const minorScreen = minorSpacing * camera.zoom;

    const leftWorld = camera.x - centerX / camera.zoom;
    const rightWorld = camera.x + centerX / camera.zoom;
    const topWorld = camera.y - centerY / camera.zoom;
    const bottomWorld = camera.y + centerY / camera.zoom;

    const drawGrid = (spacingWorld: number, strokeStyle: string) => {
      if (!Number.isFinite(spacingWorld) || spacingWorld <= 0) return;
      ctx.beginPath();

      const startX = Math.floor(leftWorld / spacingWorld) * spacingWorld;
      const endX = Math.ceil(rightWorld / spacingWorld) * spacingWorld;
      for (let x = startX; x <= endX; x += spacingWorld) {
        const sx = (x - camera.x) * camera.zoom + centerX;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
      }

      const startY = Math.floor(topWorld / spacingWorld) * spacingWorld;
      const endY = Math.ceil(bottomWorld / spacingWorld) * spacingWorld;
      for (let y = startY; y <= endY; y += spacingWorld) {
        const sy = (y - camera.y) * camera.zoom + centerY;
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
      }

      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const gridSpacing = minorScreen >= 18 ? minorSpacing : majorSpacing;
    drawGrid(gridSpacing, "rgba(15, 23, 42, 0.03)");

    // Draw bubbles
    for (const space of spaces) {
      const node = physicsStateRef.current.get(space._id);

      // Fallback if physics not initialized yet
      const radius = node ? node.radius : getBubbleRadius(space.activeUserCount);
      const x = node ? node.x : space.position.x;
      const y = node ? node.y : space.position.y;

      // Transform to screen coordinates
      const sx = (x - camera.x) * camera.zoom + centerX;
      const sy = (y - camera.y) * camera.zoom + centerY;
      const sr = radius * camera.zoom;

      // Skip if off-screen
      if (sx + sr < 0 || sx - sr > width || sy + sr < 0 || sy - sr > height) {
        continue;
      }

      // Draw bubble with radial gradient
      const rgb = hexToRgb(space.color);
      if (!rgb) continue;

      const calm = mixWithWhite(rgb, 0.92);
      const border = mixWithBlack(calm, 0.08);

      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.save();
      ctx.shadowColor = "rgba(92, 74, 66, 0.10)";
      ctx.shadowBlur = Math.max(6, Math.min(18, 12 * camera.zoom));
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(2, Math.min(10, 6 * camera.zoom));
      ctx.fillStyle = `rgb(${clamp255(calm.r)}, ${clamp255(calm.g)}, ${clamp255(calm.b)})`;
      ctx.fill();
      ctx.restore();

      // Draw border
      ctx.strokeStyle = `rgb(${clamp255(border.r)}, ${clamp255(border.g)}, ${clamp255(border.b)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw name label
      const fontSize = 14 * camera.zoom;

      // Skip text rendering if too small to read/visible
      if (fontSize > 4) {
        ctx.font = `600 ${fontSize}px "Quicksand", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.save();
        ctx.shadowColor = "rgba(253, 248, 245, 0.9)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "rgba(92, 74, 66, 0.9)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(space.name, sx, sy);
        ctx.restore();

        // Draw user count if > 0
        if (space.activeUserCount > 0) {
          const countFontSize = 11 * camera.zoom;
          ctx.font = `500 ${countFontSize}px "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.fillStyle = "rgba(92, 74, 66, 0.6)";
          ctx.fillText(`${space.activeUserCount} active`, sx, sy + fontSize);
        }
      }
    }
  }, [camera, spaces, getBubbleRadius, updatePhysics]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      dimensionsRef.current = { width: rect.width, height: rect.height };
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      render();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [render]);

  // Animation loop
  useEffect(() => {
    const animate = (time: number) => {
      lastTimeRef.current = time;
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  // Handle click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hitId = hitTest(x, y);
      if (hitId && onSpaceClick) {
        onSpaceClick(hitId);
      }
    },
    [hitTest, onSpaceClick]
  );

  return {
    canvasRef,
    handleClick,
    hitTest,
  };
}
