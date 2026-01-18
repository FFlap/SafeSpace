import { Users } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface ThreadItemProps {
  thread: {
    _id: Id<"spaceThreads">;
    description?: string;
    name?: string; // Deprecated: for backwards compatibility
    memberCount: number;
    lastActiveAt: number;
  };
  onClick: (threadId: Id<"spaceThreads">) => void;
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
  onClick,
}: ThreadItemProps) {
  return (
    <div
      className="p-3 rounded-2xl bg-white/5 hover:bg-white/12 border border-white/5 hover:border-white/15 transition-colors cursor-pointer min-w-0 w-full"
      onClick={() => onClick(thread._id)}
    >
      <h4 className="text-sm font-medium text-white overflow-hidden text-ellipsis whitespace-nowrap">{thread.description ?? thread.name}</h4>
      <div className="flex items-center gap-2 mt-1">
        <span className="flex items-center gap-1 text-xs text-white/60 flex-shrink-0">
          <Users className="w-3 h-3" />
          {thread.memberCount}
        </span>
        <span className="text-xs text-white/40 flex-shrink-0">
          {formatTimeAgo(thread.lastActiveAt)}
        </span>
      </div>
    </div>
  );
}
