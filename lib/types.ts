export type ProjectStatus = "draft" | "generating" | "ready" | "error";

export interface ProjectSettings {
  targetAge: string;
  durationMinutes: number;
  genre: string;
  educationalTheme: string;
  artStyle: string;
  narratorVoice: string;
  language: string;
  aspectRatio: string;
  sceneCount: number;
  readingDifficulty: string;
  characterCount: number;
}

export interface Story {
  title: string;
  logline: string;
  theme: string;
  moral: string;
  fullStory: string;
  openingHook: string;
  ending: string;
  targetVocabulary: string[];
  estimatedNarrationSeconds: number;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  age: string;
  personality: string;
  appearance: string;
  clothing: string;
  colors: string[];
  facialFeatures: string;
  bodyProportions: string;
  accessories: string[];
  expressions: string[];
  voiceDescription: string;
  consistencyPrompt: string;
  locked?: boolean;
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  consistencyPrompt: string;
}

export interface Scene {
  id: string;
  number: number;
  title: string;
  durationSeconds: number;
  setting: string;
  timeOfDay: string;
  characterIds: string[];
  shotType: string;
  cameraAngle: string;
  cameraMovement: string;
  action: string;
  expressions: string;
  dialogue: string;
  narration: string;
  transition: string;
  imagePrompt: string;
  negativePrompt: string;
  animationPrompt: string;
  soundEffects: string[];
  musicMood: string;
}

export interface VoiceLine {
  id: string;
  sceneId: string;
  speaker: string;
  text: string;
  direction: string;
  startSeconds: number;
  endSeconds: number;
}

export interface Subtitle {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface Project {
  id: string;
  idea: string;
  createdAt: string;
  status: ProjectStatus;
  settings: ProjectSettings;
  story: Story;
  characters: Character[];
  environments: Environment[];
  scenes: Scene[];
  voiceLines: VoiceLine[];
  subtitles: Subtitle[];
}
