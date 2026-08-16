import type { Project } from "@/lib/types";

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/);
  let line = "";
  let lineY = y;
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, lineY);
      line = `${word} `;
      lineY += lineHeight;
    } else line = test;
  }
  if (line) ctx.fillText(line.trim(), x, lineY);
}

function drawScene(project: Project, canvas: HTMLCanvasElement, sceneIndex: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable on this browser.");
  const scene = project.scenes[Math.min(sceneIndex, project.scenes.length - 1)];
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#172554");
  gradient.addColorStop(0.55, "#312e81");
  gradient.addColorStop(1, "#7c3aed");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.fillRect(48, 48, canvas.width - 96, canvas.height - 96);
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "700 46px sans-serif";
  ctx.fillText(scene.title, canvas.width / 2, 150);
  ctx.font = "24px sans-serif";
  wrapText(ctx, scene.narration || scene.action, canvas.width / 2, 235, canvas.width - 180, 38);
  ctx.font = "18px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.fillText(`Scene ${scene.number} of ${project.scenes.length}`, canvas.width / 2, canvas.height - 76);
}

export async function renderNarratedVideo(
  project: Project,
  canvas: HTMLCanvasElement,
  onProgress?: (message: string) => void,
) {
  if (!canvas.captureStream || typeof MediaRecorder === "undefined") {
    throw new Error("Video creation is not supported by this browser.");
  }
  if (!project.scenes.length) throw new Error("This project has no scenes to render.");

  onProgress?.("Preparing narration…");
  const { predict } = await import("@mintplex-labs/piper-tts-web");
  const narrationText = project.voiceLines.map(line => line.text).join(" ") || project.story.fullStory;
  const wav = await predict({ text: narrationText, voiceId: "en_US-hfc_female-medium" });

  onProgress?.("Mixing voice and video…");
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(await wav.arrayBuffer());
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  const destination = audioContext.createMediaStreamDestination();
  source.connect(destination);

  const canvasStream = canvas.captureStream(30);
  const combined = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...destination.stream.getAudioTracks(),
  ]);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : "video/webm";
  const recorder = new MediaRecorder(combined, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };

  const durationMs = Math.max(1000, audioBuffer.duration * 1000);
  const startedAt = performance.now();
  let animationFrame = 0;
  const draw = () => {
    const elapsed = performance.now() - startedAt;
    const ratio = Math.min(0.999, elapsed / durationMs);
    const sceneIndex = Math.floor(ratio * project.scenes.length);
    drawScene(project, canvas, sceneIndex);
    if (elapsed < durationMs) animationFrame = requestAnimationFrame(draw);
  };
  drawScene(project, canvas, 0);

  return await new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Could not record the finished video."));
    recorder.onstop = async () => {
      cancelAnimationFrame(animationFrame);
      canvasStream.getTracks().forEach(track => track.stop());
      destination.stream.getTracks().forEach(track => track.stop());
      await audioContext.close();
      resolve(new Blob(chunks, { type: mimeType }));
    };
    source.onended = () => {
      onProgress?.("Finalizing video…");
      if (recorder.state !== "inactive") recorder.stop();
    };
    recorder.start(500);
    animationFrame = requestAnimationFrame(draw);
    source.start();
    onProgress?.("Creating finished video…");
  });
}
