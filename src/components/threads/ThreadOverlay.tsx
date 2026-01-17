import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useThreadChatters,
  useThreadMessageMutations,
  useThreadMessages,
} from "@/hooks/useThreadMessages";
import type { Id } from "../../../convex/_generated/dataModel";

interface PresenceUser {
  _id: Id<"spacePresence">;
  userId: Id<"users">;
  position: { x: number; y: number };
  currentThreadId?: Id<"spaceThreads">;
}

interface ThreadOverlayProps {
  threadId: Id<"spaceThreads">;
  threadName: string;
  presence: PresenceUser[];
  currentUserId: Id<"users"> | null;
  onClose: () => void;
  onLeave: () => void;
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function anonLabel(userId: string): string {
  const suffix = hashString(userId).toString(36).toUpperCase().slice(0, 4);
  return `Anon ${suffix}`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface Participant {
  userId: Id<"users">;
  isActive: boolean;
  isCurrentUser: boolean;
}

function ThreadParticipantsCanvas({ participants }: { participants: Participant[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = dimensions.width;
    const height = dimensions.height;
    if (width === 0 || height === 0) return;

    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const minDim = Math.min(width, height);
    const ringRadius = Math.max(90, minDim * 0.3);
    const jitter = Math.max(30, minDim * 0.12);

    for (const participant of participants) {
      const h1 = hashString(`${participant.userId}-a`) / 0xffffffff;
      const h2 = hashString(`${participant.userId}-b`) / 0xffffffff;
      const angle = h1 * Math.PI * 2;
      const r = ringRadius + (h2 - 0.5) * jitter;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      const radius = participant.isCurrentUser ? 9 : 7;
      const fillColor = participant.isActive ? "#ffffff" : "#9ca3af";

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (participant.isCurrentUser) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [participants, dimensions]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

export function ThreadOverlay({
  threadId,
  threadName,
  presence,
  currentUserId,
  onClose,
  onLeave,
}: ThreadOverlayProps) {
  const { messages } = useThreadMessages(threadId);
  const { chatters } = useThreadChatters(threadId);
  const { sendThreadMessage } = useThreadMessageMutations();

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const participants = useMemo<Participant[]>(() => {
    const activeIds = new Set<string>();
    for (const p of presence) {
      if (p.currentThreadId === threadId) activeIds.add(p.userId);
    }

    const allIds = new Set<string>();
    for (const id of chatters) allIds.add(id);
    for (const id of activeIds) allIds.add(id);

    return [...allIds]
      .sort()
      .map((id) => ({
        userId: id as Id<"users">,
        isActive: activeIds.has(id),
        isCurrentUser: id === currentUserId,
      }));
  }, [presence, chatters, threadId, currentUserId]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !currentUserId) return;

    setDraft("");
    setIsSending(true);
    try {
      await sendThreadMessage({ threadId, userId: currentUserId, body });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="absolute inset-0 flex">
        {/* Chat */}
        <div className="w-[420px] max-w-[90vw] h-full bg-slate-950/85 border-r border-white/10 flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <div className="min-w-0">
              <div className="text-xs text-white/60">Thread</div>
              <div className="text-base font-semibold text-white truncate">{threadName}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeave}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Leave
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
                const isMine = Boolean(currentUserId) && m.userId === currentUserId;
                return (
                  <div
                    key={m._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        isMine
                          ? "bg-white text-slate-900"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <div className="text-[11px] opacity-70 mb-1">
                        {isMine ? "You" : anonLabel(m.userId)} • {formatTime(m.createdAt)}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
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
              disabled={isSending || !draft.trim() || !currentUserId}
              className="bg-white text-slate-900 hover:bg-white/90"
            >
              Send
            </Button>
          </div>
        </div>

        {/* Participants canvas */}
        <div className="flex-1">
          <ThreadParticipantsCanvas participants={participants} />
        </div>
      </div>
    </div>
  );
}
