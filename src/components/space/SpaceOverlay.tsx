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
import { useThreadMessages } from "@/hooks/useThreadMessages";
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
  onScreenToWorldReady?: (
    screenToWorld: (x: number, y: number) => { x: number; y: number }
  ) => void;
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
  onScreenToWorldReady,
}: SpaceOverlayProps) {
  const bubbleRadius = 260 + Math.sqrt(Math.max(1, presence.length)) * 120;
  const calmSpaceColor = useMemo(() => {
    const rgb = hexToRgb(spaceColor);
    return rgb ? rgbToHex(mixWithWhite(rgb, 0.9)) : spaceColor;
  }, [spaceColor]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newThreadName, setNewThreadName] = useState("");
  const [threadJoinedAt, setThreadJoinedAt] = useState<number>(Date.now());

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

  const threadAnchorRef = useRef<HTMLDivElement>(null);
  const handleViewTransform = useCallback(
    ({ bubbleCenter, zoom }: { bubbleCenter: { x: number; y: number }; zoom: number }) => {
      const anchor = threadAnchorRef.current;
      if (!anchor) return;
      anchor.style.transform = `translate(${bubbleCenter.x}px, ${bubbleCenter.y}px)`;
      anchor.style.setProperty("--zoom", `${zoom}`);
      anchor.style.setProperty("--invZoom", `${zoom ? 1 / zoom : 1}`);
    },
    []
  );

  const threadRingRadius = Math.max(140, Math.min(240, 120 + threads.length * 6));

  return (
    <div className="fixed inset-0 z-50">
      {/* Bubble canvas */}
      <div className="absolute inset-0">
        <SpeckField
          presence={presence}
          currentUserId={currentUserId}
          currentThreadId={currentThreadId}
          bubbleColor={spaceColor}
          bubbleRadius={bubbleRadius}
          outsideColor="#ffffff"
          speechBubbles={speechBubbles}
          onSpeckClick={(userId) => {
            if (!onRequestDm || !currentUserId) return;
            if (userId === currentUserId) return;
            void Promise.resolve(onRequestDm(userId)).catch(() => {});
          }}
          onViewTransform={handleViewTransform}
          onScreenToWorldReady={onScreenToWorldReady}
        />
      </div>

      {/* Thread specks around you */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div
          ref={threadAnchorRef}
          className="absolute left-0 top-0 pointer-events-none will-change-transform"
          style={{ transform: "translate(50vw, 50vh)" }}
        >
          <div
            className="relative pointer-events-none"
            style={{ transform: "scale(var(--zoom, 1))", transformOrigin: "0 0" }}
          >
            {threads.map((thread, index) => {
              const angle =
                (index / Math.max(1, threads.length)) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(angle) * threadRingRadius;
              const y = Math.sin(angle) * threadRingRadius;

              const baseSize = 12;
              const size = Math.max(
                10,
                Math.min(22, baseSize + Math.sqrt(thread.memberCount) * 4)
              );
              const isActive = currentThreadId === thread._id;
              const isMember = memberThreadIds.has(thread._id);

              return (
                <button
                  key={thread._id}
                  type="button"
                  title={thread.name}
                  onClick={() => onJoinThread(thread._id)}
                  className={`pointer-events-auto absolute left-0 top-0 rounded-full transition-all ${
                    isActive
                      ? "bg-[#FAF5F2] shadow-[0_0_0_4px_rgba(250,245,242,0.15)]"
                      : isMember
                        ? "bg-[#FAF5F2]/60 hover:bg-[#FAF5F2]/80"
                        : "bg-[#C4B8B0]/60 hover:bg-[#C4B8B0]/80"
                  }`}
                  style={{
                    width: size,
                    height: size,
                    transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(var(--invZoom, 1))`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-16 left-0 right-0 z-10 p-4 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3 rounded-full bg-[#3D3637]/85 backdrop-blur-md border border-white/10 px-4 py-2 shadow-lg">
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
