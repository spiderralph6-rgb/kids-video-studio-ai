# Deploy from a phone

The easiest phone-only deployment path is GitHub + Vercel. No local Node.js installation is required on the phone.

## 1. Put the project on GitHub

1. Sign in to GitHub in your phone browser.
2. Create a new repository, for example `kids-video-studio-ai`.
3. Upload the contents of this project folder to the repository. The repository root should contain `package.json`, `app/`, `components/`, and `lib/` directly.
4. Commit the uploaded files.

If your mobile browser makes folder upload difficult, use a cloud IDE or GitHub Codespaces to unzip the project and push it to the repository.

## 2. Deploy on Vercel

1. Sign in to Vercel with the same GitHub account.
2. Choose **Add New → Project**.
3. Import the `kids-video-studio-ai` repository.
4. Vercel should detect **Next.js** automatically.
5. Keep the default build command (`next build`) and output settings.
6. Click **Deploy**.
7. When deployment completes, Vercel gives you a public `*.vercel.app` URL that opens on your phone or any other device.

## Environment variables

Mock AI Mode needs no API keys. When real providers are added later, configure their secrets in Vercel Project Settings → Environment Variables. Never put secrets in client-side code or commit a real `.env` file.

## Local/cloud development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in the same environment. In a cloud IDE, use its **Ports/Preview** feature instead of trying to open localhost directly on your phone.

## Production verification

Before deploying, run:

```bash
npm run typecheck
npm run build
```

The current app intentionally uses Mock AI Mode so its generation flow works without paid APIs.
