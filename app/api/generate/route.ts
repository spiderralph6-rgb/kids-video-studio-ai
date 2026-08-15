import { NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/schema";
import { mockTextProvider } from "@/lib/providers/mock";

export async function POST(request: Request) {
  try {
    const parsed = createProjectSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const project = await mockTextProvider.generateProject(parsed.data);
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
