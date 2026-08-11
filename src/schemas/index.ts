import { title } from "node:process";
import z from "zod";

const DEFAULT_MESSAGE = "Este campo é obrigatório";

export const addTaskSchema = z.object({
    title: z.string(DEFAULT_MESSAGE).min(3, "O título deve ter no mínimo 3 caracteres"),
    description: z.optional(z.string().max(255, "A descrição deve ter no máximo 255 caracteres")),
    statusId: z.number(DEFAULT_MESSAGE).int().positive(),
    priorityId: z.number(DEFAULT_MESSAGE).int().positive(),
    categoryId: z.number(DEFAULT_MESSAGE).int().positive(),
});

export type AddTaskInput = z.infer<typeof addTaskSchema>;