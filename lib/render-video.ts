import type { Project } from "@/lib/types";

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/); let line = ""; let lineY = y;
  for (const word of words) { const test = `${line}${word} `; if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line.trim(), x, lineY); line = `${word} `; lineY += lineHeight; } else line = test; }
  if (line) ctx.fillText(line.trim(), x, lineY);
}
function drawScene(project: Project, canvas: HTMLCanvasElement, sceneIndex: number) {
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas is unavailable on this browser.");
  const scene = project.scenes[Math.min(sceneIndex, project.scenes.length - 1)];
  const gradient = ctx.createLinearGradient(0,0,canvas.width,canvas.height); gradient.addColorStop(0,"#172554"); gradient.addColorStop(.55,"#312e81"); gradient.addColorStop(1,"#7c3aed");
  ctx.fillStyle=gradient; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle="rgba(255,255,255,.10)"; ctx.fillRect(48,48,canvas.width-96,canvas.height-96);
  ctx.textAlign="center"; ctx.fillStyle="white"; ctx.font="700 46px sans-serif"; ctx.fillText(scene.title,canvas.width/2,150); ctx.font="24px sans-serif"; wrapText(ctx,scene.narration||scene.action,canvas.width/2,235,canvas.width-180,38); ctx.font="18px sans-serif"; ctx.fillStyle="rgba(255,255,255,.72)"; ctx.fillText(`Scene ${scene.number} of ${project.scenes.length}`,canvas.width/2,canvas.height-76);
}
function recordVisuals(project: Project, canvas: HTMLCanvasElement, durationMs: number, audioTracks: MediaStreamTrack[] = [], onProgress?: (m:string)=>void) {
  const stream=canvas.captureStream(30); const combined=new MediaStream([...stream.getVideoTracks(),...audioTracks]); const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?"video/webm;codecs=vp9,opus":"video/webm"; const recorder=new MediaRecorder(combined,{mimeType:mime}); const chunks:BlobPart[]=[]; recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  const start=performance.now(); let frame=0; const draw=()=>{const elapsed=performance.now()-start; drawScene(project,canvas,Math.floor(Math.min(.999,elapsed/durationMs)*project.scenes.length)); if(elapsed<durationMs) frame=requestAnimationFrame(draw)};
  return new Promise<Blob>((resolve,reject)=>{recorder.onerror=()=>reject(new Error("Could not record the video.")); recorder.onstop=()=>{cancelAnimationFrame(frame);stream.getTracks().forEach(t=>t.stop());resolve(new Blob(chunks,{type:mime}))}; recorder.start(500); frame=requestAnimationFrame(draw); window.setTimeout(()=>{onProgress?.("Finalizing video…");if(recorder.state!=="inactive")recorder.stop()},durationMs+250)});
}
async function renderWithDeviceVoice(project:Project,canvas:HTMLCanvasElement,onProgress?:(m:string)=>void){
  if (!("speechSynthesis" in window)) throw new Error("This phone cannot run the free neural voice or Android narration.");
  const text=project.voiceLines.map(v=>v.text).join(" ")||project.story.fullStory; const words=text.trim().split(/\s+/).length; const duration=Math.max(6000,words/2.2*1000); const utterance=new SpeechSynthesisUtterance(text); utterance.lang="en-US"; utterance.rate=.95; utterance.pitch=1.05; onProgress?.("Neural voice unavailable — using Android voice…"); window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); const blob=await recordVisuals(project,canvas,duration,[],onProgress); window.speechSynthesis.cancel(); return blob;
}
export async function renderNarratedVideo(project:Project,canvas:HTMLCanvasElement,onProgress?:(m:string)=>void){
  if(!canvas.captureStream||typeof MediaRecorder==="undefined") throw new Error("Video creation is not supported by this browser."); if(!project.scenes.length) throw new Error("This project has no scenes to render.");
  try { onProgress?.("Preparing free neural narration…"); const {predict}=await import("@mintplex-labs/piper-tts-web"); const text=project.voiceLines.map(v=>v.text).join(" ")||project.story.fullStory; const wav=await predict({text,voiceId:"en_US-hfc_female-medium"}); const ac=new AudioContext(); const buffer=await ac.decodeAudioData(await wav.arrayBuffer()); const source=ac.createBufferSource(); source.buffer=buffer; const dest=ac.createMediaStreamDestination(); source.connect(dest); onProgress?.("Creating narrated video…"); source.start(); const blob=await recordVisuals(project,canvas,Math.max(1000,buffer.duration*1000),dest.stream.getAudioTracks(),onProgress); dest.stream.getTracks().forEach(t=>t.stop()); await ac.close(); return blob;
  } catch { return renderWithDeviceVoice(project,canvas,onProgress); }
}
