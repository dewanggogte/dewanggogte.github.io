import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

// Collect all blog posts via glob
const posts = import.meta.glob('./blog/**/*.mdx', { eager: true }) as Record<
  string,
  { frontmatter: { title: string; date: string; description?: string; type: string } }
>;

export function GET(context: APIContext) {
  const items = Object.entries(posts)
    .filter(([_, post]) => post.frontmatter.type !== 'weekly-review')
    .map(([path, post]) => {
      // Convert file path to URL: ./blog/til/foo.mdx -> /blog/til/foo/
      const slug = path
        .replace('./blog/', '/blog/')
        .replace('.mdx', '/');
      return {
        title: post.frontmatter.title,
        description: post.frontmatter.description || post.frontmatter.title,
        pubDate: new Date(post.frontmatter.date),
        link: slug,
      };
    })
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Dewang Gogte',
    description: 'Writing about startups, projects, and things I learn along the way.',
    site: context.site!.toString(),
    items,
  });
}
