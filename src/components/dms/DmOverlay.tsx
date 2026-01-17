import { useEffect, useMemo, useState } from "react";
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

  const [pendingMessages, setPendingMessages] = useState<
    Array<{
      _id: string;
      conversationId: Id<"dmConversations">;
      senderId: Id<"users">;
      body: string;
      createdAt: number;
      displayName?: string | null;
      isPending: true;
      serverId?: string;
    }>
  >([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTogglingName, setIsTogglingName] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  useEffect(() => {
    setPendingMessages([]);
    setModerationWarning(null);
  }, [conversationId]);

  const displayMessages = useMemo(() => {
    const serverIds = new Set(messages.map((m) => m._id));
    const pending = pendingMessages.filter((p) => !p.serverId || !serverIds.has(p.serverId as any));
    return [...messages, ...pending].sort((a, b) => a.createdAt - b.createdAt);
  }, [messages, pendingMessages]);

  useEffect(() => {
    const serverIds = new Set(messages.map((m) => m._id));
    setPendingMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.filter((p) => !p.serverId || !serverIds.has(p.serverId as any));
      return next.length === prev.length ? prev : next;
    });
  }, [messages]);

  useEffect(() => {
    if (!moderationWarning) return;
    const id = window.setTimeout(() => setModerationWarning(null), 6000);
    return () => window.clearTimeout(id);
  }, [moderationWarning]);

  const makePendingId = () => {
    const randomPart =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto as any).randomUUID()
        : Math.random().toString(16).slice(2);
    return `pending-${Date.now()}-${randomPart}`;
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;

    const pendingId = makePendingId();
    const pendingCreatedAt = Date.now();

    setDraft("");
    setIsSending(true);
    setPendingMessages((prev) => [
      ...prev,
      {
        _id: pendingId,
        conversationId,
        senderId: currentUserId,
        body,
        createdAt: pendingCreatedAt,
        displayName: null,
        isPending: true,
      },
    ]);
    try {
      const res = await sendDmMessage({ conversationId, userId: currentUserId, body });
      if ((res as any)?.status === "blocked") {
        setPendingMessages((prev) => prev.filter((p) => p._id !== pendingId));
        setModerationWarning((res as any)?.warning ?? "Message blocked.");
        return;
      }
      if ((res as any)?.status === "sent") {
        const serverId = (res as any)?.messageId as string | undefined;
        if (serverId) {
          setPendingMessages((prev) =>
            prev.map((p) => (p._id === pendingId ? { ...p, serverId } : p))
          );
        } else {
          setPendingMessages((prev) => prev.filter((p) => p._id !== pendingId));
        }
      }
    } catch {
      setPendingMessages((prev) => prev.filter((p) => p._id !== pendingId));
      setModerationWarning("Message failed to send.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-[#3D3637]/40 backdrop-blur-sm" />

      <div className="absolute inset-0 flex">
        {/* Chat */}
        <div className="w-[420px] max-w-[90vw] h-full bg-[#3D3637]/90 border-r border-white/10 flex flex-col">
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
              {displayMessages.map((m) => {
                const isPending = Boolean((m as any).isPending);
                const isMine = m.senderId === currentUserId;
                return (
                  <div
                    key={m._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        isMine ? "bg-[#FAF5F2] text-[#3D3637]" : "bg-white/10 text-white"
                      } ${isPending ? "opacity-70" : ""}`}
                    >
                      <div className="text-[11px] opacity-70 mb-1">
                        {m.displayName ? `${m.displayName} • ` : ""}
                        {formatTime(m.createdAt)}
                        {isPending ? " • Sending..." : ""}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="border-t border-white/10">
            {moderationWarning && (
              <div className="px-4 pt-3 text-xs text-red-200">{moderationWarning}</div>
            )}
            <div className="p-4 flex gap-2">
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
                className="bg-[#FAF5F2] text-[#3D3637] hover:bg-[#FAF5F2]/90"
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* Context area */}
        <div className="flex-1 bg-[#FDF8F5]" />
      </div>
    </div>
  );
}
