"use client";

import { useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { renderNarratedVideo } from "@/lib/render-video";

export function SimpleVideoApp() {
  const [idea, setIdea] = useState("A little lion learns why sharing makes everyone happier.");
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function generate() {
    setBusy(true); setError(""); setVideoUrl(""); setStatus("Writing the story and scenes…");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, targetAge: "5-8", durationMinutes: 1, genre: "Adventure", educationalTheme: "Positive life lesson", artStyle: "Warm colorful children's animation", narratorVoice: "Warm playful female narrator", language: "English", aspectRatio: "16:9", sceneCount: 6, readingDifficulty: "Early reader", characterCount: 2 }) });
      if (!response.ok) throw new Error("Could not create the story.");
      const nextProject = await response.json() as Project;
      setProject(nextProject);
      setStatus("Story ready. Tap Create Video.");
    } catch (e) { setError(e instanceof Error ? e.message : "Generation failed."); setStatus("Stopped"); }
    finally { setBusy(false); }
  }

  async function createVideo() {
    if (!project || !canvasRef.current) return;
    setBusy(true); setError("");
    try {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const blob = await renderNarratedVideo(project, canvasRef.current, setStatus);
      setVideoUrl(URL.createObjectURL(blob));
      setStatus("Finished — your narrated video is ready.");
    } catch (e) { setError(e instanceof Error ? e.message : "Video creation failed."); setStatus("Stopped"); }
    finally { setBusy(false); }
  }

  function downloadVideo() {
    if (!videoUrl) return;
    const a = document.createElement("a"); a.href = videoUrl; a.download = `${project?.id ?? "kids-video"}.webm`; a.click();
  }

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white"><div className="mx-auto max-w-4xl">
    <div className="mb-8"><span className="rounded-full bg-violet-500/20 px-3 py-1 text-sm font-bold text-violet-200">Kids Video Studio · Simple MVP</span><h1 className="mt-4 text-4xl font-black sm:text-5xl">One idea. One finished kids' video.</h1><p className="mt-3 text-slate-300">No paid TTS API. Generate the story, then create a narrated video directly on your device.</p></div>
    <div className="rounded-3xl bg-white p-5 text-slate-900"><label className="text-sm font-bold">What should the story be about?</label><textarea value={idea} onChange={e=>setIdea(e.target.value)} className="mt-2 h-32 w-full rounded-2xl bg-slate-100 p-4 text-lg outline-none ring-violet-500 focus:ring-2"/><button onClick={generate} disabled={busy || !idea.trim()} className="mt-4 w-full rounded-2xl bg-violet-600 px-5 py-4 text-lg font-black text-white disabled:opacity-50">{busy && !project ? "Creating…" : "1. Generate Story"}</button></div>
    {project && <div className="mt-6 rounded-3xl bg-white p-5 text-slate-900"><h2 className="text-2xl font-black">{project.story.title}</h2><p className="mt-2 text-slate-600">{project.story.logline}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{project.scenes.map(scene=><div key={scene.id} className="rounded-xl bg-slate-100 p-3"><b>Scene {scene.number}: {scene.title}</b><p className="mt-1 text-sm text-slate-600">{scene.narration || scene.action}</p></div>)}</div><button onClick={createVideo} disabled={busy} className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white disabled:opacity-50">{busy ? status : "2. Create Narrated Video"}</button></div>}
    <canvas ref={canvasRef} width={960} height={540} className="mt-6 w-full rounded-3xl bg-slate-900"/>
    {videoUrl && <div className="mt-6 rounded-3xl bg-white p-5 text-slate-900"><video src={videoUrl} controls className="w-full rounded-2xl"/><button onClick={downloadVideo} className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-4 text-lg font-black text-white">Download Video</button></div>}
    <div className="mt-5 rounded-2xl bg-white/10 p-4"><p className="font-bold">Status: {status}</p>{error && <p className="mt-2 text-sm text-rose-300">{error}</p>}</div>
  </div></main>;
}
