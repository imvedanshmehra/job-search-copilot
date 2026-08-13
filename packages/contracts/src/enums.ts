import { z } from "zod";

export const WorkModeSchema = z.enum(["REMOTE", "ON_SITE", "HYBRID"]);
export type WorkMode = z.infer<typeof WorkModeSchema>;

export const MatchStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

export const ApplicationStatusSchema = z.enum([
  "APPLIED",
  "NO_RESPONSE",
  "INTERVIEWING",
  "REJECTED",
  "OFFER",
  "WITHDRAWN",
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
