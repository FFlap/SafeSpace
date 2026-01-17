import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UsePresenceOptions {
  spaceId: Id<"spaces"> | null;
  userId: Id<"users"> | null;
  currentThreadId: Id<"spaceThreads"> | null;
  enabled?: boolean;
  screenToWorld?: (x: number, y: number) => { x: number; y: number };
}

export function usePresence({
  spaceId,
  userId,
  currentThreadId,
  enabled = true,
  screenToWorld,
}: UsePresenceOptions) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const positionRef = useRef({ x: 100, y: 100 });
  const updatePresence = useMutation(api.presence.mutations.updatePresence);
  const leaveSpace = useMutation(api.presence.mutations.leaveSpace);

  // Track mouse movement for position
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rawPos = { x: e.clientX, y: e.clientY };
      const newPos = screenToWorld ? screenToWorld(rawPos.x, rawPos.y) : rawPos;
      positionRef.current = newPos;
      setPosition(newPos);
    },
    [screenToWorld]
  );

  // Send presence updates
  useEffect(() => {
    if (!enabled || !spaceId || !userId) return;

    const interval = setInterval(() => {
      updatePresence({
        spaceId,
        userId,
        position: positionRef.current,
        currentThreadId: currentThreadId ?? undefined,
      });
    }, 1000);

    // Initial update
    updatePresence({
      spaceId,
      userId,
      position: positionRef.current,
      currentThreadId: currentThreadId ?? undefined,
    });

    return () => {
      clearInterval(interval);
      leaveSpace({ spaceId, userId });
    };
  }, [enabled, spaceId, userId, currentThreadId, updatePresence, leaveSpace]);

  // Track mouse movement
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enabled, handleMouseMove]);

  return { position };
}

export function useSpacePresence(spaceId: Id<"spaces"> | null) {
  const presence = useQuery(
    api.presence.queries.getSpacePresence,
    spaceId ? { spaceId } : "skip"
  );

  return {
    presence: presence ?? [],
    isLoading: presence === undefined,
  };
}
