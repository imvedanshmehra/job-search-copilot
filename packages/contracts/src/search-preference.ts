import { z } from "zod";
import { WorkModeSchema } from "./enums.js";

export const SearchPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workModes: z.array(WorkModeSchema),
  payMin: z.number().int().nullable(),
  payMax: z.number().int().nullable(),
  payCurrency: z.string(),
  locations: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SearchPreference = z.infer<typeof SearchPreferenceSchema>;
