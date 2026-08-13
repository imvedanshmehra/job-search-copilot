import { z } from "zod";
import { MatchStatusSchema } from "./enums.js";

export const MatchSchema = z.object({
  id: z.string(),
  userId: z.string(),
  jobPostingId: z.string(),
  resumeVariantId: z.string(),
  score: z.number(),
  rationale: z.string(),
  status: MatchStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Match = z.infer<typeof MatchSchema>;
