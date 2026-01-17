import { useCallback, useMemo, useRef, useState } from "react";
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
import type { Id } from "../../../convex/_generated/dataModel";

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
  onScreenToWorldReady,
}: SpaceOverlayProps) {
  const bubbleRadius = 260 + Math.sqrt(Math.max(1, presence.length)) * 120;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newThreadName, setNewThreadName] = useState("");

  const currentThread = useMemo(
    () => threads.find((t) => t._id === currentThreadId) ?? null,
    [threads, currentThreadId]
  );

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
          outsideColor="#d1d5db"
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
                      ? "bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.15)]"
                      : isMember
                        ? "bg-white/60 hover:bg-white/80"
                        : "bg-gray-300/60 hover:bg-gray-200/80"
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
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20"
              style={{ backgroundColor: spaceColor }}
            />
            <h2 className="text-xl font-semibold text-white">{spaceName}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-200 hover:text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New thread
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-950 border-white/10">
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
              className="text-slate-200 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur rounded-lg p-3 space-y-2 pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <div className="w-3 h-3 rounded-full bg-white" />
          <span>You</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <div className="w-2 h-2 rounded-full bg-white" />
          <span>Active in thread</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
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
