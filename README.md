# Kids Video Studio AI

A modular Next.js + Tailwind starter that turns one children's story idea into a structured animation production package.

## Included in this build

- Create-project experience
- Mock AI provider that works with zero paid APIs
- Typed `Project`, `Story`, `Character`, `Environment`, `Scene`, `VoiceLine`, and `Subtitle` models
- Character consistency prompts
- Scene-by-scene storyboard
- Image and animation prompts
- Voice production timeline
- JSON, Markdown, and SRT exports
- Provider interfaces designed for future text/image/video/voice integrations
- Zod request validation
- Responsive creative-studio UI

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture

- `app/api/generate` — generation endpoint
- `lib/providers` — swappable AI-provider interfaces and mock provider
- `lib/prompts` — centralized prompt builders
- `lib/types.ts` — domain models
- `lib/schema.ts` — validation
- `lib/mock-project.ts` — realistic mock generation pipeline
- `lib/export.ts` — subtitle/export helpers
- `components/StudioApp.tsx` — current workspace UI

## Extending to real AI providers

Implement the provider interface in `lib/providers/types.ts`, validate structured output with Zod, and select the provider server-side using environment variables. Keep secrets out of client components.

Image, video, and voice providers should follow the same adapter approach. Add async generation jobs and persistent asset storage before production-scale rendering.

## Safety

Mock content is child-friendly. A production provider implementation should add explicit age-aware moderation for sexual content, graphic violence, dangerous challenges, hate, drugs, and other unsuitable material while allowing ordinary fantasy conflict.

## Next production steps

1. Add database persistence (Postgres/Supabase recommended).
2. Add authenticated projects and autosave.
3. Implement real structured-text generation provider.
4. Add image generation adapter and asset gallery.
5. Add video generation job queue.
6. Add TTS/voice provider.
7. Add editable timeline and render manifest.

## Deploy from a phone

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for a phone-only GitHub + Vercel workflow. Mock AI Mode requires no API keys.
