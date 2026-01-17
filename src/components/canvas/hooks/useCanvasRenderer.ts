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

    // Draw background gradient
    const bgGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(width, height)
    );
    bgGradient.addColorStop(0, "#1e293b");
    bgGradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;

    const gridSize = 100 * camera.zoom;
    const offsetX = ((-camera.x * camera.zoom + centerX) % gridSize) - gridSize;
    const offsetY = ((-camera.y * camera.zoom + centerY) % gridSize) - gridSize;

    for (let x = offsetX; x < width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = offsetY; y < height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

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

      const gradient = ctx.createRadialGradient(
        sx - sr * 0.3,
        sy - sr * 0.3,
        0,
        sx,
        sy,
        sr
      );
      gradient.addColorStop(0, `rgba(${rgb.r + 40}, ${rgb.g + 40}, ${rgb.b + 40}, 0.9)`);
      gradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
      gradient.addColorStop(1, `rgba(${rgb.r - 20}, ${rgb.g - 20}, ${rgb.b - 20}, 0.7)`);

      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2 * camera.zoom;
      ctx.stroke();

      // Draw name label
      const fontSize = Math.max(12, 14 * camera.zoom);
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(space.name, sx, sy);

      // Draw user count if > 0
      if (space.activeUserCount > 0) {
        const countFontSize = Math.max(10, 11 * camera.zoom);
        ctx.font = `500 ${countFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
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
