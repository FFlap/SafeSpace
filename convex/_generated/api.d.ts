/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clustering_actions from "../clustering/actions.js";
import type * as config_mutations from "../config/mutations.js";
import type * as crons from "../crons.js";
import type * as dms_mutations from "../dms/mutations.js";
import type * as dms_queries from "../dms/queries.js";
import type * as functions from "../functions.js";
import type * as messages_mutations from "../messages/mutations.js";
import type * as messages_queries from "../messages/queries.js";
import type * as presence_mutations from "../presence/mutations.js";
import type * as presence_queries from "../presence/queries.js";
import type * as seed_actions from "../seed/actions.js";
import type * as spaces_actions from "../spaces/actions.js";
import type * as spaces_internalQueries from "../spaces/internalQueries.js";
import type * as spaces_mutations from "../spaces/mutations.js";
import type * as spaces_queries from "../spaces/queries.js";
import type * as threads_mutations from "../threads/mutations.js";
import type * as threads_queries from "../threads/queries.js";
import type * as threads_scheduler from "../threads/scheduler.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "clustering/actions": typeof clustering_actions;
  "config/mutations": typeof config_mutations;
  crons: typeof crons;
  "dms/mutations": typeof dms_mutations;
  "dms/queries": typeof dms_queries;
  functions: typeof functions;
  "messages/mutations": typeof messages_mutations;
  "messages/queries": typeof messages_queries;
  "presence/mutations": typeof presence_mutations;
  "presence/queries": typeof presence_queries;
  "seed/actions": typeof seed_actions;
  "spaces/actions": typeof spaces_actions;
  "spaces/internalQueries": typeof spaces_internalQueries;
  "spaces/mutations": typeof spaces_mutations;
  "spaces/queries": typeof spaces_queries;
  "threads/mutations": typeof threads_mutations;
  "threads/queries": typeof threads_queries;
  "threads/scheduler": typeof threads_scheduler;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
