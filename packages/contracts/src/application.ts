import { z } from "zod";
import { ApplicationStatusSchema } from "./enums.js";

export const ApplicationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  matchId: z.string(),
  status: ApplicationStatusSchema,
  appliedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Application = z.infer<typeof ApplicationSchema>;
