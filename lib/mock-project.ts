import type { CreateProjectInput } from "./schema";
import type { Character, Project, Scene, Subtitle, VoiceLine } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

function titleFromIdea(idea: string) {
  const cleaned = idea.replace(/[.!?]/g, "").trim();
  return cleaned.length > 52 ? `${cleaned.slice(0, 49)}...` : cleaned;
}

export function createMockProject(input: CreateProjectInput): Project {
  const id = uid();
  const title = titleFromIdea(input.idea);
  const characters: Character[] = [
    {
      id: "hero", name: "Milo", role: "Curious young hero", age: "7", personality: "Kind, cautious, imaginative, quietly funny",
      appearance: "Small golden fox with large expressive amber eyes and soft rounded features", clothing: "Teal hoodie and tiny canvas satchel",
      colors: ["golden orange", "cream", "teal"], facialFeatures: "Large amber eyes, small black nose, soft eyebrows", bodyProportions: "Childlike proportions, slightly oversized head, small paws",
      accessories: ["canvas satchel"], expressions: ["curious", "nervous", "delighted", "determined"], voiceDescription: "Bright child voice, gentle and thoughtful",
      consistencyPrompt: "Milo, a small golden-orange child fox with cream muzzle, large amber eyes, teal hoodie, tiny tan canvas satchel, soft rounded 3D storybook proportions, identical markings and outfit in every scene."
    },
    {
      id: "friend", name: "Pip", role: "Energetic best friend", age: "7", personality: "Cheerful, encouraging, fast-talking",
      appearance: "Round blue bird with fluffy feathers and expressive wings", clothing: "Yellow scarf", colors: ["sky blue", "yellow", "white"], facialFeatures: "Wide eyes, tiny orange beak",
      bodyProportions: "Small round body, short wings, oversized feet", accessories: ["yellow scarf"], expressions: ["excited", "supportive", "surprised"], voiceDescription: "Quick, upbeat child voice",
      consistencyPrompt: "Pip, a round sky-blue child bird with white belly, tiny orange beak, oversized expressive eyes, yellow scarf, fluffy 3D storybook feathers, identical look in every scene."
    }
  ];

  const sceneTemplates = [
    ["A Small Worry", "Milo pauses at the edge of a glowing path, unsure whether to continue.", "Sometimes the biggest adventures begin with one tiny brave step."],
    ["A Friend Appears", "Pip swoops in and notices Milo looking worried.", "Pip could always spot a worry from three trees away."],
    ["The First Clue", "A trail of sparkling leaves points toward a mysterious garden gate.", "Together, they followed a trail that shimmered like fallen stars."],
    ["Inside the Garden", "The friends enter a magical garden filled with softly glowing flowers.", "The garden was quiet, but it did not feel lonely."],
    ["The Challenge", "A dark archway blocks their path and Milo hesitates.", "Milo's paws wanted to turn around, but his heart wanted to know what came next."],
    ["A Brave Idea", "Milo uses curiosity instead of fear and takes one careful step forward.", "He discovered that courage did not mean feeling fearless."],
    ["The Surprise", "The darkness fills with friendly fireflies and star-shaped blossoms.", "The dark had been hiding something beautiful all along."],
    ["Home With a Story", "Milo and Pip return smiling beneath a bright moon.", "And from then on, Milo remembered that new things can feel scary before they feel wonderful."]
  ];

  const scenes: Scene[] = Array.from({ length: input.sceneCount }, (_, i) => {
    const t = sceneTemplates[i % sceneTemplates.length];
    const duration = Math.max(12, Math.round((input.durationMinutes * 60) / input.sceneCount));
    return {
      id: `scene-${i + 1}`, number: i + 1, title: t[0], durationSeconds: duration,
      setting: i < 2 ? "Woodland path" : i < input.sceneCount - 1 ? "Moonlight garden" : "Hill above the village", timeOfDay: "Twilight",
      characterIds: i === 0 ? ["hero"] : ["hero", "friend"], shotType: i % 3 === 0 ? "Wide establishing shot" : i % 3 === 1 ? "Medium two-shot" : "Close-up",
      cameraAngle: "Child eye level", cameraMovement: i % 2 ? "Gentle dolly forward" : "Slow lateral drift", action: t[1],
      expressions: i < 5 ? "Milo shifts from uncertain to curious; Pip stays warm and encouraging" : "Relief, wonder, and growing confidence",
      dialogue: i === 1 ? "Pip: Want some company? Adventures are less wobbly with two." : i === 5 ? "Milo: Maybe I can be scared and brave at the same time." : "",
      narration: t[2], transition: i === input.sceneCount - 1 ? "Fade out" : "Soft storybook dissolve",
      imagePrompt: `Warm cinematic 3D children's storybook animation, ${t[1]} ${characters.map(c => c.consistencyPrompt).join(" ")} Soft volumetric moonlight, friendly rounded shapes, expressive faces, clean composition, ${input.aspectRatio}.`,
      negativePrompt: "No text, no logos, no horror, no realistic violence, no distorted anatomy, no extra limbs, no inconsistent clothing.",
      animationPrompt: `Animate scene ${i + 1} for ${duration} seconds. ${t[1]} Use subtle blinking and breathing, readable facial acting, gentle cloth and foliage movement, ${i % 2 ? "slow camera push-in" : "soft side-to-side camera drift"}. Keep character colors, markings, outfit and proportions unchanged. End on a clear emotional pose suitable for the next cut.`,
      soundEffects: i < 2 ? ["soft forest ambience", "light footsteps", "distant birds"] : ["night garden ambience", "soft magical chimes", "leaves rustling"],
      musicMood: i < 5 ? "Gentle curiosity with light pizzicato and warm marimba" : "Hopeful orchestral sparkle with soft bells"
    };
  });

  let cursor = 0;
  const voiceLines: VoiceLine[] = scenes.flatMap((scene) => {
    const start = cursor; const narrationDuration = Math.max(4, scene.durationSeconds - 4); cursor += scene.durationSeconds;
    const lines: VoiceLine[] = [{ id: uid(), sceneId: scene.id, speaker: "Narrator", text: scene.narration, direction: "Warm, playful, unhurried", startSeconds: start + 1, endSeconds: start + narrationDuration }];
    if (scene.dialogue) lines.push({ id: uid(), sceneId: scene.id, speaker: scene.dialogue.split(":")[0], text: scene.dialogue.split(":").slice(1).join(":").trim(), direction: "Natural child performance", startSeconds: start + Math.max(5, narrationDuration - 1), endSeconds: start + scene.durationSeconds - 1 });
    return lines;
  });
  const subtitles: Subtitle[] = voiceLines.map((line, i) => ({ index: i + 1, startSeconds: line.startSeconds, endSeconds: line.endSeconds, text: line.text }));

  return {
    id, idea: input.idea, createdAt: new Date().toISOString(), status: "ready", settings: { ...input },
    story: {
      title, logline: `A gentle adventure about turning uncertainty into curiosity: ${input.idea}`, theme: input.educationalTheme,
      moral: "Courage can be a small step taken while you still feel nervous.",
      fullStory: `Milo was curious about almost everything, but tonight something felt different. ${input.idea} With Pip beside him, Milo followed a trail of glowing clues into a moonlit garden. Each new corner looked strange at first, yet every careful step revealed something friendly and surprising. When they reached the darkest archway, Milo nearly turned back. Then he realized he did not need to stop being afraid before moving forward. He took one small step, then another. The darkness filled with fireflies and star-shaped flowers. Milo laughed. On the way home, he understood that bravery can be quiet, wobbly, and still completely real.`,
      openingHook: "Milo loved mysteries—except the ones that began after sunset.", ending: "Under the moon, Milo smiled at the path that had once looked scary and now looked like an invitation.",
      targetVocabulary: ["curious", "glimmer", "courage", "gentle", "discover"], estimatedNarrationSeconds: input.durationMinutes * 60
    },
    characters,
    environments: [
      { id: "woodland", name: "Woodland Path", description: "Cozy forest trail with rounded trees and warm lantern-like mushrooms", consistencyPrompt: "Same curved woodland path, mossy stones, rounded trees, tiny glowing mushrooms, teal-purple twilight palette." },
      { id: "garden", name: "Moonlight Garden", description: "Secret garden of luminous flowers beneath a wide moon", consistencyPrompt: "Same enclosed moonlight garden, star-shaped white flowers, silver leaves, arched ivy gate, soft blue-violet night lighting." }
    ],
    scenes, voiceLines, subtitles
  };
}
