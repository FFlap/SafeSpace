import { useState, useCallback, useRef, useEffect } from "react";
import { useCamera } from "./hooks/useCamera";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { useDisableBrowserZoom } from "./hooks/useDisableBrowserZoom";
import type { Id } from "../../../convex/_generated/dataModel";

interface PresenceUser {
  _id: Id<"spacePresence">;
  userId: Id<"users">;
  position: { x: number; y: number };
  currentThreadId?: Id<"spaceThreads">;
}

interface SpeckFieldProps {
  presence: PresenceUser[];
  currentUserId: Id<"users"> | null;
  currentThreadId: Id<"spaceThreads"> | null;
  bubbleColor?: string;
  bubbleRadius?: number;
  outsideColor?: string;
  onViewTransform?: (transform: {
    bubbleCenter: { x: number; y: number };
    zoom: number;
  }) => void;
  onScreenToWorldReady?: (
    screenToWorld: (x: number, y: number) => { x: number; y: number }
  ) => void;
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

export function SpeckField({
  presence,
  currentUserId,
  currentThreadId,
  bubbleColor,
  bubbleRadius = 420,
  outsideColor = "#d1d5db",
  onViewTransform,
  onScreenToWorldReady,
}: SpeckFieldProps) {
  const { camera, pan, zoomBy, screenToWorld, worldToScreen } = useCamera();
  const [isDragging, setIsDragging] = useState(false);

  useDisableBrowserZoom(true);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Provide screenToWorld function to parent
  useEffect(() => {
    if (!onScreenToWorldReady || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const boundScreenToWorld = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      const canvasX = x - rect.left;
      const canvasY = y - rect.top;
      return screenToWorld(canvasX, canvasY, rect.width, rect.height);
    };

    onScreenToWorldReady(boundScreenToWorld);
  }, [onScreenToWorldReady, screenToWorld, dimensions]);

  // Provide view transform (bubble center + zoom) to parent for aligning DOM overlays.
  useEffect(() => {
    if (!onViewTransform || dimensions.width === 0 || dimensions.height === 0) return;

    const bubbleCenter = {
      x: (0 - camera.x) * camera.zoom + dimensions.width / 2,
      y: (0 - camera.y) * camera.zoom + dimensions.height / 2,
    };

    onViewTransform({ bubbleCenter, zoom: camera.zoom });
  }, [onViewTransform, camera.x, camera.y, camera.zoom, dimensions.width, dimensions.height]);

  // Keyboard navigation
  useKeyboardNav({
    onPan: pan,
    onZoom: (delta) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      zoomBy(delta, rect.width / 2, rect.height / 2, rect.width, rect.height);
    },
    enabled: true,
  });

  // Render specks on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const renderWidth = dimensions.width;
    const renderHeight = dimensions.height;

    // Background (outside bubble)
    ctx.fillStyle = outsideColor;
    ctx.fillRect(0, 0, renderWidth, renderHeight);

    const bubbleCenter = worldToScreen(0, 0, renderWidth, renderHeight);
    const bubbleScreenRadius = bubbleRadius * camera.zoom;

    // Bubble background
    if (bubbleColor) {
      const rgb = hexToRgb(bubbleColor);
      if (rgb) {
        const gradient = ctx.createRadialGradient(
          bubbleCenter.x - bubbleScreenRadius * 0.3,
          bubbleCenter.y - bubbleScreenRadius * 0.3,
          0,
          bubbleCenter.x,
          bubbleCenter.y,
          bubbleScreenRadius
        );
        gradient.addColorStop(
          0,
          `rgba(${Math.min(rgb.r + 60, 255)}, ${Math.min(rgb.g + 60, 255)}, ${Math.min(rgb.b + 60, 255)}, 0.95)`
        );
        gradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`);
        gradient.addColorStop(
          1,
          `rgba(${Math.max(rgb.r - 30, 0)}, ${Math.max(rgb.g - 30, 0)}, ${Math.max(rgb.b - 30, 0)}, 0.85)`
        );

        ctx.save();
        ctx.beginPath();
        ctx.arc(bubbleCenter.x, bubbleCenter.y, bubbleScreenRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, renderWidth, renderHeight);
        ctx.restore();
      }

      // Bubble boundary
      ctx.beginPath();
      ctx.arc(bubbleCenter.x, bubbleCenter.y, bubbleScreenRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Clip specks to bubble so the inside stays circular.
    ctx.save();
    ctx.beginPath();
    ctx.arc(bubbleCenter.x, bubbleCenter.y, bubbleScreenRadius, 0, Math.PI * 2);
    ctx.clip();

    const centerSpeck = { x: renderWidth / 2, y: renderHeight / 2 };

    // Draw other users
    presence.forEach((p) => {
      if (currentUserId === p.userId) return;

      const isInSameThread =
        currentThreadId !== null && p.currentThreadId === currentThreadId;

      // Convert world position to screen position
      const screenPos = worldToScreen(
        p.position.x,
        p.position.y,
        renderWidth,
        renderHeight
      );

      // Determine size and color
      const baseSize = 4;
      const size = baseSize * camera.zoom;

      const fillColor = isInSameThread ? "#ffffff" : "#9ca3af";

      // Draw speck
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
    });

    // Draw current user at center for responsiveness.
    if (currentUserId) {
      const baseSize = 6;
      const size = baseSize * camera.zoom;

      ctx.beginPath();
      ctx.arc(centerSpeck.x, centerSpeck.y, size, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerSpeck.x, centerSpeck.y, size + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }, [
    presence,
    currentUserId,
    currentThreadId,
    bubbleColor,
    bubbleRadius,
    outsideColor,
    camera,
    dimensions,
    worldToScreen,
  ]);

  // Mouse drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        pan(-dx, -dy);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isDragging, pan]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoomBy(delta, x, y, rect.width, rect.height);
    },
    [zoomBy]
  );

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  );
}
