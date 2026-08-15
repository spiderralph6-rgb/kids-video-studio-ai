import type { Project } from "./types";

const pad = (n: number, width = 2) => String(n).padStart(width, "0");
export function srtTime(seconds: number) {
  const ms = Math.floor((seconds % 1) * 1000);
  const whole = Math.floor(seconds);
  const s = whole % 60; const m = Math.floor(whole / 60) % 60; const h = Math.floor(whole / 3600);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}
export function projectToSrt(project: Project) {
  return project.subtitles.map(s => `${s.index}\n${srtTime(s.startSeconds)} --> ${srtTime(s.endSeconds)}\n${s.text}`).join("\n\n");
}
