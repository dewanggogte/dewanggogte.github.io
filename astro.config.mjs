import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Map of URLs to their last significant content update
const lastModDates = {
  'https://dewanggogte.com/': '2026-03-17',
  'https://dewanggogte.com/blog/': '2026-03-17',
  'https://dewanggogte.com/blog/til/why_til_26-01-2026/': '2026-01-26',
  'https://dewanggogte.com/blog/til/hosting-your-own-website/': '2026-02-24',
  'https://dewanggogte.com/blog/til/custom-domain-email/': '2026-02-24',
  'https://dewanggogte.com/blog/til/voice-mode-in-claude-code/': '2026-02-27',
  'https://dewanggogte.com/blog/projects/building-this-site/': '2026-02-17',
  'https://dewanggogte.com/blog/projects/building-callkaro/': '2026-02-17',
  'https://dewanggogte.com/blog/projects/building-beacon/': '2026-03-17',
  'https://dewanggogte.com/games/': '2026-03-17',
  'https://dewanggogte.com/projects/': '2026-04-24',
  'https://dewanggogte.com/resume/': '2026-04-24',
};

export default defineConfig({
  site: 'https://dewanggogte.com',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      customPages: [
        'https://dewanggogte.com/games/bugs/',
        'https://dewanggogte.com/games/watchguessr/',
      ],
      serialize(item) {
        const lastmod = lastModDates[item.url];
        if (lastmod) {
          item.lastmod = new Date(lastmod).toISOString();
        }
        return item;
      },
    }),
  ],
});
