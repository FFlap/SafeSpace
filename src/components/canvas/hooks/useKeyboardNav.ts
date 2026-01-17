import { useEffect, useCallback } from "react";

interface UseKeyboardNavOptions {
  onPan: (dx: number, dy: number) => void;
  onZoom: (delta: number) => void;
  onEscape?: () => void;
  enabled?: boolean;
  panSpeed?: number;
  zoomSpeed?: number;
}

export function useKeyboardNav({
  onPan,
  onZoom,
  onEscape,
  enabled = true,
  panSpeed = 50,
  zoomSpeed = 0.1,
}: UseKeyboardNavOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          e.preventDefault();
          onPan(0, -panSpeed);
          break;
        case "s":
        case "arrowdown":
          e.preventDefault();
          onPan(0, panSpeed);
          break;
        case "a":
        case "arrowleft":
          e.preventDefault();
          onPan(-panSpeed, 0);
          break;
        case "d":
        case "arrowright":
          e.preventDefault();
          onPan(panSpeed, 0);
          break;
        case "=":
        case "+":
          e.preventDefault();
          onZoom(zoomSpeed);
          break;
        case "-":
        case "_":
          e.preventDefault();
          onZoom(-zoomSpeed);
          break;
        case "escape":
          e.preventDefault();
          onEscape?.();
          break;
      }
    },
    [enabled, onPan, onZoom, onEscape, panSpeed, zoomSpeed]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
