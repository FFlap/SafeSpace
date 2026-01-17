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
  onScreenToWorldReady?: (
    screenToWorld: (x: number, y: number) => { x: number; y: number }
  ) => void;
}

export function SpeckField({
  presence,
  currentUserId,
  currentThreadId,
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

    // Clear canvas
    ctx.clearRect(0, 0, renderWidth, renderHeight);

    // Draw each speck
    presence.forEach((p) => {
      const isCurrentUser = currentUserId === p.userId;
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
      const baseSize = isCurrentUser ? 6 : 4;
      const size = baseSize * camera.zoom;

      let fillColor = "#9ca3af"; // gray-400 - users in other threads
      if (isCurrentUser) {
        fillColor = "#3b82f6"; // blue-500
      } else if (isInSameThread) {
        fillColor = "#ffffff"; // white
      }

      // Draw speck
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Draw ring for current user
      if (isCurrentUser) {
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, size + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(147, 197, 253, 0.5)"; // blue-300 with opacity
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [presence, currentUserId, currentThreadId, camera, dimensions, worldToScreen]);

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
