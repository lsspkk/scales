# Kirkkosävellajit

A mobile-first web app for visualizing Finnish church modes (kirkkosävellajit) and practicing violin scales.

Built with React 19, Vite, TypeScript, and Tailwind CSS. Scales are rendered on an HTML5 canvas.

## Development

```sh
cd app
npm install
npm run dev
```

## Build & Deploy

```sh
cd app
npm run deploy:build   # outputs dist/ to repo root
```

Commit `dist/` and push to `main` — GitHub Actions uploads it to Azure Static Storage.

## Credits

Created by **lsspkk** with AI-assisted development.
