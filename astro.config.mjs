import { defineConfig } from 'astro/config';

// GitHub Pages 호스팅을 가정한 설정.
// 커스텀 도메인을 쓰면 site만 바꾸고 base는 '/'로 두면 됩니다.
export default defineConfig({
  site: 'https://hhakimm.github.io',
  base: '/festivals-site/',
  output: 'static',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en', 'ja', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    ssr: { noExternal: ['leaflet'] },
  },
});
