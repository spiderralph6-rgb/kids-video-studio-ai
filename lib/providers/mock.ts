import type { TextProvider } from "./types";
import { createMockProject } from "@/lib/mock-project";

export const mockTextProvider: TextProvider = {
  async generateProject(input) {
    await new Promise(resolve => setTimeout(resolve, 700));
    return createMockProject(input);
  }
};
