import type { APIRoute } from 'astro';
import { SITEMAP_ORIGIN, SITEMAP_BASE, chunkCount } from '@/lib/sitemap';

// 사이트맵 색인 — 자식 사이트맵(sitemap-0.xml …)을 가리킨다.
// (URL 5만/10MB 한도 때문에 단일 파일 대신 분할)
export const GET: APIRoute = () => {
  const n = chunkCount();
  const items = Array.from(
    { length: n },
    (_, i) => `  <sitemap><loc>${SITEMAP_ORIGIN}${SITEMAP_BASE}/sitemap-${i}.xml</loc></sitemap>`,
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
