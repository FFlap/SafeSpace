import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UsePresenceOptions {
  spaceId: Id<"spaces"> | null;
  userId: Id<"users"> | null;
  currentThreadId: Id<"spaceThreads"> | null;
  enabled?: boolean;
  getPosition?: () => { x: number; y: number };
  screenToWorld?: (x: number, y: number) => { x: number; y: number };
}

export function usePresence({
  spaceId,
  userId,
  currentThreadId,
  enabled = true,
  getPosition,
  screenToWorld,
}: UsePresenceOptions) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const currentThreadIdRef = useRef<Id<"spaceThreads"> | null>(currentThreadId);
  const getPositionRef = useRef<UsePresenceOptions["getPosition"]>(getPosition);
  const screenToWorldRef = useRef<UsePresenceOptions["screenToWorld"]>(screenToWorld);
  const updatePresence = useMutation(api.presence.mutations.updatePresence);
  const leaveSpace = useMutation(api.presence.mutations.leaveSpace);

  useEffect(() => {
    currentThreadIdRef.current = currentThreadId;
  }, [currentThreadId]);

  useEffect(() => {
    getPositionRef.current = getPosition;
  }, [getPosition]);

  useEffect(() => {
    screenToWorldRef.current = screenToWorld;
  }, [screenToWorld]);

  const getCurrentPosition = useCallback(() => {
    const getPos = getPositionRef.current;
    if (getPos) return getPos();

    const fn = screenToWorldRef.current;
    if (!fn) return positionRef.current;
    return fn(window.innerWidth / 2, window.innerHeight / 2);
  }, []);

  // Send presence updates
  useEffect(() => {
    if (!enabled || !spaceId || !userId) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const newPos = getCurrentPosition();
      positionRef.current = newPos;
      setPosition(newPos);

      updatePresence({
        spaceId,
        userId,
        position: positionRef.current,
        currentThreadId: currentThreadIdRef.current ?? undefined,
      });

      timeoutId = setTimeout(tick, 1000);
    };

    tick();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      leaveSpace({ spaceId, userId });
    };
  }, [
    enabled,
    spaceId,
    userId,
    updatePresence,
    leaveSpace,
    getCurrentPosition,
  ]);

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
