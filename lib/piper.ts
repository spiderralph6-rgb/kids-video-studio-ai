export const DEFAULT_PIPER_VOICE = "en_US-hfc_female-medium";

let activeAudio: HTMLAudioElement | null = null;
let activeUrl: string | null = null;

export type PiperProgress = {
  loaded?: number;
  total?: number;
  url?: string;
};

function cleanupAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
  if (activeUrl) {
    URL.revokeObjectURL(activeUrl);
    activeUrl = null;
  }
}

export async function speakWithPiper(
  text: string,
  options: {
    voiceId?: string;
    rate?: number;
    onProgress?: (progress: PiperProgress) => void;
  } = {},
) {
  if (typeof window === "undefined") throw new Error("Neural narration only runs in the browser.");

  cleanupAudio();
  const tts = await import("@mintplex-labs/piper-tts-web");
  const wav = await tts.predict(
    {
      text,
      voiceId: options.voiceId ?? DEFAULT_PIPER_VOICE,
    },
    options.onProgress,
  );

  activeUrl = URL.createObjectURL(wav);
  activeAudio = new Audio(activeUrl);
  activeAudio.playbackRate = Math.min(1.35, Math.max(0.65, options.rate ?? 1));

  return new Promise<void>((resolve, reject) => {
    if (!activeAudio) return reject(new Error("Could not create neural narration audio."));
    activeAudio.onended = () => { cleanupAudio(); resolve(); };
    activeAudio.onerror = () => { cleanupAudio(); reject(new Error("Could not play neural narration audio.")); };
    activeAudio.play().catch(error => { cleanupAudio(); reject(error); });
  });
}

export function stopPiper() {
  cleanupAudio();
}
