import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThreadSearch } from "./ThreadSearch";
import { ThreadList } from "./ThreadList";
import type { Id } from "../../../convex/_generated/dataModel";

interface Thread {
  _id: Id<"spaceThreads">;
  description?: string;
  name?: string; // Deprecated: for backwards compatibility
  memberCount: number;
  lastActiveAt: number;
}

interface ThreadSidebarProps {
  threads: Thread[];
  onCreateThread: (description: string) => void;
  onThreadClick: (threadId: Id<"spaceThreads">) => void;
}

export function ThreadSidebar({
  threads,
  onCreateThread,
  onThreadClick,
}: ThreadSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [newThreadDescription, setNewThreadDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateThread = () => {
    if (newThreadDescription.trim()) {
      onCreateThread(newThreadDescription.trim());
      setNewThreadDescription("");
      setDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#3D3637]/55 border-r border-white/10 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)]">
      <div className="p-4 space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Talks</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-[#9B8B7E]/80 hover:bg-[#9B8B7E] text-white rounded-full px-4"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#3D3637]/90 border-white/10 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-white">Start a Talk</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="What do you want to talk about?"
                  value={newThreadDescription}
                  onChange={(e) => setNewThreadDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateThread();
                  }}
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setDialogOpen(false)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateThread}
                    disabled={!newThreadDescription.trim()}
                    className="bg-white/90 text-slate-900 hover:bg-white"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ThreadSearch value={searchTerm} onChange={setSearchTerm} />
      </div>

      <Separator className="bg-white/10" />

      <ScrollArea className="flex-1 min-h-0 px-4 py-2 backdrop-blur">
        <div className="w-full min-w-0">
          <ThreadList
            threads={threads}
            onThreadClick={onThreadClick}
            searchTerm={searchTerm}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
