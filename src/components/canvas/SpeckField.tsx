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
  currentUserPosition?: { x: number; y: number };
  speechBubbles?: Array<{ userId: Id<"users">; body: string; createdAt: number }>;
  onSpeckClick?: (userId: Id<"users">) => void;
  keyboardEnabled?: boolean;
  zoomBounds?: { min: number; max: number };
  initialZoom?: number;
  onViewTransform?: (transform: {
    bubbleCenter: { x: number; y: number };
    zoom: number;
  }) => void;
  onScreenToWorldReady?: (
    screenToWorld: (x: number, y: number) => { x: number; y: number }
  ) => void;
  useMainCanvasBackground?: boolean;
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

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (ctx.measureText(t).width <= maxWidth) return t;

  let lo = 0;
  let hi = t.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = `${t.slice(0, mid)}…`;
    if (ctx.measureText(candidate).width <= maxWidth) lo = mid + 1;
    else hi = mid;
  }
  return `${t.slice(0, Math.max(0, lo - 1))}…`;
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string
): void {
  const maxTextWidth = 220;
  const t = truncateText(ctx, text, maxTextWidth);
  if (!t) return;

  const paddingX = 8;
  const textWidth = ctx.measureText(t).width;
  const bubbleWidth = textWidth + paddingX * 2;
  const bubbleHeight = 22;
  const radius = 10;
  const pointerH = 6;
  const pointerW = 10;

  const bx = x - bubbleWidth / 2;
  const by = y - bubbleHeight - pointerH - 10;

  ctx.beginPath();
  ctx.moveTo(bx + radius, by);
  ctx.lineTo(bx + bubbleWidth - radius, by);
  ctx.quadraticCurveTo(bx + bubbleWidth, by, bx + bubbleWidth, by + radius);
  ctx.lineTo(bx + bubbleWidth, by + bubbleHeight - radius);
  ctx.quadraticCurveTo(
    bx + bubbleWidth,
    by + bubbleHeight,
    bx + bubbleWidth - radius,
    by + bubbleHeight
  );
  ctx.lineTo(x + pointerW / 2, by + bubbleHeight);
  ctx.lineTo(x, by + bubbleHeight + pointerH);
  ctx.lineTo(x - pointerW / 2, by + bubbleHeight);
  ctx.lineTo(bx + radius, by + bubbleHeight);
  ctx.quadraticCurveTo(bx, by + bubbleHeight, bx, by + bubbleHeight - radius);
  ctx.lineTo(bx, by + radius);
  ctx.quadraticCurveTo(bx, by, bx + radius, by);
  ctx.closePath();

  ctx.fillStyle = "rgba(253, 248, 245, 0.95)";
  ctx.fill();
  ctx.strokeStyle = "rgba(156, 139, 126, 0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(92, 74, 66, 0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(t, x, by + bubbleHeight / 2 + 1);
}

export function SpeckField({
  presence,
  currentUserId,
  currentThreadId,
  bubbleColor,
  bubbleRadius = 420,
  outsideColor = "#ffffff",
  currentUserPosition,
  speechBubbles,
  onSpeckClick,
  keyboardEnabled = true,
  zoomBounds,
  initialZoom,
  onViewTransform,
  onScreenToWorldReady,
  useMainCanvasBackground = false,
}: SpeckFieldProps) {
  const { camera, pan, zoomBy, screenToWorld, worldToScreen, setCamera } = useCamera();
  const [isDragging, setIsDragging] = useState(false);
  const velocityRef = useRef({ x: 0, y: 0 });
  const leadRef = useRef({ x: 0, y: 0 });
  const presenceHistoryRef = useRef(
    new Map<string, Array<{ x: number; y: number; t: number }>>()
  );
  const smoothedPositionsRef = useRef(new Map<string, { x: number; y: number }>());

  useDisableBrowserZoom(true);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const getSmoothedPosition = useCallback(
    (userId: string, fallback: { x: number; y: number }) => {
      const now = performance.now();
      const renderTime = now - 300;
      const history = presenceHistoryRef.current.get(userId) ?? [];
      if (history.length === 0) return fallback;
      if (history.length < 2) {
        const only = history[0];
        return { x: only.x, y: only.y };
      }

      let left = history[0];
      let right = history[history.length - 1];

      for (let i = 0; i < history.length; i++) {
        const snap = history[i];
        if (snap.t <= renderTime) {
          left = snap;
        }
        if (snap.t >= renderTime) {
          right = snap;
          break;
        }
      }

      let target = fallback;
      if (left && right && right.t > left.t && renderTime <= right.t) {
        const span = right.t - left.t;
        const t = span > 0 ? (renderTime - left.t) / span : 0;
        const t2 = t * t * (3 - 2 * t);
        target = {
          x: left.x + (right.x - left.x) * t2,
          y: left.y + (right.y - left.y) * t2,
        };
      } else {
        const latest = history[history.length - 1];
        target = { x: latest.x, y: latest.y };
      }

      const lastTarget = smoothedPositionsRef.current.get(`${userId}-target`) ?? target;
      const targetEase = 0.2;
      const blendedTarget = {
        x: lastTarget.x + (target.x - lastTarget.x) * targetEase,
        y: lastTarget.y + (target.y - lastTarget.y) * targetEase,
      };
      smoothedPositionsRef.current.set(`${userId}-target`, blendedTarget);

      const last = smoothedPositionsRef.current.get(userId);
      if (!last) {
        smoothedPositionsRef.current.set(userId, blendedTarget);
        return blendedTarget;
      }

      const ease = 0.1;
      const next = {
        x: last.x + (blendedTarget.x - last.x) * ease,
        y: last.y + (blendedTarget.y - last.y) * ease,
      };
      smoothedPositionsRef.current.set(userId, next);
      return next;
    },
    []
  );

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

  useEffect(() => {
    if (!currentUserId || !currentUserPosition) return;

    const targetLead = {
      x: velocityRef.current.x * 0.18,
      y: velocityRef.current.y * 0.18,
    };
    const blend = 0.12;
    leadRef.current = {
      x: leadRef.current.x + (targetLead.x - leadRef.current.x) * blend,
      y: leadRef.current.y + (targetLead.y - leadRef.current.y) * blend,
    };

    setCamera((prev) => {
      const nextX = currentUserPosition.x + leadRef.current.x;
      const nextY = currentUserPosition.y + leadRef.current.y;
      return { ...prev, x: nextX, y: nextY };
    });
  }, [currentUserId, currentUserPosition, setCamera]);

  useEffect(() => {
    if (!zoomBounds) return;
    if (!dimensions.width || !dimensions.height) return;
    setCamera((prev) => {
      const startZoom = initialZoom ?? prev.zoom;
      const clamped = Math.max(zoomBounds.min, Math.min(zoomBounds.max, startZoom));
      if (Math.abs(clamped - prev.zoom) < 0.0001) return prev;
      return { ...prev, zoom: clamped };
    });
  }, [zoomBounds, dimensions.width, dimensions.height, setCamera, initialZoom]);

  // Keyboard navigation
  useKeyboardNav({
    onPan: pan,
    onZoom: (delta) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      zoomBy(
        delta,
        rect.width / 2,
        rect.height / 2,
        rect.width,
        rect.height,
        zoomBounds?.min,
        zoomBounds?.max
      );
    },
    enabled: keyboardEnabled,
    onVelocity: (vx, vy) => {
      velocityRef.current = { x: vx, y: vy };
    },
  });

  // Render specks on canvas with animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio;

    let animationFrameId: number;

    const render = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const renderWidth = dimensions.width;
      const renderHeight = dimensions.height;

      const snapshotNow = performance.now();
      const activeIds = new Set<string>();
      presence.forEach((p) => {
        if (currentUserId && p.userId === currentUserId) return;
        activeIds.add(p.userId);
        const history = presenceHistoryRef.current.get(p.userId) ?? [];
        history.push({ x: p.position.x, y: p.position.y, t: snapshotNow });
        if (history.length > 10) {
          history.splice(0, history.length - 10);
        }
        presenceHistoryRef.current.set(p.userId, history);
      });

      for (const id of presenceHistoryRef.current.keys()) {
        if (!activeIds.has(id)) {
          presenceHistoryRef.current.delete(id);
          smoothedPositionsRef.current.delete(id);
          smoothedPositionsRef.current.delete(`${id}-target`);
        }
      }

      // Background (white grid outside bubble)
      if (useMainCanvasBackground) {
        const bgGradient = ctx.createRadialGradient(
          renderWidth / 2,
          renderHeight / 2,
          0,
          renderWidth / 2,
          renderHeight / 2,
          Math.max(renderWidth, renderHeight)
        );
        bgGradient.addColorStop(0, "#fdfbf7");
        bgGradient.addColorStop(1, "#f5f0eb");
        ctx.fillStyle = bgGradient;
      } else {
        ctx.fillStyle = outsideColor;
      }
      ctx.fillRect(0, 0, renderWidth, renderHeight);

      const centerX = renderWidth / 2;
      const centerY = renderHeight / 2;

      const minorSpacing = 80;
      const majorSpacing = minorSpacing * 5;
      const minorScreen = minorSpacing * camera.zoom;

      const leftWorld = camera.x - centerX / camera.zoom;
      const rightWorld = camera.x + centerX / camera.zoom;
      const topWorld = camera.y - centerY / camera.zoom;
      const bottomWorld = camera.y + centerY / camera.zoom;

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

            if (sx < -5 || sx > renderWidth + 5 || sy < -5 || sy > renderHeight + 5) {
              continue;
            }

            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      };

      const gridSpacing = minorScreen >= 18 ? minorSpacing : majorSpacing;
      drawDots(gridSpacing, "rgba(92, 74, 66, 0.08)");

      const bubbleCenter = worldToScreen(0, 0, renderWidth, renderHeight);
      const bubbleScreenRadius = bubbleRadius * camera.zoom;

      // Bubble background
      if (bubbleColor) {
        const rgb = hexToRgb(bubbleColor);
        const calm = rgb ? mixWithWhite(rgb, 0.8) : null;
        const border = calm ? mixWithBlack(calm, 0.12) : null;
        const glow = calm ? mixWithWhite(calm, 0.35) : null;

        if (calm && glow) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(bubbleCenter.x, bubbleCenter.y, bubbleScreenRadius, 0, Math.PI * 2);
          ctx.clip();

          const fillGradient = ctx.createRadialGradient(
            bubbleCenter.x - bubbleScreenRadius * 0.2,
            bubbleCenter.y - bubbleScreenRadius * 0.2,
            bubbleScreenRadius * 0.2,
            bubbleCenter.x,
            bubbleCenter.y,
            bubbleScreenRadius
          );
          fillGradient.addColorStop(
            0,
            `rgba(${clamp255(glow.r)}, ${clamp255(glow.g)}, ${clamp255(glow.b)}, 0.95)`
          );
          fillGradient.addColorStop(
            1,
            `rgb(${clamp255(calm.r)}, ${clamp255(calm.g)}, ${clamp255(calm.b)})`
          );

          ctx.fillStyle = fillGradient;
          ctx.fillRect(0, 0, renderWidth, renderHeight);
          ctx.restore();
        }

        // Bubble boundary
        ctx.beginPath();
        ctx.arc(bubbleCenter.x, bubbleCenter.y, bubbleScreenRadius, 0, Math.PI * 2);
        const bubbleBorder = border ?? { r: 15, g: 23, b: 42 };
        ctx.strokeStyle = `rgb(${clamp255(bubbleBorder.r)}, ${clamp255(bubbleBorder.g)}, ${clamp255(bubbleBorder.b)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Clip specks to bubble so the inside stays circular.
      ctx.save();
      ctx.beginPath();
      ctx.arc(bubbleCenter.x, bubbleCenter.y, bubbleScreenRadius, 0, Math.PI * 2);
      ctx.clip();

      const currentUserScreen =
        currentUserId && currentUserPosition
          ? worldToScreen(
            currentUserPosition.x,
            currentUserPosition.y,
            renderWidth,
            renderHeight
          )
          : { x: renderWidth / 2, y: renderHeight / 2 };

      // Calculate pulse factor for glow animation
      const time = Date.now();
      const pulse = Math.sin(time * 0.002) * 0.15 + 1; // Oscillates between 0.85 and 1.15

      // Draw other users
      presence.forEach((p) => {
        if (currentUserId === p.userId) return;

        const isInSameThread =
          currentThreadId !== null && p.currentThreadId === currentThreadId;

        const smoothed = getSmoothedPosition(p.userId, p.position);

        // Convert world position to screen position
        const screenPos = worldToScreen(
          smoothed.x,
          smoothed.y,
          renderWidth,
          renderHeight
        );

        // Determine size and color
        const baseSize = 3;
        const size = baseSize * camera.zoom;

        const fillColor = isInSameThread ? "#FAF5F2" : "#C4B8B0";
        const isLightColor = fillColor === "#FAF5F2";

        // Modulate gradient size with pulse
        const gradient = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, size * (1.2 + pulse * 0.4));
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(0.4, fillColor);
        gradient.addColorStop(1, isLightColor ? `rgba(250, 245, 242, 0)` : `rgba(196, 184, 176, 0)`);

        // Shadow with pulsing opacity
        ctx.shadowColor = isLightColor
          ? `rgba(255, 255, 255, ${0.3 + pulse * 0.3})`
          : `rgba(196, 184, 176, ${0.2 + pulse * 0.2})`;
        ctx.shadowBlur = (4 + pulse * 4) * camera.zoom;

        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Reset shadow for stroke
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
        ctx.strokeStyle =
          fillColor === "#FAF5F2" ? "rgba(92, 74, 66, 0.25)" : "rgba(92, 74, 66, 0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw current user with enhanced glow
      if (currentUserId) {
        const baseSize = 5;
        const size = baseSize * camera.zoom;

        // Radial gradient for current user
        const gradient = ctx.createRadialGradient(
          currentUserScreen.x,
          currentUserScreen.y,
          0,
          currentUserScreen.x,
          currentUserScreen.y,
          size * (1.3 + pulse * 0.5)
        );
        gradient.addColorStop(0, "#FAF5F2");
        gradient.addColorStop(0.3, "#FAF5F2");
        gradient.addColorStop(1, "rgba(250, 245, 242, 0)");

        // Stronger shadow for current user with pulse
        ctx.shadowColor = `rgba(255, 255, 255, ${0.4 + pulse * 0.4})`;
        ctx.shadowBlur = (6 + pulse * 6) * camera.zoom;

        ctx.beginPath();
        ctx.arc(currentUserScreen.x, currentUserScreen.y, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(currentUserScreen.x, currentUserScreen.y, size, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(92, 74, 66, 0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(currentUserScreen.x, currentUserScreen.y, size + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(253, 248, 245, 0.5)";

        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const now = Date.now();
      if (speechBubbles?.length) {
        ctx.font = `500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        for (const bubble of speechBubbles) {
          if (now - bubble.createdAt > 2800) continue;

          if (currentUserId && bubble.userId === currentUserId) {
            drawSpeechBubble(ctx, currentUserScreen.x, currentUserScreen.y, bubble.body);
            continue;
          }

          const presenceItem = presence.find((p) => p.userId === bubble.userId);
          if (!presenceItem) continue;

          const smoothed = getSmoothedPosition(presenceItem.userId, presenceItem.position);
          const screenPos = worldToScreen(smoothed.x, smoothed.y, renderWidth, renderHeight);
          drawSpeechBubble(ctx, screenPos.x, screenPos.y, bubble.body);
        }
      }

      ctx.restore();

      // Request next frame
      animationFrameId = requestAnimationFrame(render);
    };

    // Start animation loop
    animationFrameId = requestAnimationFrame(render);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

    };
  }, [
    presence,
    currentUserId,
    currentThreadId,
    bubbleColor,
    bubbleRadius,
    outsideColor,
    currentUserPosition,
    speechBubbles,
    camera,
    dimensions,
    worldToScreen,
    getSmoothedPosition,
  ]);

  // Mouse drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!keyboardEnabled) return;
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;
  }, [keyboardEnabled]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!keyboardEnabled) return;
      if (isDragging) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        if (
          Math.abs(e.clientX - mouseDownPos.current.x) > 3 ||
          Math.abs(e.clientY - mouseDownPos.current.y) > 3
        ) {
          didDrag.current = true;
        }
        pan(-dx, -dy);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isDragging, pan, keyboardEnabled]
  );

  const handleMouseUp = useCallback(() => {
    if (!keyboardEnabled) return;
    setIsDragging(false);
  }, [keyboardEnabled]);

  const handleMouseLeave = useCallback(() => {
    if (!keyboardEnabled) return;
    setIsDragging(false);
  }, [keyboardEnabled]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onSpeckClick || didDrag.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let hit: { userId: Id<"users">; dist: number } | null = null;
      for (const p of presence) {
        if (currentUserId && p.userId === currentUserId) continue;
        const smoothed = getSmoothedPosition(p.userId, p.position);
        const screenPos = worldToScreen(smoothed.x, smoothed.y, rect.width, rect.height);
        const dx = x - screenPos.x;
        const dy = y - screenPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const radius = Math.max(8, 8 * camera.zoom);
        if (dist <= radius && (!hit || dist < hit.dist)) {
          hit = { userId: p.userId, dist };
        }
      }

      if (hit) onSpeckClick(hit.userId);
    },
    [onSpeckClick, presence, currentUserId, worldToScreen, camera.zoom]
  );

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!keyboardEnabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoomBy(delta, x, y, rect.width, rect.height, zoomBounds?.min, zoomBounds?.max);
    },
    [zoomBy, keyboardEnabled, zoomBounds?.min, zoomBounds?.max]
  );

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{
        cursor: keyboardEnabled ? (isDragging ? "grabbing" : "grab") : "default",
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
