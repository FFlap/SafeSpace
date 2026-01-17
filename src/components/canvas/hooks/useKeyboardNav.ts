import { useEffect, useCallback, useRef } from "react";

interface UseKeyboardNavOptions {
  onPan: (dx: number, dy: number) => void;
  onZoom: (delta: number) => void;
  onEscape?: () => void;
  enabled?: boolean;
  panSpeed?: number;
  zoomSpeed?: number;
  panSmoothing?: number;
  onVelocity?: (vx: number, vy: number) => void;
}

export function useKeyboardNav({
  onPan,
  onZoom,
  onEscape,
  enabled = true,
  panSpeed = 320,
  zoomSpeed = 0.1,
  panSmoothing = 18,
  onVelocity,
}: UseKeyboardNavOptions) {
  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const shouldIgnoreEvent = (e: KeyboardEvent) =>
    e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

  const tick = useCallback(
    (time: number) => {
      const lastTime = lastTimeRef.current ?? time;
      const dt = Math.max(0, Math.min(0.05, (time - lastTime) / 1000));
      lastTimeRef.current = time;

      const directionX = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
      const directionY = (keysRef.current.down ? 1 : 0) - (keysRef.current.up ? 1 : 0);
      const length = Math.hypot(directionX, directionY) || 1;
      const normalizedX = directionX / length;
      const normalizedY = directionY / length;

      const targetVx = normalizedX * panSpeed;
      const targetVy = normalizedY * panSpeed;
      const blend = 1 - Math.exp(-panSmoothing * dt);

      const nextVx = velocityRef.current.x + (targetVx - velocityRef.current.x) * blend;
      const nextVy = velocityRef.current.y + (targetVy - velocityRef.current.y) * blend;
      velocityRef.current = { x: nextVx, y: nextVy };

      onVelocity?.(nextVx, nextVy);

      if (Math.abs(nextVx) > 0.01 || Math.abs(nextVy) > 0.01) {
        onPan(nextVx * dt, nextVy * dt);
      }

      const stillMoving =
        Math.abs(nextVx) > 0.4 ||
        Math.abs(nextVy) > 0.4 ||
        keysRef.current.up ||
        keysRef.current.down ||
        keysRef.current.left ||
        keysRef.current.right;

      if (stillMoving) {
        animationRef.current = window.requestAnimationFrame(tick);
      } else {
        animationRef.current = null;
      }
    },
    [onPan, onVelocity, panSpeed, panSmoothing]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (shouldIgnoreEvent(e)) return;

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          e.preventDefault();
          keysRef.current.up = true;
          break;
        case "s":
        case "arrowdown":
          e.preventDefault();
          keysRef.current.down = true;
          break;
        case "a":
        case "arrowleft":
          e.preventDefault();
          keysRef.current.left = true;
          break;
        case "d":
        case "arrowright":
          e.preventDefault();
          keysRef.current.right = true;
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

      if (!animationRef.current) {
        lastTimeRef.current = performance.now();
        animationRef.current = window.requestAnimationFrame(tick);
      }
    },
    [enabled, onEscape, onZoom, zoomSpeed, tick]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (shouldIgnoreEvent(e)) return;

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          keysRef.current.up = false;
          break;
        case "s":
        case "arrowdown":
          keysRef.current.down = false;
          break;
        case "a":
        case "arrowleft":
          keysRef.current.left = false;
          break;
        case "d":
        case "arrowright":
          keysRef.current.right = false;
          break;
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = null;
      lastTimeRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
