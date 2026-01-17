import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up inactive threads every hour
crons.interval(
  "cleanup inactive threads",
  { hours: 1 },
  internal.threads.scheduler.cleanupInactiveThreads
);

export default crons;
