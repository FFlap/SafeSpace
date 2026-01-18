import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeckField } from "@/components/canvas/SpeckField";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThreadOverlay } from "@/components/threads/ThreadOverlay";
import { ThreadSidebar } from "@/components/threads/ThreadSidebar";
import { useThreadMessages } from "@/hooks/useThreadMessages";
import { useKeyboardNav } from "@/components/canvas/hooks/useKeyboardNav";
import type { Id } from "../../../convex/_generated/dataModel";

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

function toHexByte(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return `#${toHexByte(rgb.r)}${toHexByte(rgb.g)}${toHexByte(rgb.b)}`;
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

interface PresenceUser {
  _id: Id<"spacePresence">;
  userId: Id<"users">;
  position: { x: number; y: number };
  currentThreadId?: Id<"spaceThreads">;
}

interface Thread {
  _id: Id<"spaceThreads">;
  name: string;
  memberCount: number;
  lastActiveAt: number;
}

interface SpaceOverlayProps {
  spaceName: string;
  spaceColor: string;
  threads: Thread[];
  presence: PresenceUser[];
  currentUserId: Id<"users"> | null;
  currentThreadId: Id<"spaceThreads"> | null;
  memberThreadIds: Set<string>;
  onClose: () => void;
  onCloseThread: () => void;
  onCreateThread: (name: string) => void;
  onJoinThread: (threadId: Id<"spaceThreads">) => void;
  onLeaveThread: (threadId: Id<"spaceThreads">) => void;
  onRequestDm?: (userId: Id<"users">) => void;
  onCurrentUserPositionChange?: (pos: { x: number; y: number }) => void;
}

export function SpaceOverlay({
  spaceName,
  spaceColor,
  threads,
  presence,
  currentUserId,
  currentThreadId,
  memberThreadIds,
  onClose,
  onCloseThread,
  onCreateThread,
  onJoinThread,
  onLeaveThread,
  onRequestDm,
  onCurrentUserPositionChange,
}: SpaceOverlayProps) {
  const bubbleRadius = 360 + Math.sqrt(Math.max(1, presence.length)) * 140;
  const calmSpaceColor = useMemo(() => {
    const rgb = hexToRgb(spaceColor);
    return rgb ? rgbToHex(mixWithWhite(rgb, 0.9)) : spaceColor;
  }, [spaceColor]);

  const bubbleColor = useMemo(() => {
    const rgb = hexToRgb(spaceColor);
    return rgb ? rgbToHex(mixWithWhite(rgb, 0.8)) : spaceColor;
  }, [spaceColor]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newThreadName, setNewThreadName] = useState("");
  const [threadJoinedAt, setThreadJoinedAt] = useState<number>(Date.now());
  const [currentUserPosition, setCurrentUserPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const viewZoomRef = useRef(1);
  const hasSpawnedRef = useRef(false);

  const currentThread = useMemo(
    () => threads.find((t) => t._id === currentThreadId) ?? null,
    [threads, currentThreadId]
  );

  useEffect(() => {
    if (currentThreadId) setThreadJoinedAt(Date.now());
  }, [currentThreadId]);

  const { messages: threadMessages } = useThreadMessages(currentThreadId, {
    since: threadJoinedAt,
    limit: 120,
  });

  const speechBubbles = useMemo(() => {
    if (!currentThreadId) return undefined;
    const activeIds = new Set<string>();
    for (const p of presence) {
      if (p.currentThreadId === currentThreadId) activeIds.add(p.userId);
    }

    const byUser = new Map<string, { userId: Id<"users">; body: string; createdAt: number }>();
    for (let i = threadMessages.length - 1; i >= 0; i--) {
      const m = threadMessages[i];
      if (!activeIds.has(m.userId)) continue;
      if (byUser.has(m.userId)) continue;
      byUser.set(m.userId, { userId: m.userId, body: m.body, createdAt: m.createdAt });
    }

    return [...byUser.values()];
  }, [currentThreadId, presence, threadMessages]);

  const handleViewTransform = useCallback(
    ({ zoom }: { bubbleCenter: { x: number; y: number }; zoom: number }) => {
      viewZoomRef.current = zoom;
    },
    []
  );


  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxZoom = useMemo(() => {
    return Math.min(viewport.width, viewport.height) / (bubbleRadius * 2);
  }, [bubbleRadius, viewport.height, viewport.width]);

  const minZoom = Math.max(0.8, Math.min(2.2, maxZoom * 1.6));
  const zoomBounds = { min: minZoom, max: maxZoom };


  useEffect(() => {
    onCurrentUserPositionChange?.(currentUserPosition);
  }, [currentUserPosition, onCurrentUserPositionChange]);

  useEffect(() => {
    if (hasSpawnedRef.current) return;
    const radius = Math.max(20, bubbleRadius * 0.2);
    const angle = Math.random() * Math.PI * 2;
    hasSpawnedRef.current = true;
    setCurrentUserPosition({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }, [bubbleRadius]);


  useEffect(() => {
    setCurrentUserPosition((prev) => {
      const maxRadius = Math.max(0, bubbleRadius - 16);
      const dist = Math.hypot(prev.x, prev.y);
      if (dist <= maxRadius) return prev;
      if (dist === 0) return prev;
      const scale = maxRadius / dist;
      return { x: prev.x * scale, y: prev.y * scale };
    });
  }, [bubbleRadius]);

  useKeyboardNav({
    onPan: (dx, dy) => {
      if (!currentUserId) return;
      const zoom = Math.max(0.001, viewZoomRef.current || 1);
      const stepX = dx / zoom;
      const stepY = dy / zoom;

      setCurrentUserPosition((prev) => {
        const next = { x: prev.x + stepX, y: prev.y + stepY };
        const maxRadius = Math.max(0, bubbleRadius - 16);
        const dist = Math.hypot(next.x, next.y);
        if (dist <= maxRadius) return next;
        if (dist === 0) return prev;
        const scale = maxRadius / dist;
        return { x: next.x * scale, y: next.y * scale };
      });
    },
    onZoom: () => {},
    enabled: Boolean(currentUserId),
    panSpeed: 320,
  });

  return (
    <div className="fixed inset-0 z-50">
      {/* Bubble canvas */}
      <div className="absolute inset-0">
        <SpeckField
          presence={presence}
          currentUserId={currentUserId}
          currentThreadId={currentThreadId}
          bubbleColor={bubbleColor}
          bubbleRadius={bubbleRadius}
          outsideColor="#ffffff"
          currentUserPosition={currentUserPosition}
          speechBubbles={speechBubbles}
          keyboardEnabled={false}
          zoomBounds={zoomBounds}
          initialZoom={minZoom}
          onSpeckClick={(userId) => {
            if (!onRequestDm || !currentUserId) return;
            if (userId === currentUserId) return;
            void Promise.resolve(onRequestDm(userId)).catch(() => {});
          }}
          onViewTransform={handleViewTransform}
        />
        <div className="absolute inset-y-16 left-0 w-[320px] bg-gradient-to-r from-[#3D3637]/65 via-[#3D3637]/30 to-transparent pointer-events-none" />
      </div>

      <div className="absolute left-0 top-16 bottom-0 w-[300px] z-20 pointer-events-auto">
        <ThreadSidebar
          threads={threads}
          memberThreadIds={memberThreadIds}
          onCreateThread={onCreateThread}
          onJoinThread={onJoinThread}
          onLeaveThread={onLeaveThread}
        />
      </div>

      {/* Header */}
      <div className="absolute top-16 left-0 right-0 z-10 p-4 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3 rounded-full bg-[#3D3637]/85 backdrop-blur-md border border-white/10 px-4 py-2 shadow-lg ml-[300px]">
            <div
              className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20"
              style={{ backgroundColor: calmSpaceColor }}
            />
            <h2 className="text-xl font-semibold text-white">{spaceName}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-[#3D3637]/85 backdrop-blur-md border border-white/10 text-white/90 hover:text-white hover:bg-[#3D3637]/95 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New thread
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#3D3637] border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Create a thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Thread name..."
                    value={newThreadName}
                    onChange={(e) => setNewThreadName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newThreadName.trim()) {
                        onCreateThread(newThreadName.trim());
                        setNewThreadName("");
                        setCreateDialogOpen(false);
                      }
                    }}
                    className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setCreateDialogOpen(false)}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!newThreadName.trim()) return;
                        onCreateThread(newThreadName.trim());
                        setNewThreadName("");
                        setCreateDialogOpen(false);
                      }}
                      disabled={!newThreadName.trim()}
                      className="bg-white text-slate-900 hover:bg-white/90"
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="bg-[#3D3637]/85 backdrop-blur-md border border-white/10 text-white/90 hover:text-white hover:bg-[#3D3637]/95 shadow-sm"
            >
              <X className="w-5 h-5 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-[#3D3637]/60 backdrop-blur rounded-xl p-3 space-y-2 pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <div className="w-3 h-3 rounded-full bg-[#FAF5F2]" />
          <span>You</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <div className="w-2 h-2 rounded-full bg-[#FAF5F2]" />
          <span>Active in thread</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <div className="w-2 h-2 rounded-full bg-[#C4B8B0]" />
          <span>Not in thread</span>
        </div>
      </div>

      {/* Thread overlay */}
      {currentThreadId && (
        <ThreadOverlay
          threadId={currentThreadId}
          threadName={currentThread?.name ?? "Thread"}
          presence={presence}
          currentUserId={currentUserId}
          joinedAt={threadJoinedAt}
          currentUserPosition={currentUserPosition}
          spaceColor={spaceColor}
          onRequestDm={onRequestDm}
          onClose={onCloseThread}
          onLeave={() => {
            onLeaveThread(currentThreadId);
            onCloseThread();
          }}
        />
      )}
    </div>
  );
}
