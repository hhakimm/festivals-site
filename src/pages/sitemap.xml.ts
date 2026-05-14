import type { APIRoute } from 'astro';
import { festivals, attractions } from '@/lib/data';
import { LANGS } from '@/lib/i18n';

// 빌드 타임에 sitemap.xml을 직접 생성한다.
// @astrojs/sitemap 패키지의 base path 호환 이슈를 우회하면서
// 4개 언어 hreflang을 정확히 박는다.
export const GET: APIRoute = ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') || 'https://hhakimm.github.io';
  const base = '/festivals-site';

  const allItems = [...festivals, ...attractions];

  type Entry = { path: string; lastmod?: string; priority?: number };
  const entries: Entry[] = [];

  entries.push({ path: '/', priority: 1.0 });
  entries.push({ path: '/festivals/', priority: 0.9 });
  entries.push({ path: '/attractions/', priority: 0.9 });

  for (const item of allItems) {
    const lastmod = item.updatedAt
      ? `${item.updatedAt.slice(0, 4)}-${item.updatedAt.slice(4, 6)}-${item.updatedAt.slice(6, 8)}`
      : undefined;
    entries.push({
      path: `/${item.type}/${item.slug}/`,
      lastmod,
      priority: 0.8,
    });
  }

  const xmlEntries = entries
    .map((entry) => {
      const altLinks = LANGS.map((l) => {
        const langPrefix = l === 'ko' ? '' : `/${l}`;
        const href = `${origin}${base}${langPrefix}${entry.path}`;
        return `    <xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`;
      }).join('\n');

      const defaultLoc = `${origin}${base}${entry.path}`;

      return LANGS.map((l) => {
        const langPrefix = l === 'ko' ? '' : `/${l}`;
        const loc = `${origin}${base}${langPrefix}${entry.path}`;
        return `  <url>
    <loc>${loc}</loc>
${entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : ''}    <priority>${entry.priority || 0.5}</priority>
${altLinks}
    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultLoc}"/>
  </url>`;
      }).join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${xmlEntries}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
