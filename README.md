# Dewang Gogte - Personal Website

A minimal personal website built with [Astro](https://astro.build) and MDX.

## Structure

```
dewang-site/
├── public/
│   └── Dewang_Gogte_Resume.pdf
├── src/
│   ├── layouts/
│   │   └── Base.astro          # Base HTML layout + global styles
│   └── pages/
│       └── index.mdx           # Homepage content (edit this!)
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Editing Content

All your content lives in `src/pages/index.mdx`. It's just Markdown with some HTML components mixed in. Edit the text there and the site updates.

## Deploying to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Vercel auto-detects Astro — just click Deploy
4. Add your custom domain in Settings → Domains

## Adding Pages Later

To add new pages (like `/photography` or `/blog`):

1. Create a new file in `src/pages/`, e.g., `photography.mdx`
2. Add the frontmatter and content
3. Link to it from the homepage

Example:
```mdx
---
layout: ../layouts/Base.astro
title: Photography - Dewang Gogte
---

# Photography

Your content here...
```
