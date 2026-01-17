import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDmMessages, useDmMutations, useDmNameConsent } from "@/hooks/useDirectMessages";
import type { Id } from "../../../convex/_generated/dataModel";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface DmOverlayProps {
  conversationId: Id<"dmConversations">;
  currentUserId: Id<"users">;
  openedAt: number;
  onClose: () => void;
}

export function DmOverlay({ conversationId, currentUserId, openedAt, onClose }: DmOverlayProps) {
  const { messages } = useDmMessages(conversationId, currentUserId, {
    since: openedAt,
    limit: 200,
  });
  const { shareName } = useDmNameConsent(conversationId, currentUserId);
  const { sendDmMessage, setDmNameConsent } = useDmMutations();

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTogglingName, setIsTogglingName] = useState(false);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;

    setDraft("");
    setIsSending(true);
    try {
      await sendDmMessage({ conversationId, userId: currentUserId, body });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="absolute inset-0 flex">
        {/* Chat */}
        <div className="w-[420px] max-w-[90vw] h-full bg-slate-950/85 border-r border-white/10 flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <div className="min-w-0">
              <div className="text-xs text-white/60">Direct message</div>
              <div className="text-base font-semibold text-white truncate">1-on-1</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isTogglingName}
                onClick={async () => {
                  setIsTogglingName(true);
                  try {
                    await setDmNameConsent({
                      conversationId,
                      userId: currentUserId,
                      shareName: !shareName,
                    });
                  } finally {
                    setIsTogglingName(false);
                  }
                }}
                className="text-white/70 hover:text-white hover:bg-white/10"
                title="Reveal or hide your name in this DM"
              >
                {shareName ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {shareName ? "Hide name" : "Share name"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((m) => {
                const isMine = m.senderId === currentUserId;
                return (
                  <div
                    key={m._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        isMine ? "bg-white text-slate-900" : "bg-white/10 text-white"
                      }`}
                    >
                      <div className="text-[11px] opacity-70 mb-1">
                        {m.displayName ? `${m.displayName} • ` : ""}
                        {formatTime(m.createdAt)}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/10 flex gap-2">
            <Input
              value={draft}
              placeholder="Say something..."
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !draft.trim()}
              className="bg-white text-slate-900 hover:bg-white/90"
            >
              Send
            </Button>
          </div>
        </div>

        {/* Context area */}
        <div className="flex-1 bg-gray-300" />
      </div>
    </div>
  );
}

