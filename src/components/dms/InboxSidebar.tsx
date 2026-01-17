import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Inbox, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useDmMessages,
  useDmMutations,
  useDmNameConsent,
  useIncomingDmRequests,
  useMyDmConversations,
  useOutgoingDmRequests,
} from "@/hooks/useDirectMessages";
import type { Id } from "../../../convex/_generated/dataModel";

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

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface InboxSidebarProps {
  open: boolean;
  currentUserId: Id<"users">;
  activeConversationId: Id<"dmConversations"> | null;
  onClose: () => void;
  onSelectConversation: (conversationId: Id<"dmConversations">) => void;
  onBackToInbox: () => void;
}

export function InboxSidebar({
  open,
  currentUserId,
  activeConversationId,
  onClose,
  onSelectConversation,
  onBackToInbox,
}: InboxSidebarProps) {
  const userIdForQueries = open ? currentUserId : null;

  const { requests: incoming } = useIncomingDmRequests(userIdForQueries);
  const { requests: outgoing } = useOutgoingDmRequests(userIdForQueries);
  const { conversations } = useMyDmConversations(userIdForQueries);
  const { respondToDmRequest } = useDmMutations();

  const [isResponding, setIsResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 top-16 z-[190] ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/35 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-[420px] max-w-[92vw] bg-slate-950/90 border-l border-white/10 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <Inbox className="w-4 h-4 text-white/70" />
              <div className="text-sm font-semibold text-white truncate">Inbox</div>
              {incoming.length > 0 && !activeConversationId && (
                <div className="ml-1 text-[11px] text-white/60">
                  ({incoming.length} request{incoming.length === 1 ? "" : "s"})
                </div>
              )}
            </div>
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

          {/* Body */}
          <div className="flex-1 min-h-0">
            {activeConversationId ? (
              <InboxConversationView
                conversationId={activeConversationId}
                currentUserId={currentUserId}
                onBack={onBackToInbox}
              />
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4 space-y-5">
                  {incoming.length > 0 && (
                    <section className="space-y-2">
                      <div className="text-xs text-white/60">Requests</div>
                      {incoming.map((r) => (
                        <div
                          key={r._id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm text-white truncate">New request</div>
                            <div className="text-[11px] text-white/50">
                              {formatTimeAgo(r.createdAt)} ago
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
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
                                  if (res.conversationId) onSelectConversation(res.conversationId);
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
                    </section>
                  )}

                  {incoming.length > 0 && (outgoing.length > 0 || conversations.length > 0) && (
                    <Separator className="bg-white/10" />
                  )}

                  {outgoing.length > 0 && (
                    <section className="space-y-2">
                      <div className="text-xs text-white/60">Sent</div>
                      <div className="text-sm text-white/70">
                        Pending: <span className="text-white">{outgoing.length}</span>
                      </div>
                    </section>
                  )}

                  {(outgoing.length > 0 && conversations.length > 0) && (
                    <Separator className="bg-white/10" />
                  )}

                  <section className="space-y-2">
                    <div className="text-xs text-white/60">Chats</div>
                    {conversations.length === 0 ? (
                      <div className="text-sm text-white/50">No chats yet</div>
                    ) : (
                      <div className="space-y-2">
                        {conversations.map((c) => (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => onSelectConversation(c._id)}
                            className="w-full text-left rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm text-white">Direct message</div>
                              <div className="text-[11px] text-white/50">
                                {formatTimeAgo(c.acceptedAt)} ago
                              </div>
                            </div>
                            <div className="text-[11px] text-white/50 truncate">
                              Anonymous 1-on-1
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InboxConversationView({
  conversationId,
  currentUserId,
  onBack,
}: {
  conversationId: Id<"dmConversations">;
  currentUserId: Id<"users">;
  onBack: () => void;
}) {
  const { messages } = useDmMessages(conversationId, currentUserId, { limit: 200 });
  const { shareName } = useDmNameConsent(conversationId, currentUserId);
  const { sendDmMessage, setDmNameConsent } = useDmMutations();

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTogglingName, setIsTogglingName] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatNearBottomRef = useRef(true);

  useEffect(() => {
    chatNearBottomRef.current = true;
    setDraft("");
  }, [conversationId]);

  const speechPreview = useMemo(() => {
    const latest = messages[messages.length - 1];
    if (!latest) return null;
    if (latest.senderId === currentUserId) return null;
    return latest.body;
  }, [messages, currentUserId]);

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const thresholdPx = 40;
    chatNearBottomRef.current =
      el.scrollTop + el.clientHeight >= el.scrollHeight - thresholdPx;
  };

  useEffect(() => {
    const bottom = chatBottomRef.current;
    const last = messages[messages.length - 1];
    if (!bottom || !last) return;

    const shouldStick = chatNearBottomRef.current || last.senderId === currentUserId;
    if (shouldStick) {
      bottom.scrollIntoView({ block: "end", behavior: "auto" });
    }
  }, [messages, currentUserId]);

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
    <div className="h-full flex flex-col">
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="text-sm font-semibold text-white truncate">Direct message</div>
        </div>

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
      </div>

      {speechPreview && (
        <div className="px-4 py-2 border-b border-white/10 text-xs text-white/60 truncate">
          Latest: <span className="text-white/80">{speechPreview}</span>
        </div>
      )}

      <div
        ref={chatScrollRef}
        onScroll={handleChatScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4"
      >
        <div className="space-y-3">
          {messages.map((m) => {
            const isMine = m.senderId === currentUserId;
            return (
              <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
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
          <div ref={chatBottomRef} />
        </div>
      </div>

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
  );
}
