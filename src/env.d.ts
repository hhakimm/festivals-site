/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** Google Analytics 4 측정 ID (예: G-XXXXXXXXXX). 비워두면 비활성. */
  readonly PUBLIC_GA_ID?: string;
  /** Google AdSense 게시자 ID (예: ca-pub-XXXXXXXXXXXXXXXX). 비워두면 비활성. */
  readonly PUBLIC_ADSENSE_CLIENT?: string;
  /** AdSense 단가 슬롯 ID (선택, 광고 단위별로 다르면 컴포넌트에서 prop으로 받음) */
  readonly PUBLIC_ADSENSE_SLOT_DEFAULT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
