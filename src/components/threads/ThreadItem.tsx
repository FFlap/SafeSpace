import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Id } from "../../../convex/_generated/dataModel";

interface ThreadItemProps {
  thread: {
    _id: Id<"spaceThreads">;
    name: string;
    memberCount: number;
    lastActiveAt: number;
  };
  isMember: boolean;
  onJoin: (threadId: Id<"spaceThreads">) => void;
  onLeave: (threadId: Id<"spaceThreads">) => void;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ThreadItem({
  thread,
  isMember,
  onJoin,
  onLeave,
}: ThreadItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{thread.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Users className="w-3 h-3" />
            {thread.memberCount}
          </span>
          <span className="text-xs text-slate-500">
            {formatTimeAgo(thread.lastActiveAt)}
          </span>
        </div>
      </div>

      {isMember ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLeave(thread._id)}
          className="text-slate-400 hover:text-white hover:bg-slate-700"
        >
          Leave
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onJoin(thread._id)}
          className="text-indigo-400 hover:text-indigo-300 hover:bg-slate-700"
        >
          Join
        </Button>
      )}
    </div>
  );
}
