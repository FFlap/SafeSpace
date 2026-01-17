import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCamera } from "@/components/canvas/hooks/useCamera";
import { useDisableBrowserZoom } from "@/components/canvas/hooks/useDisableBrowserZoom";
import { useKeyboardNav } from "@/components/canvas/hooks/useKeyboardNav";
import {
  useThreadChatters,
  useThreadNameConsent,
  useThreadMessageMutations,
  useThreadMessages,
} from "@/hooks/useThreadMessages";
import type { Id } from "../../../convex/_generated/dataModel";

interface PresenceUser {
  _id: Id<"spacePresence">;
  userId: Id<"users">;
  position: { x: number; y: number };
  currentThreadId?: Id<"spaceThreads">;
}

interface ThreadOverlayProps {
  threadId: Id<"spaceThreads">;
  threadName: string;
  presence: PresenceUser[];
  currentUserId: Id<"users"> | null;
  joinedAt: number;
  onRequestDm?: (userId: Id<"users">) => void;
  onClose: () => void;
  onLeave: () => void;
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface Participant {
  userId: Id<"users">;
  isActive: boolean;
  isCurrentUser: boolean;
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

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(t, x, by + bubbleHeight / 2 + 1);
}

function ThreadParticipantsCanvas({
  participants,
  speechBubbles,
  onUserClick,
}: {
  participants: Participant[];
  speechBubbles?: Array<{ userId: Id<"users">; body: string; createdAt: number }>;
  onUserClick?: (userId: Id<"users">) => void;
}) {
  const { camera, pan, zoomBy, worldToScreen } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const hitAreasRef = useRef<Array<{ userId: Id<"users">; x: number; y: number; r: number }>>(
    []
  );
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  useDisableBrowserZoom(true);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = dimensions.width;
    const height = dimensions.height;
    if (width === 0 || height === 0) return;

    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(0, 0, width, height);

    const minDim = Math.min(width, height);
    const ringRadius = Math.max(90, minDim * 0.3);
    const jitter = Math.max(30, minDim * 0.12);

    hitAreasRef.current = [];

    ctx.font = `500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const now = Date.now();

    for (const participant of participants) {
      const h1 = hashString(`${participant.userId}-a`) / 0xffffffff;
      const h2 = hashString(`${participant.userId}-b`) / 0xffffffff;
      const angle = h1 * Math.PI * 2;
      const r = ringRadius + (h2 - 0.5) * jitter;
      const worldX = Math.cos(angle) * r;
      const worldY = Math.sin(angle) * r;
      const screen = worldToScreen(worldX, worldY, width, height);
      const x = screen.x;
      const y = screen.y;

      const radius = (participant.isCurrentUser ? 9 : 7) * camera.zoom;
      const fillColor = participant.isActive ? "#ffffff" : "#9ca3af";

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      hitAreasRef.current.push({
        userId: participant.userId,
        x,
        y,
        r: Math.max(12, radius + 6),
      });

      if (participant.isCurrentUser) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const bubble = speechBubbles?.find((b) => b.userId === participant.userId);
      if (bubble && now - bubble.createdAt <= 2800) {
        drawSpeechBubble(ctx, x, y, bubble.body);
      }
    }
  }, [participants, speechBubbles, dimensions, camera.zoom, worldToScreen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

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
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!onUserClick || didDrag.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let hit: { userId: Id<"users">; dist: number } | null = null;
    for (const a of hitAreasRef.current) {
      const dx = x - a.x;
      const dy = y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= a.r && (!hit || dist < hit.dist)) {
        hit = { userId: a.userId, dist };
      }
    }

    if (hit) onUserClick(hit.userId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomBy(delta, x, y, rect.width, rect.height);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  );
}

export function ThreadOverlay({
  threadId,
  threadName,
  presence,
  currentUserId,
  joinedAt,
  onRequestDm,
  onClose,
  onLeave,
}: ThreadOverlayProps) {
  const { messages } = useThreadMessages(threadId, { since: joinedAt, limit: 200 });
  const { chatters } = useThreadChatters(threadId);
  const { sendThreadMessage, setThreadNameConsent } = useThreadMessageMutations();
  const { shareName } = useThreadNameConsent(threadId, currentUserId);

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTogglingName, setIsTogglingName] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatNearBottomRef = useRef(true);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    chatNearBottomRef.current = true;
  }, [threadId]);

  const participants = useMemo<Participant[]>(() => {
    const activeIds = new Set<string>();
    for (const p of presence) {
      if (p.currentThreadId === threadId) activeIds.add(p.userId);
    }

    const allIds = new Set<string>();
    for (const id of chatters) allIds.add(id);
    for (const id of activeIds) allIds.add(id);

    return [...allIds]
      .sort()
      .map((id) => ({
        userId: id as Id<"users">,
        isActive: activeIds.has(id),
        isCurrentUser: id === currentUserId,
      }));
  }, [presence, chatters, threadId, currentUserId]);

  const speechBubbles = useMemo(() => {
    const byUser = new Map<string, { userId: Id<"users">; body: string; createdAt: number }>();
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (now - m.createdAt > 2800) continue;
      if (byUser.has(m.userId)) continue;
      byUser.set(m.userId, { userId: m.userId, body: m.body, createdAt: m.createdAt });
    }
    return [...byUser.values()];
  }, [messages, now]);

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const thresholdPx = 40;
    chatNearBottomRef.current =
      el.scrollTop + el.clientHeight >= el.scrollHeight - thresholdPx;
  };

  useEffect(() => {
    const bottom = chatBottomRef.current;
    const last = messages[messages.length - 1];
    if (!bottom || !last) return;

    const shouldStick =
      chatNearBottomRef.current || (currentUserId ? last.userId === currentUserId : false);
    if (shouldStick) {
      bottom.scrollIntoView({ block: "end", behavior: "auto" });
    }
  }, [messages, currentUserId]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !currentUserId) return;

    setDraft("");
    setIsSending(true);
    try {
      await sendThreadMessage({ threadId, userId: currentUserId, body });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="absolute left-0 right-0 bottom-0 top-16 flex">
        {/* Chat */}
        <div className="w-[420px] max-w-[90vw] h-full bg-slate-950/85 border-r border-white/10 flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <div className="min-w-0">
              <div className="text-xs text-white/60">Thread</div>
              <div className="text-base font-semibold text-white truncate">{threadName}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!currentUserId || isTogglingName}
                onClick={async () => {
                  if (!currentUserId) return;
                  setIsTogglingName(true);
                  try {
                    await setThreadNameConsent({
                      threadId,
                      userId: currentUserId,
                      shareName: !shareName,
                    });
                  } finally {
                    setIsTogglingName(false);
                  }
                }}
                className="text-white/70 hover:text-white hover:bg-white/10"
                title="Reveal or hide your name in this thread"
              >
                {shareName ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {shareName ? "Hide name" : "Share name"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeave}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Leave
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>
          </div>

          <div
            ref={chatScrollRef}
            onScroll={handleChatScroll}
            className="flex-1 min-h-0 overflow-y-auto p-4"
          >
            <div className="space-y-3">
              {messages.map((m) => {
                const isMine = Boolean(currentUserId) && m.userId === currentUserId;
                return (
                  <div
                    key={m._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        isMine
                          ? "bg-white text-slate-900"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <div className="text-[11px] opacity-70 mb-1">
                        {m.displayName ? `${m.displayName} • ` : ""}
                        {formatTime(m.createdAt)}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>
          </div>

          <div className="p-4 border-t border-white/10 flex gap-2">
            <Input
              value={draft}
              placeholder="Say something..."
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !draft.trim() || !currentUserId}
              className="bg-white text-slate-900 hover:bg-white/90"
            >
              Send
            </Button>
          </div>
        </div>

        {/* Participants canvas */}
        <div className="flex-1">
          <ThreadParticipantsCanvas
            participants={participants}
            speechBubbles={speechBubbles}
            onUserClick={(userId) => {
              if (!onRequestDm || !currentUserId) return;
              if (userId === currentUserId) return;
              void Promise.resolve(onRequestDm(userId)).catch(() => {});
            }}
          />
        </div>
      </div>
    </div>
  );
}
