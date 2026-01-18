import { useEffect, useRef, useCallback } from "react";
import type { Camera } from "./useCamera";

export interface SpaceData {
  _id: string;
  name: string;
  color: string;
  clusterId?: number;
  position: { x: number; y: number };
  activeUserCount: number;
}

interface UseCanvasRendererOptions {
  camera: Camera;
  spaces: SpaceData[];
  onSpaceClick?: (spaceId: string) => void;
  hoveredSpaceId?: string | null;
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

function mixColors(
  base: { r: number; g: number; b: number },
  blend: { r: number; g: number; b: number },
  blendAmount: number
): { r: number; g: number; b: number } {
  const a = Math.max(0, Math.min(1, blendAmount));
  return {
    r: Math.round(base.r * (1 - a) + blend.r * a),
    g: Math.round(base.g * (1 - a) + blend.g * a),
    b: Math.round(base.b * (1 - a) + blend.b * a),
  };
}

function getClusterPaletteColor(clusterId?: number): string | null {
  if (clusterId === undefined || clusterId === null) return null;
  const palette = [
    "#8bb6ff",
    "#8ad6c5",
    "#f2b7c3",
    "#f4c58d",
    "#c6b3f0",
    "#a7d2f8",
    "#cde18d",
    "#f3d19f",
  ];
  return palette[Math.abs(clusterId) % palette.length] ?? null;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1000000;
  }
  return hash;
}

function drawBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time: number,
  seed: number
) {
  const points = 32;
  const wobble = radius * 0.015;
  const speed = 0.0009;
  const seedOffset = seed * 0.001;
  const pulse = 1 + Math.sin(time * 0.0012 + seedOffset) * 0.035;

  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2;
    const noise = Math.sin(t * 3 + time * speed + seedOffset) * wobble;
    const r = radius * pulse + noise;
    const px = x + Math.cos(t) * r;
    const py = y + Math.sin(t) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function getFloatOffset(seed: number, time: number) {
  const base = seed * 0.0007;
  const speedX = 0.00022 + (seed % 7) * 0.00001;
  const speedY = 0.00019 + (seed % 11) * 0.00001;
  const amplitude = 10 + (seed % 5);
  return {
    x: Math.sin(time * speedX + base) * amplitude,
    y: Math.cos(time * speedY + base) * amplitude,
  };
}

export function useCanvasRenderer({
  camera,
  spaces,
  onSpaceClick,
  hoveredSpaceId,
}: UseCanvasRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const physicsStateRef = useRef({ positions: new Map<string, { x: number; y: number }>() });
  const hoverProgressRef = useRef(new Map<string, number>());

  // Calculate bubble radius based on active user count
  const getBubbleRadius = useCallback((activeUserCount: number) => {
    return 70 + Math.sqrt(Math.max(1, activeUserCount)) * 22;
  }, []);

  useEffect(() => {
    const positions = new Map<string, { x: number; y: number }>();
    for (const space of spaces) {
      positions.set(space._id, { ...space.position });
    }

    const collisionPadding = -2;
    const anchorStrength = 0.06;
    const iterations = 60;


    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < spaces.length; i++) {
        for (let j = i + 1; j < spaces.length; j++) {
          const spaceA = spaces[i];
          const spaceB = spaces[j];
          const posA = positions.get(spaceA._id)!;
          const posB = positions.get(spaceB._id)!;

          let dx = posB.x - posA.x;
          let dy = posB.y - posA.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) {
            dist = 0.001;
            dx = 0.001;
            dy = 0;
          }


          const minDistance =
            getBubbleRadius(spaceA.activeUserCount) +
            getBubbleRadius(spaceB.activeUserCount) +
            collisionPadding;

          if (dist < minDistance) {
            const overlap = (minDistance - dist) / 2;
            const ux = dx / dist;
            const uy = dy / dist;
            posA.x -= ux * overlap;
            posA.y -= uy * overlap;
            posB.x += ux * overlap;
            posB.y += uy * overlap;
          }

        }
      }

      for (const space of spaces) {
        const pos = positions.get(space._id)!;
        pos.x += (space.position.x - pos.x) * anchorStrength;
        pos.y += (space.position.y - pos.y) * anchorStrength;
      }
    }

    physicsStateRef.current.positions = positions;
  }, [spaces, getBubbleRadius]);

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
        const radius = getBubbleRadius(space.activeUserCount);

        // Get resolved position from physics if available
        const resolvedPos = physicsStateRef.current.positions.get(space._id) ?? space.position;

        // Transform space position to screen coordinates
        const sx = (resolvedPos.x - camera.x) * camera.zoom + centerX;
        const sy = (resolvedPos.y - camera.y) * camera.zoom + centerY;
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
  const render = useCallback((time: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = dimensionsRef.current.width;
    const height = dimensionsRef.current.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background (warm radial gradient)
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height));
    bgGradient.addColorStop(0, "#fdfbf7"); // Very light warm creamy white
    bgGradient.addColorStop(1, "#f5f0eb"); // Slightly darker warm beige
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const minorSpacing = 80;
    const majorSpacing = minorSpacing * 5;
    const minorScreen = minorSpacing * camera.zoom;

    const leftWorld = camera.x - centerX / camera.zoom;
    const rightWorld = camera.x + centerX / camera.zoom;
    const topWorld = camera.y - centerY / camera.zoom;
    const bottomWorld = camera.y + centerY / camera.zoom;

    // Draw Dot Grid instead of Lines
    const drawDots = (spacingWorld: number, fillStyle: string) => {
      if (!Number.isFinite(spacingWorld) || spacingWorld <= 0) return;

      const startX = Math.floor(leftWorld / spacingWorld) * spacingWorld;
      const endX = Math.ceil(rightWorld / spacingWorld) * spacingWorld;
      const startY = Math.floor(topWorld / spacingWorld) * spacingWorld;
      const endY = Math.ceil(bottomWorld / spacingWorld) * spacingWorld;

      ctx.fillStyle = fillStyle;

      for (let x = startX; x <= endX; x += spacingWorld) {
        for (let y = startY; y <= endY; y += spacingWorld) {
          const sx = (x - camera.x) * camera.zoom + centerX;
          const sy = (y - camera.y) * camera.zoom + centerY;

          // Skip if off screen
          if (sx < -5 || sx > width + 5 || sy < -5 || sy > height + 5) continue;

          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); // Small 1.5px radius dots
          ctx.fill();
        }
      }
    };

    const gridSpacing = minorScreen >= 18 ? minorSpacing : majorSpacing;
    // Warm brownish-grey for dots, very subtle opacity
    drawDots(gridSpacing, "rgba(92, 74, 66, 0.08)");

    const resolvedPositions = new Map<string, { x: number; y: number }>();
    for (const space of spaces) {
      const basePos = physicsStateRef.current.positions.get(space._id) ?? space.position;
      const floatOffset = getFloatOffset(hashString(space._id), time);
      resolvedPositions.set(space._id, {
        x: basePos.x + floatOffset.x,
        y: basePos.y + floatOffset.y,
      });
    }

    // Draw bubbles
    for (const space of spaces) {
      const radius = getBubbleRadius(space.activeUserCount);
      const targetHover = hoveredSpaceId === space._id ? 1 : 0;
      const hoverProgress = hoverProgressRef.current;
      const currentHover = hoverProgress.get(space._id) ?? 0;
      const nextHover = currentHover + (targetHover - currentHover) * 0.12;
      hoverProgress.set(space._id, nextHover);
      const hoverScale = 1 + nextHover * 0.05;

      // Transform to screen coordinates
      const resolvedPos = resolvedPositions.get(space._id) ?? space.position;
      const sx = (resolvedPos.x - camera.x) * camera.zoom + centerX;
      const sy = (resolvedPos.y - camera.y) * camera.zoom + centerY;
      const sr = radius * camera.zoom * hoverScale;

      // Skip if off-screen
      if (sx + sr < 0 || sx - sr > width || sy + sr < 0 || sy - sr > height) {
        continue;
      }

      // Draw bubble with radial gradient
      const clusterHex = getClusterPaletteColor(space.clusterId);
      const baseHex = clusterHex ?? space.color;
      const baseRgb = hexToRgb(baseHex);
      if (!baseRgb) continue;
      const spaceRgb = hexToRgb(space.color) ?? baseRgb;
      const rgb = clusterHex ? mixColors(baseRgb, spaceRgb, 0.25) : baseRgb;
      const calm = mixWithWhite(rgb, 0.8 - nextHover * 0.08);
      const border = mixWithBlack(calm, 0.12);
      const glow = mixWithWhite(calm, 0.35 + nextHover * 0.14);

      drawBlob(ctx, sx, sy, sr, time, hashString(space._id));
      const fillGradient = ctx.createRadialGradient(
        sx - sr * 0.2,
        sy - sr * 0.2,
        sr * 0.2,
        sx,
        sy,
        sr
      );
      fillGradient.addColorStop(
        0,
        `rgba(${clamp255(glow.r)}, ${clamp255(glow.g)}, ${clamp255(glow.b)}, 0.95)`
      );
      fillGradient.addColorStop(
        1,
        `rgb(${clamp255(calm.r)}, ${clamp255(calm.g)}, ${clamp255(calm.b)})`
      );

      ctx.save();
      ctx.shadowColor = "rgba(92, 74, 66, 0.16)";
      const shadowBoost = 1 + nextHover * 0.2;
      ctx.shadowBlur = Math.max(10, Math.min(28, 14 * camera.zoom * shadowBoost));
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(3, Math.min(12, 7 * camera.zoom));
      ctx.fillStyle = fillGradient;
      ctx.fill();
      ctx.restore();

      // Draw border
      ctx.strokeStyle = `rgb(${clamp255(border.r)}, ${clamp255(border.g)}, ${clamp255(border.b)})`;
      ctx.lineWidth = 2;
      drawBlob(ctx, sx, sy, sr, time, hashString(space._id) + 17);
      ctx.stroke();

      // Draw name label
      const fontSize = 14 * camera.zoom;

      // Skip text rendering if too small to read/visible
      if (fontSize > 4) {
        ctx.font = `600 ${fontSize}px "Quicksand", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.save();
        ctx.shadowColor = "rgba(253, 248, 245, 0.9)";
        ctx.shadowBlur = Math.max(1, 6 - nextHover * 5);
        ctx.fillStyle = nextHover > 0.3 ? "rgba(92, 74, 66, 1)" : "rgba(92, 74, 66, 0.9)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(space.name, sx, sy);
        ctx.restore();

        // Draw user count if > 0
        if (space.activeUserCount > 0) {
          const countFontSize = 11 * camera.zoom;
          ctx.font = `500 ${countFontSize}px "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.fillStyle = "rgba(92, 74, 66, 0.6)";
          ctx.textAlign = "center";
          ctx.fillText(`${space.activeUserCount} active`, sx, sy + fontSize);
        }
      }
    }
  }, [camera, spaces, getBubbleRadius, hoveredSpaceId]);

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
      render(time);
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

  const getSpacePosition = useCallback(
    (spaceId: string) => {
      const space = spaces.find((item) => item._id === spaceId);
      if (!space) return null;
      return physicsStateRef.current.positions.get(space._id) ?? space.position;
    },
    [spaces]
  );

  return {
    canvasRef,
    handleClick,
    hitTest,
    getSpacePosition,
  };
}
