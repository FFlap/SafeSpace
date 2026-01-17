import { ThreadItem } from "./ThreadItem";
import type { Id } from "../../../convex/_generated/dataModel";

interface Thread {
  _id: Id<"spaceThreads">;
  name: string;
  memberCount: number;
  lastActiveAt: number;
}

interface ThreadListProps {
  threads: Thread[];
  memberThreadIds: Set<string>;
  onJoin: (threadId: Id<"spaceThreads">) => void;
  onLeave: (threadId: Id<"spaceThreads">) => void;
  searchTerm: string;
}

export function ThreadList({
  threads,
  memberThreadIds,
  onJoin,
  onLeave,
  searchTerm,
}: ThreadListProps) {
  const filteredThreads = threads.filter((thread) =>
    thread.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredThreads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-white/70">
        <p className="text-sm">
          {searchTerm ? "No threads found" : "No threads yet"}
        </p>
        <p className="text-xs mt-1 text-white/50">Create one to start a conversation</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredThreads.map((thread) => (
        <ThreadItem
          key={thread._id}
          thread={thread}
          isMember={memberThreadIds.has(thread._id)}
          onJoin={onJoin}
          onLeave={onLeave}
        />
      ))}
    </div>
  );
}
