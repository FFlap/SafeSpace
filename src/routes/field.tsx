import { useState, useCallback, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Inbox } from "lucide-react";
import { BubbleField } from "@/components/canvas/BubbleField";
import { SpaceOverlay } from "@/components/space/SpaceOverlay";
import { InboxSidebar } from "@/components/dms/InboxSidebar";
import { Button } from "@/components/ui/button";
import { useSpaces, useSpace } from "@/hooks/useSpaces";
import { useThreads, useMyThreadMemberships, useThreadMutations } from "@/hooks/useThreads";
import { usePresence, useSpacePresence } from "@/hooks/usePresence";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDmMutations, useIncomingDmRequests } from "@/hooks/useDirectMessages";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/field")({
  component: FieldPage,
});

function FieldPage() {
  const navigate = useNavigate();
  const { spaces, isLoading: spacesLoading } = useSpaces();
  const { user } = useCurrentUser();

  const [selectedSpaceId, setSelectedSpaceId] = useState<Id<"spaces"> | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<Id<"spaceThreads"> | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [activeDmConversationId, setActiveDmConversationId] = useState<
    Id<"dmConversations"> | null
  >(null);
  const screenToWorldRef = useRef<
    ((x: number, y: number) => { x: number; y: number }) | null
  >(null);

  const handleScreenToWorldReady = useCallback(
    (fn: (x: number, y: number) => { x: number; y: number }) => {
      screenToWorldRef.current = fn;
    },
    []
  );

  const screenToWorld = useCallback((x: number, y: number) => {
    const fn = screenToWorldRef.current;
    return fn ? fn(x, y) : { x, y };
  }, []);

  const { space: selectedSpace } = useSpace(selectedSpaceId);
  const { threads } = useThreads(selectedSpaceId);
  const { presence } = useSpacePresence(selectedSpaceId);
  const { memberThreadIds } = useMyThreadMemberships(user?._id ?? null);
  const { createThread, joinThread, leaveThread } = useThreadMutations();
  const { requestDm } = useDmMutations();
  const { requests: incomingDmRequests } = useIncomingDmRequests(user?._id ?? null);

  // Presence tracking
  usePresence({
    spaceId: selectedSpaceId,
    userId: user?._id ?? null,
    currentThreadId,
    enabled: !!selectedSpaceId && !!user,
    screenToWorld,
  });

  const handleSpaceClick = useCallback((spaceId: string) => {
    setSelectedSpaceId(spaceId as Id<"spaces">);
    setCurrentThreadId(null);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setSelectedSpaceId(null);
    setCurrentThreadId(null);
  }, []);

  const handleCreateThread = useCallback(
    async (name: string) => {
      if (!selectedSpaceId || !user) return;

      const threadId = await createThread({
        spaceId: selectedSpaceId,
        name,
        userId: user._id,
      });

      setCurrentThreadId(threadId);
    },
    [selectedSpaceId, user, createThread]
  );

  const handleJoinThread = useCallback(
    async (threadId: Id<"spaceThreads">) => {
      if (!user) return;

      await joinThread({
        threadId,
        userId: user._id,
      });
      setCurrentThreadId(threadId);
    },
    [user, joinThread]
  );

  const handleLeaveThread = useCallback(
    async (threadId: Id<"spaceThreads">) => {
      if (!user) return;

      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
      }

      await leaveThread({
        threadId,
        userId: user._id,
      });
    },
    [user, leaveThread, currentThreadId]
  );

  const handleCloseThread = useCallback(() => {
    setCurrentThreadId(null);
  }, []);

  const handleCloseInbox = useCallback(() => setInboxOpen(false), []);
  const handleBackToInbox = useCallback(() => setActiveDmConversationId(null), []);

  const handleOpenDmConversation = useCallback((conversationId: Id<"dmConversations">) => {
    setActiveDmConversationId(conversationId);
    setInboxOpen(true);
  }, []);

  const handleRequestDm = useCallback(
    async (otherUserId: Id<"users">) => {
      if (!user?._id) return;
      const res = (await requestDm({
        fromUserId: user._id,
        toUserId: otherUserId,
      })) as { conversationId: Id<"dmConversations"> | null; requestId: string | null };

      setInboxOpen(true);
      setActiveDmConversationId(res.conversationId ?? null);
    },
    [user?._id, requestDm]
  );

  // Loading state
  if (spacesLoading) {
    return (
      <div className="h-screen w-screen bg-[#3D3637] flex items-center justify-center">
        <div className="text-[#C4B8B0] text-lg">Loading spaces...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <SignedOut>
        <div className="absolute inset-0 bg-[#3D3637]/90 backdrop-blur flex items-center justify-center z-50">
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-white">Welcome to Bubble Spaces</h2>
            <p className="text-[#C4B8B0]">Sign in to join the conversation</p>
            <SignInButton mode="modal">
              <button className="bg-[#9B8B7E] hover:bg-[#8A7A6E] px-6 py-3 rounded-xl font-medium text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-[200] h-16 px-4 flex items-center justify-between bg-[#3D3637]/95 border-b border-[#C4B8B0]/20 pointer-events-none">
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-xl font-bold text-white hover:text-[#C4B8B0] transition-colors pointer-events-auto"
          >
            HackTheBias
          </button>
          <div className="text-[#C4B8B0] text-sm pointer-events-auto hidden md:block">
            Use WASD or arrows to pan, +/- to zoom
          </div>
          <div className="pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInboxOpen((v) => !v)}
              className="text-white/80 hover:text-white hover:bg-white/10 relative"
            >
              <Inbox className="w-4 h-4 mr-2" />
              Inbox
              {incomingDmRequests.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                  {incomingDmRequests.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <BubbleField
          spaces={spaces}
          onSpaceClick={handleSpaceClick}
          overlayOpen={!!selectedSpaceId}
          onEscape={handleCloseOverlay}
        />

        {/* Space Overlay */}
        {selectedSpaceId && selectedSpace && (
          <SpaceOverlay
            spaceName={selectedSpace.name}
            spaceColor={selectedSpace.color}
            threads={threads}
            presence={presence}
            currentUserId={user?._id ?? null}
            currentThreadId={currentThreadId}
            memberThreadIds={memberThreadIds}
            onClose={handleCloseOverlay}
            onCloseThread={handleCloseThread}
            onCreateThread={handleCreateThread}
            onJoinThread={handleJoinThread}
            onLeaveThread={handleLeaveThread}
            onRequestDm={handleRequestDm}
            onScreenToWorldReady={handleScreenToWorldReady}
          />
        )}

        {user?._id && (
          <InboxSidebar
            open={inboxOpen}
            currentUserId={user._id}
            activeConversationId={activeDmConversationId}
            onClose={handleCloseInbox}
            onBackToInbox={handleBackToInbox}
            onSelectConversation={handleOpenDmConversation}
          />
        )}

        {/* Empty state */}
        {spaces.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-2">
              <p className="text-[#9B8B7E] text-lg">No spaces yet</p>
              <p className="text-[#C4B8B0] text-sm">
                Run the seed action to populate spaces
              </p>
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}
