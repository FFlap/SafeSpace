import { useState, useCallback, useRef } from "react";
import { useCamera } from "./hooks/useCamera";
import { useCanvasRenderer, type SpaceData } from "./hooks/useCanvasRenderer";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { useDisableBrowserZoom } from "./hooks/useDisableBrowserZoom";

interface BubbleFieldProps {
  spaces: SpaceData[];
  onSpaceClick?: (spaceId: string) => void;
  overlayOpen?: boolean;
  onEscape?: () => void;
}

export function BubbleField({
  spaces,
  onSpaceClick,
  overlayOpen = false,
  onEscape,
}: BubbleFieldProps) {
  const { camera, pan, zoomBy } = useCamera();
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const { canvasRef, handleClick, hitTest } = useCanvasRenderer({
    camera,
    spaces,
    onSpaceClick,
    hoveredSpaceId,
  });

  useDisableBrowserZoom(true);

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
