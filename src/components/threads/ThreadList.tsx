import { ThreadItem } from "./ThreadItem";
import type { Id } from "../../../convex/_generated/dataModel";

interface Thread {
  _id: Id<"spaceThreads">;
  description?: string;
  name?: string; // Deprecated: for backwards compatibility
  memberCount: number;
  lastActiveAt: number;
}

interface ThreadListProps {
  threads: Thread[];
  onThreadClick: (threadId: Id<"spaceThreads">) => void;
  searchTerm: string;
}

export function ThreadList({
  threads,
  onThreadClick,
  searchTerm,
}: ThreadListProps) {
  const normalizedSearchTerm = (searchTerm ?? "").toLowerCase();

  const filteredThreads = threads.filter((thread) =>
    (thread.description ?? thread.name ?? "").toLowerCase().includes(normalizedSearchTerm)
  );

  if (filteredThreads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-white/70">
        <p className="text-sm">
          {searchTerm ? "No talks found" : "No talks yet"}
        </p>
        <p className="text-xs mt-1 text-white/50">Create one to start a conversation</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 w-full min-w-0">
      {filteredThreads.map((thread) => (
        <ThreadItem
          key={thread._id}
          thread={thread}
          onClick={onThreadClick}
        />
      ))}
    </div>
  );
}
