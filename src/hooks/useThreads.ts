import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useThreads(spaceId: Id<"spaces"> | null) {
  const threads = useQuery(
    api.threads.queries.listThreads,
    spaceId ? { spaceId } : "skip"
  );

  return {
    threads: threads ?? [],
    isLoading: threads === undefined,
  };
}

export function useMyThreadMemberships(userId: Id<"users"> | null) {
  const memberships = useQuery(
    api.threads.queries.getMyMemberships,
    userId ? { userId } : "skip"
  );

  const memberThreadIds = new Set<string>(
    memberships
      ?.map((m: { thread: { _id: string } | null }) => m.thread?._id)
      .filter((id): id is string => Boolean(id)) ?? []
  );

  return {
    memberships: memberships ?? [],
    memberThreadIds,
    isLoading: memberships === undefined,
  };
}

export function useThreadMutations() {
  const createThread = useMutation(api.threads.mutations.createThread);
  const joinThread = useMutation(api.threads.mutations.joinThread);
  const leaveThread = useMutation(api.threads.mutations.leaveThread);

  return {
    createThread,
    joinThread,
    leaveThread,
  };
}
