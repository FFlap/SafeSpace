import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useSpaces() {
  const spaces = useQuery(api.spaces.queries.listSpacesWithPresence);

  return {
    spaces: spaces ?? [],
    isLoading: spaces === undefined,
  };
}

export function useSpace(spaceId: string | null) {
  const space = useQuery(
    api.spaces.queries.getSpace,
    spaceId ? { spaceId: spaceId as any } : "skip"
  );

  return {
    space: space ?? null,
    isLoading: space === undefined,
  };
}
