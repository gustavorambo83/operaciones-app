import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(120, "El título no puede superar 120 caracteres"),

  description: z
    .string()
    .trim()
    .max(1000, "La descripción no puede superar 1000 caracteres")
    .optional()
    .nullable(),

  clientId: z.string().uuid("clientId debe ser un UUID válido"),

  branchId: z.string().uuid("branchId debe ser un UUID válido"),

  assignedToId: z.string().uuid("assignedToId debe ser un UUID válido"),

  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    error: "La prioridad debe ser LOW, MEDIUM, HIGH o CRITICAL",
  }),

  dueDate: z
    .string()
    .datetime(
      "dueDate debe ser una fecha ISO válida. Ejemplo: 2026-07-01T18:00:00.000Z"
    ),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "El título debe tener al menos 3 caracteres")
      .max(120, "El título no puede superar 120 caracteres")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "La descripción no puede superar 1000 caracteres")
      .optional()
      .nullable(),

    status: z
      .enum(["PENDING", "IN_PROGRESS", "BLOCKED", "CLOSED"], {
        error:
          "El estado debe ser PENDING, IN_PROGRESS, BLOCKED o CLOSED",
      })
      .optional(),

    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
        error: "La prioridad debe ser LOW, MEDIUM, HIGH o CRITICAL",
      })
      .optional(),

    assignedToId: z
      .string()
      .uuid("assignedToId debe ser un UUID válido")
      .optional(),

    dueDate: z.string().datetime("dueDate debe ser una fecha ISO válida").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;