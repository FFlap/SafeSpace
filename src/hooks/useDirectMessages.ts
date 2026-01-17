import { useAction, useMutation, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import type { Id } from "../../convex/_generated/dataModel";

export type DmRequestStatus = "pending" | "accepted" | "declined";

export interface DmRequest {
  _id: Id<"dmRequests">;
  fromUserId: Id<"users">;
  toUserId: Id<"users">;
  status: DmRequestStatus;
  createdAt: number;
  respondedAt?: number;
  conversationId?: Id<"dmConversations">;
}

export interface DmConversation {
  _id: Id<"dmConversations">;
  userA: Id<"users">;
  userB: Id<"users">;
  otherUserId?: Id<"users">;
  createdAt: number;
  acceptedAt: number;
}

export interface DmMessage {
  _id: Id<"dmMessages">;
  conversationId: Id<"dmConversations">;
  senderId: Id<"users">;
  body: string;
  createdAt: number;
  displayName?: string | null;
}

export function useIncomingDmRequests(userId: Id<"users"> | null) {
  const requests = useQuery(
    anyApi.dms.queries.listIncomingDmRequests,
    userId ? { userId } : "skip"
  ) as DmRequest[] | undefined;

  return { requests: requests ?? [], isLoading: requests === undefined };
}

export function useOutgoingDmRequests(userId: Id<"users"> | null) {
  const requests = useQuery(
    anyApi.dms.queries.listOutgoingDmRequests,
    userId ? { userId } : "skip"
  ) as DmRequest[] | undefined;

  return { requests: requests ?? [], isLoading: requests === undefined };
}

export function useMyDmConversations(userId: Id<"users"> | null) {
  const conversations = useQuery(
    anyApi.dms.queries.listMyDmConversations,
    userId ? { userId } : "skip"
  ) as DmConversation[] | undefined;

  return { conversations: conversations ?? [], isLoading: conversations === undefined };
}

export function useDmConversationForUsers(
  userId: Id<"users"> | null,
  otherUserId: Id<"users"> | null
) {
  const conversationId = useQuery(
    anyApi.dms.queries.getDmConversationForUsers,
    userId && otherUserId ? { userId, otherUserId } : "skip"
  ) as Id<"dmConversations"> | null | undefined;

  return { conversationId: conversationId ?? null, isLoading: conversationId === undefined };
}

export function useDmMessages(
  conversationId: Id<"dmConversations"> | null,
  userId: Id<"users"> | null,
  options?: { since?: number; limit?: number }
) {
  const messages = useQuery(
    anyApi.dms.queries.listDmMessages,
    conversationId && userId
      ? { conversationId, userId, since: options?.since, limit: options?.limit }
      : "skip"
  ) as DmMessage[] | undefined;

  return { messages: messages ?? [], isLoading: messages === undefined };
}

export function useDmNameConsent(
  conversationId: Id<"dmConversations"> | null,
  userId: Id<"users"> | null
) {
  const shareName = useQuery(
    anyApi.dms.queries.getDmNameConsent,
    conversationId && userId ? { conversationId, userId } : "skip"
  ) as boolean | undefined;

  return { shareName: shareName ?? false, isLoading: shareName === undefined };
}

export function useDmMutations() {
  const requestDm = useMutation(anyApi.dms.mutations.requestDm);
  const respondToDmRequest = useMutation(anyApi.dms.mutations.respondToDmRequest);
  const sendDmMessage = useAction(anyApi.dms.actions.sendDmMessage);
  const setDmNameConsent = useMutation(anyApi.dms.mutations.setDmNameConsent);

  return { requestDm, respondToDmRequest, sendDmMessage, setDmNameConsent };
}
