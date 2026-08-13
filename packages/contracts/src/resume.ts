import { z } from "zod";

export const ResumeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storageKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.number().int().nonnegative(),
  uploadedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Resume = z.infer<typeof ResumeSchema>;

export const ResumeVariantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  resumeId: z.string(),
  label: z.string(),
  storageKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.number().int().nonnegative(),
  uploadedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ResumeVariant = z.infer<typeof ResumeVariantSchema>;
