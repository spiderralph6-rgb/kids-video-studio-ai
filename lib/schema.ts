import { z } from "zod";

export const createProjectSchema = z.object({
  idea: z.string().min(8, "Give us a little more detail about your story idea."),
  targetAge: z.string().default("5-8"),
  durationMinutes: z.coerce.number().min(1).max(20).default(4),
  genre: z.string().default("Adventure"),
  educationalTheme: z.string().default("Friendship"),
  artStyle: z.string().default("Warm 3D storybook animation"),
  narratorVoice: z.string().default("Warm and playful"),
  language: z.string().default("English"),
  aspectRatio: z.string().default("16:9"),
  sceneCount: z.coerce.number().min(4).max(20).default(8),
  readingDifficulty: z.string().default("Early reader"),
  characterCount: z.coerce.number().min(1).max(8).default(3)
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
