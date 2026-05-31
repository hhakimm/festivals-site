import type { APIRoute, GetStaticPaths } from 'astro';
import { buildUrlBlocks, chunkCount, SITEMAP_CHUNK } from '@/lib/sitemap';

// 자식 사이트맵 — /sitemap-0.xml, /sitemap-1.xml … 각 청크당 최대 SITEMAP_CHUNK개 URL.
export const getStaticPaths: GetStaticPaths = () =>
  Array.from({ length: chunkCount() }, (_, i) => ({ params: { page: String(i) } }));

export const GET: APIRoute = ({ params }) => {
  const i = Number(params.page);
  const blocks = buildUrlBlocks();
  const chunk = blocks.slice(i * SITEMAP_CHUNK, (i + 1) * SITEMAP_CHUNK);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${chunk.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
