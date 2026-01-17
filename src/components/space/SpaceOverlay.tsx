import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThreadSidebar } from "@/components/threads/ThreadSidebar";
import { SpeckField } from "@/components/canvas/SpeckField";
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
  onCreateThread,
  onJoinThread,
  onLeaveThread,
  onScreenToWorldReady,
}: SpaceOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ThreadSidebar
          threads={threads}
          memberThreadIds={memberThreadIds}
          onCreateThread={onCreateThread}
          onJoinThread={onJoinThread}
          onLeaveThread={onLeaveThread}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 relative bg-slate-900/98">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-slate-900 to-transparent z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: spaceColor }}
            />
            <h2 className="text-xl font-semibold text-white">{spaceName}</h2>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5 mr-1" />
            Exit
          </Button>
        </div>

        {/* Specks area */}
        <div className="absolute inset-0 pt-16">
          <SpeckField
            presence={presence}
            currentUserId={currentUserId}
            currentThreadId={currentThreadId}
            onScreenToWorldReady={onScreenToWorldReady}
          />
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-800/80 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>You</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span>Same thread</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span>Other threads</span>
          </div>
        </div>
      </div>
    </div>
  );
}
