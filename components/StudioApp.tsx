"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Clapperboard, Download, Film, Mic2, Sparkles, Users, WandSparkles, type LucideIcon } from "lucide-react";
import type { Project } from "@/lib/types";
import { projectToSrt } from "@/lib/export";

type Tab = "Story" | "Characters" | "Storyboard" | "Voice" | "Export";
type VoicePreset = "Natural" | "Storyteller" | "Gentle" | "Playful";

const sampleFlowCards: Array<{ icon: LucideIcon; label: string }> = [
  { icon: BookOpen, label: "Story" }, { icon: Users, label: "Characters" }, { icon: Film, label: "Storyboard" }, { icon: Mic2, label: "Voice + SFX" }
];
const voicePresets: Record<VoicePreset, { rate: number; pitch: number; description: string }> = {
  Natural: { rate: 0.92, pitch: 1, description: "Calm, realistic pacing" },
  Storyteller: { rate: 0.88, pitch: 1.02, description: "Warm bedtime-story rhythm" },
  Gentle: { rate: 0.82, pitch: 0.98, description: "Soft and slower for younger kids" },
  Playful: { rate: 0.96, pitch: 1.08, description: "Brighter and more energetic" }
};
const download = (name: string, text: string, type = "text/plain") => { const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); };
const voiceScore = (voice: SpeechSynthesisVoice) => {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  let score = 0;
  if (/natural|neural|enhanced|premium|wavenet/.test(name)) score += 10;
  if (/google|microsoft|samsung/.test(name)) score += 5;
  if (/female|woman|zira|samantha|serena|karen|moira|tessa|ava|aria/.test(name)) score += 2;
  if (/en-gb|en-au/.test(voice.lang.toLowerCase())) score += 1;
  if (!voice.localService) score += 2;
  return score;
};
const splitForSpeech = (text: string) => {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(part => part.trim()).filter(Boolean) ?? [text];
  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 220) chunks.push(sentence);
    else {
      const pieces = sentence.match(/.{1,200}(?:\s|$)/g)?.map(part => part.trim()).filter(Boolean) ?? [sentence];
      chunks.push(...pieces);
    }
  }
  return chunks;
};

export function StudioApp() {
  const [idea, setIdea] = useState("A little fox who is afraid of the dark discovers that the stars are his friends.");
  const [project, setProject] = useState<Project | null>(null); const [loading, setLoading] = useState(false); const [tab, setTab] = useState<Tab>("Story"); const [error, setError] = useState(""); const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]); const [voiceURI, setVoiceURI] = useState(""); const [rate, setRate] = useState(0.88); const [pitch, setPitch] = useState(1.02); const [preset, setPreset] = useState<VoicePreset>("Storyteller");
  const progress = useMemo(() => ["Writing story", "Designing characters", "Building storyboard", "Preparing voiceover", "Finalizing project"], []); const [progressIndex, setProgressIndex] = useState(0);
  const englishVoices = useMemo(() => voices.filter(v => /^en([-_]|$)/i.test(v.lang)).sort((a,b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name)), [voices]);
  const selectedVoice = useMemo(() => englishVoices.find(v => v.voiceURI === voiceURI) ?? englishVoices[0], [englishVoices, voiceURI]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (!voiceURI && available.length) {
        const rankedEnglish = available.filter(v => /^en([-_]|$)/i.test(v.lang)).sort((a,b) => voiceScore(b) - voiceScore(a));
        setVoiceURI((rankedEnglish[0] ?? available[0]).voiceURI);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [voiceURI]);

  async function createProject() {
    setLoading(true); setError(""); setProgressIndex(0); const ticker = window.setInterval(() => setProgressIndex(v => Math.min(v + 1, progress.length - 1)), 180);
    try { const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, targetAge: "5-8", durationMinutes: 4, genre: "Adventure", educationalTheme: "Friendship", artStyle: "Warm 3D storybook animation", narratorVoice: "Warm and playful", language: "English", aspectRatio: "16:9", sceneCount: 8, readingDifficulty: "Early reader", characterCount: 3 }) }); if (!response.ok) throw new Error("Could not generate project"); setProject(await response.json()); setTab("Story"); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { window.clearInterval(ticker); setLoading(false); }
  }

  function applyPreset(nextPreset: VoicePreset) {
    const settings = voicePresets[nextPreset];
    setPreset(nextPreset);
    setRate(settings.rate);
    setPitch(settings.pitch);
  }

  function speakText(text: string) {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") { setError("Free device narration is not supported by this browser."); return; }
    const currentVoices = synth.getVoices();
    setVoices(currentVoices);
    const rankedEnglish = currentVoices.filter(v => /^en([-_]|$)/i.test(v.lang)).sort((a,b) => voiceScore(b) - voiceScore(a));
    const selected = currentVoices.find(v => v.voiceURI === voiceURI) ?? rankedEnglish[0] ?? currentVoices[0];
    const chunks = splitForSpeech(text);
    synth.cancel();
    setSpeaking(true);
    let index = 0;
    const speakNext = () => {
      if (index >= chunks.length) { setSpeaking(false); return; }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      if (selected) { utterance.voice = selected; utterance.lang = selected.lang; } else utterance.lang = "en-US";
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      utterance.onend = () => { index += 1; window.setTimeout(speakNext, 90); };
      utterance.onerror = () => setSpeaking(false);
      synth.speak(utterance);
    };
    window.setTimeout(speakNext, 80);
  }
  function playNarration() { if (project) speakText(project.voiceLines.map(v => v.text).join(" ")); }
  function previewVoice() { speakText("Once upon a time, a tiny fox discovered that even the darkest night can sparkle with wonder. And from that night on, he never felt alone beneath the stars."); }
  function stopNarration() { const synth = window.speechSynthesis; if (synth) synth.cancel(); setSpeaking(false); }

  if (!project) return <main className="min-h-screen px-6 py-10 lg:px-12"><div className="mx-auto max-w-6xl">
    <header className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-2xl bg-violet-600 p-3 text-white"><Clapperboard /></div><div><h1 className="text-xl font-bold">Kids Video Studio AI</h1><p className="text-sm text-slate-500">One idea → a complete animation production package</p></div></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Mock AI Mode</span></header>
    <section className="mt-16 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center"><div><span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700"><Sparkles size={16}/> Story to studio</span><h2 className="mt-5 text-5xl font-black tracking-tight text-slate-900">What should today's story be about?</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Create the story, characters, storyboard, image and animation prompts, voiceover, sound plan, subtitles and export files in one workspace.</p>
      <div className="mt-8 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-slate-200"><textarea value={idea} onChange={e=>setIdea(e.target.value)} className="h-36 w-full resize-none rounded-2xl bg-slate-50 p-4 text-lg outline-none ring-violet-400 focus:ring-2"/><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">Age 5–8 · 4 min · 8 scenes · 16:9</span><button onClick={createProject} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-60"><WandSparkles size={18}/>{loading ? `${progress[progressIndex]}...` : "Create Video Project"}</button></div></div>{error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}</div>
      <div className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-soft"><div className="rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-6"><p className="text-sm font-semibold text-white/80">Sample production flow</p><h3 className="mt-2 text-2xl font-bold">Milo and the Moonlight Garden</h3><div className="mt-8 grid grid-cols-2 gap-3">{sampleFlowCards.map(({ icon: Icon, label }) => <div key={label} className="rounded-2xl bg-white/15 p-4 backdrop-blur"><Icon size={20}/><div className="mt-8 text-sm font-semibold">{label}</div></div>)}</div></div></div></section>
  </div></main>;
  const tabs: [Tab, React.ReactNode][] = [["Story",<BookOpen size={18}/>],["Characters",<Users size={18}/>],["Storyboard",<Film size={18}/>],["Voice",<Mic2 size={18}/>],["Export",<Download size={18}/>]];
  return <main className="min-h-screen"><header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/90 px-6 py-4 backdrop-blur"><div><button onClick={()=>setProject(null)} className="text-sm font-semibold text-violet-700">← Projects</button><h1 className="text-lg font-bold">{project.story.title}</h1></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Ready</span></header>
    <div className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[230px_1fr]"><aside className="border-r bg-white p-4"><div className="space-y-2">{tabs.map(([name,icon])=><button key={name} onClick={()=>setTab(name)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${tab===name?"bg-violet-100 text-violet-800":"text-slate-600 hover:bg-slate-100"}`}>{icon}{name}</button>)}</div></aside>
      <section className="p-6 lg:p-9"><div className="mx-auto max-w-6xl">
        {tab==="Story" && <div><p className="text-sm font-bold uppercase tracking-wider text-violet-600">Story</p><h2 className="mt-2 text-4xl font-black">{project.story.title}</h2><p className="mt-3 text-lg text-slate-600">{project.story.logline}</p><div className="mt-6 grid gap-4 md:grid-cols-3"><Card title="Theme" text={project.story.theme}/><Card title="Moral" text={project.story.moral}/><Card title="Opening hook" text={project.story.openingHook}/></div><article className="mt-6 rounded-3xl bg-white p-7 shadow-soft ring-1 ring-slate-200"><h3 className="text-lg font-bold">Full story</h3><p className="mt-4 whitespace-pre-line leading-8 text-slate-700">{project.story.fullStory}</p></article></div>}
        {tab==="Characters" && <div><p className="text-sm font-bold uppercase tracking-wider text-violet-600">Character Bible</p><h2 className="mt-2 text-3xl font-black">Keep every character consistent</h2><div className="mt-6 grid gap-5 md:grid-cols-2">{project.characters.map(c=><div key={c.id} className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-200"><div className="flex items-center justify-between"><h3 className="text-xl font-bold">{c.name}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{c.role}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{c.personality}</p><div className="mt-4 rounded-2xl bg-violet-50 p-4"><p className="text-xs font-bold uppercase text-violet-700">Consistency prompt</p><p className="mt-2 text-sm leading-6 text-violet-950">{c.consistencyPrompt}</p></div></div>)}</div></div>}
        {tab==="Storyboard" && <div><p className="text-sm font-bold uppercase tracking-wider text-violet-600">Storyboard</p><h2 className="mt-2 text-3xl font-black">{project.scenes.length} production-ready scenes</h2><div className="mt-6 space-y-4">{project.scenes.map(s=><div key={s.id} className="grid gap-5 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-200 md:grid-cols-[90px_1fr]"><div className="flex h-20 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-black text-white">{String(s.number).padStart(2,"0")}</div><div><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-bold">{s.title}</h3><span className="text-xs font-semibold text-slate-500">{s.durationSeconds}s · {s.shotType}</span></div><p className="mt-2 text-sm text-slate-600">{s.action}</p><details className="mt-3 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-semibold">Image + animation prompts</summary><p className="mt-3 text-xs leading-5 text-slate-600"><b>Image:</b> {s.imagePrompt}</p><p className="mt-3 text-xs leading-5 text-slate-600"><b>Animation:</b> {s.animationPrompt}</p></details></div></div>)}</div></div>}
        {tab==="Voice" && <div><p className="text-sm font-bold uppercase tracking-wider text-violet-600">Voice Production</p><h2 className="mt-2 text-3xl font-black">Narration and dialogue</h2><div className="mt-6 rounded-3xl bg-violet-50 p-5 ring-1 ring-violet-200"><div><p className="font-bold text-violet-950">Free device narration</p><p className="mt-1 text-sm text-violet-800">The app now ranks the best English voices your phone exposes and uses short sentence-sized speech chunks for smoother pacing. No paid TTS API and no usage charge.</p></div><div className="mt-5"><p className="text-sm font-semibold text-violet-950">Story voice style</p><div className="mt-2 flex flex-wrap gap-2">{(Object.keys(voicePresets) as VoicePreset[]).map(name=><button key={name} onClick={()=>applyPreset(name)} className={`rounded-xl px-3 py-2 text-sm font-bold ${preset===name?"bg-violet-600 text-white":"bg-white text-violet-700 ring-1 ring-violet-200"}`}>{name}</button>)}</div><p className="mt-2 text-xs text-violet-700">{voicePresets[preset].description}</p></div><div className="mt-5 grid gap-4 md:grid-cols-3"><label className="text-sm font-semibold text-violet-950">Voice<select value={voiceURI} onChange={e=>setVoiceURI(e.target.value)} className="mt-2 w-full rounded-xl bg-white p-3 text-sm ring-1 ring-violet-200"><option value="">Best available English voice</option>{englishVoices.map((v,index)=><option key={v.voiceURI} value={v.voiceURI}>{index===0 ? "⭐ " : ""}{v.name} ({v.lang}){v.localService ? " · on device" : " · network"}</option>)}</select></label><label className="text-sm font-semibold text-violet-950">Speed: {rate.toFixed(2)}x<input type="range" min="0.65" max="1.2" step="0.02" value={rate} onChange={e=>{setRate(Number(e.target.value));setPreset("Natural")}} className="mt-3 w-full"/></label><label className="text-sm font-semibold text-violet-950">Pitch: {pitch.toFixed(2)}<input type="range" min="0.8" max="1.25" step="0.02" value={pitch} onChange={e=>{setPitch(Number(e.target.value));setPreset("Natural")}} className="mt-3 w-full"/></label></div>{selectedVoice && <div className="mt-4 rounded-xl bg-white/70 p-3 text-xs text-violet-800"><b>Using:</b> {selectedVoice.name} · {selectedVoice.lang} · {selectedVoice.localService ? "on-device voice" : "network voice"}{voiceScore(selectedVoice)>=7 ? " · higher-quality candidate" : ""}</div>}<div className="mt-5 flex flex-wrap gap-2"><button onClick={previewVoice} disabled={speaking} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-200 disabled:opacity-50">🔊 Preview voice</button><button onClick={playNarration} disabled={speaking} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{speaking ? "Playing…" : "▶ Play narration"}</button><button onClick={stopNarration} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-200">■ Stop</button></div>{englishVoices.length === 0 && <p className="mt-3 text-xs text-violet-700">Your browser has not exposed any distinct English voices yet. In that case Android may only provide one underlying TTS voice to web apps.</p>}</div><div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-slate-200">{project.voiceLines.map(v=><div key={v.id} className="grid gap-3 border-b p-4 last:border-0 md:grid-cols-[120px_1fr_120px]"><span className="font-bold">{v.speaker}</span><div><p>{v.text}</p><p className="mt-1 text-xs text-slate-500">{v.direction}</p></div><span className="text-sm text-slate-500">{v.startSeconds}s–{v.endSeconds}s</span></div>)}</div></div>}
        {tab==="Export" && <div><p className="text-sm font-bold uppercase tracking-wider text-violet-600">Export Center</p><h2 className="mt-2 text-3xl font-black">Take the project anywhere</h2><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><ExportButton label="Project JSON" onClick={()=>download(`${project.id}.json`, JSON.stringify(project,null,2),"application/json")}/><ExportButton label="Story Markdown" onClick={()=>download(`${project.id}-story.md`, `# ${project.story.title}\n\n${project.story.fullStory}`)}/><ExportButton label="Subtitles SRT" onClick={()=>download(`${project.id}.srt`, projectToSrt(project))}/></div><div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">MP4 rendering and ZIP asset packaging are intentionally provider-dependent placeholders. The data model and provider adapters are ready to extend without pretending a renderer exists.</div></div>}
      </div></section></div>
  </main>;
}
function Card({title,text}:{title:string;text:string}) { return <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-2 font-semibold text-slate-800">{text}</p></div> }
function ExportButton({label,onClick}:{label:string;onClick:()=>void}) { return <button onClick={onClick} className="flex items-center justify-between rounded-2xl bg-white p-5 text-left font-bold shadow-soft ring-1 ring-slate-200 hover:ring-violet-300"><span>{label}</span><Download size={18}/></button> }