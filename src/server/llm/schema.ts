import { z } from 'zod';

export const NarrativeSchema = z.object({
  headline: z.string().min(1).max(140),
  itemNotes: z
    .array(
      z.object({
        id: z.string().regex(/^ACT-\d{3}$/),
        why: z.string().min(1).max(300),
        tip: z.string().min(1).max(300),
      })
    )
    .min(1)
    .max(12),
  closing: z.string().min(1).max(300),
});

export type NarrativeOutput = z.infer<typeof NarrativeSchema>;

export const AnswerSchema = z.object({
  answer: z.string().min(1).max(500),
});

export type AnswerOutput = z.infer<typeof AnswerSchema>;
