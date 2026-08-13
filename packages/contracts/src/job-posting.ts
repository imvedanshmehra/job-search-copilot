import { z } from "zod";
import { WorkModeSchema } from "./enums.js";

export const JobPostingSchema = z.object({
  id: z.string(),
  source: z.string(),
  externalId: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string().nullable(),
  workMode: WorkModeSchema.nullable(),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  salaryCurrency: z.string().nullable(),
  url: z.string().url(),
  description: z.string(),
  postedAt: z.string().datetime().nullable(),
  fetchedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type JobPosting = z.infer<typeof JobPostingSchema>;
