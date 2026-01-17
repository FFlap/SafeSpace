import { useState } from "react";
import { MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDmMutations,
  useIncomingDmRequests,
  useOutgoingDmRequests,
} from "@/hooks/useDirectMessages";
import type { Id } from "../../../convex/_generated/dataModel";

interface DmRequestsPanelProps {
  currentUserId: Id<"users">;
  onOpenConversation: (conversationId: Id<"dmConversations">) => void;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function DmRequestsPanel({ currentUserId, onOpenConversation }: DmRequestsPanelProps) {
  const { requests: incoming } = useIncomingDmRequests(currentUserId);
  const { requests: outgoing } = useOutgoingDmRequests(currentUserId);
  const { respondToDmRequest } = useDmMutations();
  const [isResponding, setIsResponding] = useState<string | null>(null);

  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <div className="absolute left-4 bottom-4 z-[80] w-[320px] max-w-[90vw] rounded-xl bg-slate-950/80 backdrop-blur border border-white/10 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <MessageCircleMore className="w-4 h-4 text-white/70" />
        <div className="text-sm font-semibold text-white">Message requests</div>
      </div>

      <div className="p-3 space-y-3">
        {incoming.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-white/60">Incoming</div>
            {incoming.slice(0, 3).map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">New request</div>
                  <div className="text-[11px] text-white/50">
                    {formatTimeAgo(r.createdAt)} ago
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-white text-slate-900 hover:bg-white/90"
                    disabled={isResponding === r._id}
                    onClick={async () => {
                      setIsResponding(r._id);
                      try {
                        const res = (await respondToDmRequest({
                          requestId: r._id,
                          userId: currentUserId,
                          accept: true,
                        })) as { conversationId: Id<"dmConversations"> | null };
                        if (res.conversationId) onOpenConversation(res.conversationId);
                      } finally {
                        setIsResponding(null);
                      }
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/70 hover:text-white hover:bg-white/10"
                    disabled={isResponding === r._id}
                    onClick={async () => {
                      setIsResponding(r._id);
                      try {
                        await respondToDmRequest({
                          requestId: r._id,
                          userId: currentUserId,
                          accept: false,
                        });
                      } finally {
                        setIsResponding(null);
                      }
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {outgoing.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-white/60">Sent</div>
            <div className="text-sm text-white/70">
              Pending: <span className="text-white">{outgoing.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

