import { useMutation, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import type { Id } from "../../convex/_generated/dataModel";

export interface ThreadMessage {
  _id: string;
  threadId: Id<"spaceThreads">;
  userId: Id<"users">;
  body: string;
  createdAt: number;
}

export function useThreadMessages(threadId: Id<"spaceThreads"> | null) {
  const messages = useQuery(
    anyApi.messages.queries.listThreadMessages,
    threadId ? { threadId } : "skip"
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

export function useThreadMessageMutations() {
  const sendThreadMessage = useMutation(anyApi.messages.mutations.sendThreadMessage);
  return { sendThreadMessage };
}

