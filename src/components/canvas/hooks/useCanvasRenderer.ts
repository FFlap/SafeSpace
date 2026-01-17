import { useEffect, useRef, useCallback } from "react";
import type { Camera } from "./useCamera";

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

  // Calculate bubble radius based on active user count
  const getBubbleRadius = useCallback((activeUserCount: number) => {
    return 40 + Math.sqrt(activeUserCount) * 15;
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
        const radius = getBubbleRadius(space.activeUserCount);

        // Transform space position to screen coordinates
        const sx = (space.position.x - camera.x) * camera.zoom + centerX;
        const sy = (space.position.y - camera.y) * camera.zoom + centerY;
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
      const radius = getBubbleRadius(space.activeUserCount);

      // Transform to screen coordinates
      const sx = (space.position.x - camera.x) * camera.zoom + centerX;
      const sy = (space.position.y - camera.y) * camera.zoom + centerY;
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
      const fontSize = Math.max(12, 14 * camera.zoom);
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
        const countFontSize = Math.max(10, 11 * camera.zoom);
        ctx.font = `500 ${countFontSize}px "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = "rgba(92, 74, 66, 0.6)";
        ctx.fillText(`${space.activeUserCount} active`, sx, sy + fontSize);
      }
    }
  }, [camera, spaces, getBubbleRadius]);

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
    const animate = () => {
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
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
