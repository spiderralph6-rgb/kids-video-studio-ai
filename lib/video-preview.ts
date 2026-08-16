import type { Project } from "@/lib/types";

export function renderProjectPreview(project: Project, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Video preview is not supported by this browser.");
  let sceneIndex = 0;
  let timer: number | null = null;
  const draw = () => {
    const scene = project.scenes[sceneIndex];
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#312e81"); gradient.addColorStop(1, "#7c3aed");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(45, 45, canvas.width - 90, canvas.height - 90);
    ctx.fillStyle = "white"; ctx.textAlign = "center";
    ctx.font = "700 42px sans-serif"; ctx.fillText(scene.title, canvas.width / 2, 150);
    ctx.font = "24px sans-serif";
    wrapText(ctx, scene.narration || scene.action, canvas.width / 2, 220, canvas.width - 170, 38);
    ctx.font = "18px sans-serif"; ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.fillText(`Scene ${scene.number} of ${project.scenes.length}`, canvas.width / 2, canvas.height - 80);
  };
  draw();
  timer = window.setInterval(() => { sceneIndex = (sceneIndex + 1) % project.scenes.length; draw(); }, 4500);
  return () => { if (timer) window.clearInterval(timer); };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/); let line = ""; let lineY = y;
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line.trim(), x, lineY); line = `${word} `; lineY += lineHeight; }
    else line = test;
  }
  if (line) ctx.fillText(line.trim(), x, lineY);
}

export async function recordProjectPreview(project: Project, canvas: HTMLCanvasElement) {
  if (!canvas.captureStream || typeof MediaRecorder === "undefined") throw new Error("Video download is not supported by this browser.");
  const stopPreview = renderProjectPreview(project, canvas);
  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType }); const chunks: BlobPart[] = [];
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  const duration = Math.min(60000, Math.max(9000, project.scenes.length * 4500));
  return new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => { stopPreview(); reject(new Error("Could not render video.")); };
    recorder.onstop = () => { stopPreview(); resolve(new Blob(chunks, { type: mimeType })); };
    recorder.start(500); window.setTimeout(() => recorder.stop(), duration);
  });
}
