import { useState, useCallback, useRef, useEffect } from "react";
import { useCamera } from "./hooks/useCamera";
import { useCanvasRenderer, type SpaceData } from "./hooks/useCanvasRenderer";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { useDisableBrowserZoom } from "./hooks/useDisableBrowserZoom";

interface BubbleFieldProps {
  spaces: SpaceData[];
  onSpaceClick?: (spaceId: string) => void;
  overlayOpen?: boolean;
  onEscape?: () => void;
  focusSpaceId?: string | null;
  focusRequestId?: number;
}

export function BubbleField({
  spaces,
  onSpaceClick,
  overlayOpen = false,
  onEscape,
  focusSpaceId,
  focusRequestId,
}: BubbleFieldProps) {
  const { camera, pan, zoomBy, setCamera } = useCamera({ zoom: 0.45 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const cameraRef = useRef(camera);
  const focusAnimationRef = useRef<number | null>(null);

  const { canvasRef, handleClick, hitTest, getSpacePosition } = useCanvasRenderer({
    camera,
    spaces,
    onSpaceClick,
    hoveredSpaceId,
  });

  useDisableBrowserZoom(true);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    if (!focusSpaceId || overlayOpen) return;
    const target = getSpacePosition(focusSpaceId);
    if (!target) return;

    if (focusAnimationRef.current) {
      cancelAnimationFrame(focusAnimationRef.current);
    }

    const { x: startX, y: startY } = cameraRef.current;
    const deltaX = target.x - startX;
    const deltaY = target.y - startY;
    const start = performance.now();
    const duration = 520;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (time: number) => {
      const progress = Math.min(1, Math.max(0, (time - start) / duration));
      const eased = easeOutCubic(progress);
      setCamera((prev) => ({
        ...prev,
        x: startX + deltaX * eased,
        y: startY + deltaY * eased,
      }));

      if (progress < 1) {
        focusAnimationRef.current = requestAnimationFrame(animate);
      } else {
        focusAnimationRef.current = null;
      }
    };

    focusAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (focusAnimationRef.current) {
        cancelAnimationFrame(focusAnimationRef.current);
        focusAnimationRef.current = null;
      }
    };
  }, [focusSpaceId, focusRequestId, getSpacePosition, overlayOpen, setCamera]);

  // Keyboard navigation
  useKeyboardNav({
    onPan: pan,
    onZoom: (delta) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      zoomBy(delta, rect.width / 2, rect.height / 2, rect.width, rect.height);
    },
    onEscape,
    enabled: !overlayOpen,
    panSpeed: 360,
  });

  // Mouse drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update hover state
      const hitId = hitTest(x, y);
      setHoveredSpaceId(hitId);

      // Handle dragging
      if (isDragging) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        pan(-dx, -dy);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isDragging, pan, hitTest]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setHoveredSpaceId(null);
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
        cursor: hoveredSpaceId ? "pointer" : isDragging ? "grabbing" : "grab",
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  );
}
