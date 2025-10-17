/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminCVReview from "../adminCVReview.js";
import type * as expertCVs from "../expertCVs.js";
import type * as expertServiceAssignments from "../expertServiceAssignments.js";
import type * as model_expertCVs from "../model/expertCVs.js";
import type * as model_types from "../model/types.js";
import type * as model_validators from "../model/validators.js";
import type * as serviceVersions from "../serviceVersions.js";
import type * as utilities from "../utilities.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminCVReview: typeof adminCVReview;
  expertCVs: typeof expertCVs;
  expertServiceAssignments: typeof expertServiceAssignments;
  "model/expertCVs": typeof model_expertCVs;
  "model/types": typeof model_types;
  "model/validators": typeof model_validators;
  serviceVersions: typeof serviceVersions;
  utilities: typeof utilities;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
