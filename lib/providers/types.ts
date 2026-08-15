import type { CreateProjectInput } from "@/lib/schema";
import type { Project } from "@/lib/types";

export interface TextProvider {
  generateProject(input: CreateProjectInput): Promise<Project>;
}
