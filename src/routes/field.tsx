import { useState, useCallback, useRef, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Inbox } from "lucide-react";
import { useAction } from "convex/react";
import { BubbleField } from "@/components/canvas/BubbleField";
import { SpaceOverlay } from "@/components/space/SpaceOverlay";
import { InboxSidebar } from "@/components/dms/InboxSidebar";
import { Button } from "@/components/ui/button";
import { useSpaces, useSpace } from "@/hooks/useSpaces";
import {
  useThreads,
  useMyThreadMemberships,
  useThreadMutations,
} from "@/hooks/useThreads";
import { usePresence, useSpacePresence } from "@/hooks/usePresence";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useDmMutations,
  useIncomingDmRequests,
} from "@/hooks/useDirectMessages";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/field")({
  component: FieldPage,
});

function FieldPage() {
  const navigate = useNavigate();
  const { spaces, isLoading: spacesLoading } = useSpaces();
  const { user } = useCurrentUser();
  const createSpaceAndRecluster = useAction(
    api.spaces.actions.createSpaceAndRecluster,
  );
  const [spaceSearch, setSpaceSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [focusSpaceId, setFocusSpaceId] = useState<string | null>(null);
  const [focusRequestId, setFocusRequestId] = useState(0);

  const [selectedSpaceId, setSelectedSpaceId] = useState<Id<"spaces"> | null>(
    null,
  );
  const [currentThreadId, setCurrentThreadId] =
    useState<Id<"spaceThreads"> | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [activeDmConversationId, setActiveDmConversationId] =
    useState<Id<"dmConversations"> | null>(null);
  const currentUserPositionRef = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const handleCurrentUserPositionChange = useCallback(
    (pos: { x: number; y: number }) => {
      currentUserPositionRef.current = pos;
    },
    [],
  );

  const getCurrentUserPosition = useCallback(
    () => currentUserPositionRef.current,
    [],
  );

  const { space: selectedSpace } = useSpace(selectedSpaceId);
  const { threads } = useThreads(selectedSpaceId);
  const { presence } = useSpacePresence(selectedSpaceId);
  useMyThreadMemberships(user?._id ?? null);
  const { createThread, joinThread, leaveThread } = useThreadMutations();
  const { requestDm } = useDmMutations();
  const { requests: incomingDmRequests } = useIncomingDmRequests(
    user?._id ?? null,
  );

  // Presence tracking
  usePresence({
    spaceId: selectedSpaceId,
    userId: user?._id ?? null,
    currentThreadId,
    enabled: !!selectedSpaceId && !!user,
    getPosition: getCurrentUserPosition,
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
    async (description: string) => {
      if (!selectedSpaceId || !user) return;

      const threadId = await createThread({
        spaceId: selectedSpaceId,
        description,
        userId: user._id,
      });

      setCurrentThreadId(threadId);
    },
    [selectedSpaceId, user, createThread],
  );

  const handleThreadClick = useCallback(
    async (threadId: Id<"spaceThreads">) => {
      if (!user) return;

      // Join the thread for membership tracking
      await joinThread({
        threadId,
        userId: user._id,
      });
      setCurrentThreadId(threadId);
    },
    [user, joinThread],
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
    [user, leaveThread, currentThreadId],
  );

  const handleCloseThread = useCallback(() => {
    setCurrentThreadId(null);
  }, []);

  const handleCloseInbox = useCallback(() => setInboxOpen(false), []);
  const handleBackToInbox = useCallback(
    () => setActiveDmConversationId(null),
    [],
  );

  const normalizedSearch = (spaceSearch ?? "").trim().toLowerCase();
  const exactMatch = normalizedSearch
    ? spaces.find(
        (space) => space.name.trim().toLowerCase() === normalizedSearch,
      )
    : null;

  const matches = normalizedSearch
    ? spaces
        .filter((space) =>
          space.name.trim().toLowerCase().includes(normalizedSearch),
        )
        .slice(0, 5)
    : [];

  const resultsCount =
    matches.length + (normalizedSearch && !exactMatch ? 1 : 0);

  const tagsFromName = useCallback((name?: string | null) => {
    const tokens = String(name ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);

    return Array.from(new Set(tokens));
  }, []);

  const handleCreateSpace = useCallback(async () => {
    if (!normalizedSearch || exactMatch) return;

    const res = await createSpaceAndRecluster({
      name: spaceSearch.trim(),
      tags: tagsFromName(spaceSearch),
      color: "#9B8B7E",
    });

    setSpaceSearch("");
    setShowResults(false);
    setActiveResultIndex(0);
    handleSpaceClick(res.spaceId);
  }, [
    normalizedSearch,
    exactMatch,
    createSpaceAndRecluster,
    spaceSearch,
    tagsFromName,
    handleSpaceClick,
  ]);

  useEffect(() => {
    setActiveResultIndex(0);
  }, [normalizedSearch]);

  const handleSelectSpace = useCallback((spaceId: string) => {
    setSpaceSearch("");
    setShowResults(false);
    setFocusSpaceId(spaceId);
    setFocusRequestId((prev) => prev + 1);
  }, []);

  const handleOpenDmConversation = useCallback(
    (conversationId: Id<"dmConversations">) => {
      setActiveDmConversationId(conversationId);
      setInboxOpen(true);
    },
    [],
  );

  const handleRequestDm = useCallback(
    async (otherUserId: Id<"users">) => {
      if (!user?._id) return;
      const res = (await requestDm({
        fromUserId: user._id,
        toUserId: otherUserId,
      })) as {
        conversationId: Id<"dmConversations"> | null;
        requestId: string | null;
      };

      setInboxOpen(true);
      setActiveDmConversationId(res.conversationId ?? null);
    },
    [user?._id, requestDm],
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
            <h2 className="text-2xl font-bold text-white">
              Welcome to Bubble Spaces
            </h2>
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
            className="flex items-center gap-2 text-xl font-bold text-white hover:text-[#C4B8B0] transition-colors pointer-events-auto"
          >
            <span className="h-11 w-11 shrink-0 rounded-md overflow-hidden">
              <img
                src="/SafeSpaceLogo.png"
                alt="SafeSpace logo"
                className="h-full w-full object-contain"
              />
            </span>
            <span>SafeSpace</span>
          </button>
          <div className="text-[#C4B8B0] text-sm font-display pointer-events-auto hidden md:block">
            Use WASD or arrows to move, +/- to zoom
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
          focusSpaceId={focusSpaceId}
          focusRequestId={focusRequestId}
        />

        {!selectedSpaceId && (
          <div className="fixed bottom-6 left-1/2 z-[150] w-[min(420px,90vw)] -translate-x-1/2">
            <div
              onMouseDown={(e) => e.preventDefault()}
              className={`absolute bottom-12 left-0 right-0 space-y-2 rounded-2xl border border-white/10 bg-[#3D3637]/40 backdrop-blur-xl px-3 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-200 ${
                showResults &&
                (matches.length > 0 || (normalizedSearch && !exactMatch))
                  ? "opacity-100 translate-y-0"
                  : "pointer-events-none opacity-0 translate-y-2"
              }`}
            >
              {matches.map((space, index) => (
                <button
                  key={space._id}
                  type="button"
                  onClick={() => handleSelectSpace(space._id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm text-white transition ${
                    activeResultIndex === index
                      ? "border-white/30 bg-white/20"
                      : "border-white/5 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="truncate">{space.name}</span>
                  <span className="text-xs text-white/50">Enter</span>
                </button>
              ))}
              {normalizedSearch && !exactMatch && (
                <button
                  type="button"
                  onClick={handleCreateSpace}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm text-white transition ${
                    activeResultIndex === matches.length
                      ? "border-white/40 bg-white/20"
                      : "border-white/10 bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <span className="truncate">
                    Create “{spaceSearch.trim()}”
                  </span>
                  <span className="text-xs text-white/50">New Space</span>
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-md" />
              <input
                value={spaceSearch}
                onChange={(e) => {
                  setSpaceSearch(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 120)}
                onKeyDown={(e) => {
                  if (resultsCount === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveResultIndex((prev) => (prev + 1) % resultsCount);
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveResultIndex(
                      (prev) => (prev - 1 + resultsCount) % resultsCount,
                    );
                  }
                  if (e.key === "Enter") {
                    if (activeResultIndex < matches.length) {
                      handleSelectSpace(matches[activeResultIndex]._id);
                    } else {
                      void handleCreateSpace();
                    }
                  }
                }}
                placeholder="Search spaces..."
                className="relative w-full rounded-full border border-white/10 bg-[#3D3637]/50 px-4 py-2 text-sm text-white placeholder:text-white/50 backdrop-blur-xl outline-none transition focus:border-white/30"
              />
            </div>
          </div>
        )}

        {/* Space Overlay */}
        {selectedSpaceId && selectedSpace && (
          <SpaceOverlay
            spaceName={selectedSpace.name}
            spaceColor={selectedSpace.color}
            clusterId={selectedSpace.clusterId ?? undefined}
            threads={threads}
            presence={presence}
            currentUserId={user?._id ?? null}
            currentThreadId={currentThreadId}
            onClose={handleCloseOverlay}
            onCloseThread={handleCloseThread}
            onCreateThread={handleCreateThread}
            onThreadClick={handleThreadClick}
            onLeaveThread={handleLeaveThread}
            onRequestDm={handleRequestDm}
            onCurrentUserPositionChange={handleCurrentUserPositionChange}
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
