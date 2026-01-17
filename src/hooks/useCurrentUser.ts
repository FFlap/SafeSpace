import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const syncUser = useMutation(api.functions.syncUser);

  // Get user from Convex by Clerk ID
  const convexUser = useQuery(
    api.functions.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Sync user when clerk user changes
  useEffect(() => {
    if (clerkLoaded && clerkUser) {
      syncUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        name: clerkUser.fullName ?? undefined,
        imageUrl: clerkUser.imageUrl ?? undefined,
      });
    }
  }, [clerkLoaded, clerkUser, syncUser]);

  return {
    user: convexUser ?? null,
    isLoading: !clerkLoaded || (clerkUser && convexUser === undefined),
    isSignedIn: !!clerkUser,
  };
}
