import { useMutation, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import type { Id } from "../../convex/_generated/dataModel";

export interface ThreadMessage {
  _id: string;
  threadId: Id<"spaceThreads">;
  userId: Id<"users">;
  body: string;
  createdAt: number;
  displayName?: string | null;
}

export function useThreadMessages(
  threadId: Id<"spaceThreads"> | null,
  options?: { since?: number; limit?: number }
) {
  const messages = useQuery(
    anyApi.messages.queries.listThreadMessages,
    threadId
      ? { threadId, since: options?.since, limit: options?.limit }
      : "skip"
  ) as ThreadMessage[] | undefined;

  return {
    messages: messages ?? [],
    isLoading: messages === undefined,
  };
}

export function useThreadChatters(threadId: Id<"spaceThreads"> | null) {
  const chatters = useQuery(
    anyApi.messages.queries.listThreadChatters,
    threadId ? { threadId } : "skip"
  ) as Id<"users">[] | undefined;

  return {
    chatters: chatters ?? [],
    isLoading: chatters === undefined,
  };
}

export function useThreadNameConsent(
  threadId: Id<"spaceThreads"> | null,
  userId: Id<"users"> | null
) {
  const shareName = useQuery(
    anyApi.messages.queries.getThreadNameConsent,
    threadId && userId ? { threadId, userId } : "skip"
  ) as boolean | undefined;

  return { shareName: shareName ?? false, isLoading: shareName === undefined };
}

export function useThreadMessageMutations() {
  const sendThreadMessage = useMutation(anyApi.messages.mutations.sendThreadMessage);
  const setThreadNameConsent = useMutation(
    anyApi.messages.mutations.setThreadNameConsent
  );
  return { sendThreadMessage, setThreadNameConsent };
}
