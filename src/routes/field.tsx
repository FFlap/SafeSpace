import { useState, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { BubbleField } from "@/components/canvas/BubbleField";
import { SpaceOverlay } from "@/components/space/SpaceOverlay";
import { useSpaces, useSpace } from "@/hooks/useSpaces";
import { useThreads, useMyThreadMemberships, useThreadMutations } from "@/hooks/useThreads";
import { usePresence, useSpacePresence } from "@/hooks/usePresence";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
  const [screenToWorld, setScreenToWorld] = useState<
    ((x: number, y: number) => { x: number; y: number }) | null
  >(null);

  const { space: selectedSpace } = useSpace(selectedSpaceId);
  const { threads } = useThreads(selectedSpaceId);
  const { presence } = useSpacePresence(selectedSpaceId);
  const { memberThreadIds } = useMyThreadMemberships(user?._id ?? null);
  const { createThread, joinThread, leaveThread } = useThreadMutations();

  // Presence tracking
  usePresence({
    spaceId: selectedSpaceId,
    userId: user?._id ?? null,
    currentThreadId,
    enabled: !!selectedSpaceId && !!user,
    screenToWorld: screenToWorld ?? undefined,
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

      await leaveThread({
        threadId,
        userId: user._id,
      });

      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
      }
    },
    [user, leaveThread, currentThreadId]
  );

  // Loading state
  if (spacesLoading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading spaces...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <SignedOut>
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur flex items-center justify-center z-50">
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-white">Welcome to Bubble Spaces</h2>
            <p className="text-slate-400">Sign in to join the conversation</p>
            <SignInButton mode="modal">
              <button className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none">
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-xl font-bold text-white hover:text-indigo-400 transition-colors pointer-events-auto"
          >
            HackTheBias
          </button>
          <div className="text-slate-400 text-sm pointer-events-auto">
            Use WASD or arrows to pan, +/- to zoom
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
            onCreateThread={handleCreateThread}
            onJoinThread={handleJoinThread}
            onLeaveThread={handleLeaveThread}
            onScreenToWorldReady={setScreenToWorld}
          />
        )}

        {/* Empty state */}
        {spaces.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-2">
              <p className="text-slate-400 text-lg">No spaces yet</p>
              <p className="text-slate-500 text-sm">
                Run the seed action to populate spaces
              </p>
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}
