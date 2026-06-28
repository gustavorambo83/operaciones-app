import { z } from "zod";

export const createEvidenceSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(3, "El comentario debe tener al menos 3 caracteres")
    .max(1000, "El comentario no puede superar 1000 caracteres"),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;