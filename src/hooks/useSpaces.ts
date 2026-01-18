import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useSpaces() {
  const spaces = useQuery(api.spaces.queries.listSpaces);
  const presenceCounts = useQuery(api.presence.queries.listActivePresenceCounts);

  const counts = new Map(
    (presenceCounts ?? []).map((item) => [item.spaceId as string, item.activeUserCount])
  );

  const spacesWithCounts = (spaces ?? []).map((space) => ({
    ...space,
    activeUserCount: counts.get(space._id) ?? 0,
  }));

  return {
    spaces: spacesWithCounts,
    isLoading: spaces === undefined || presenceCounts === undefined,
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
