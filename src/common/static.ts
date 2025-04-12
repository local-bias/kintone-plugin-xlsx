import config from '@/../plugin.config.mjs';

const {
  manifest: { base: baseManifest },
} = config;

export const PLUGIN_NAME = baseManifest.name.ja;

export const LOCAL_STORAGE_KEY = 'ribbit-kintone-plugin';

export const URL_HOMEPAGE = baseManifest.homepage_url.ja;
export const URL_INQUIRY = 'https://konomi.app/contact';
export const URL_PROMOTION = 'https://promotion.konomi.app/kintone-plugin';
export const URL_BANNER = 'https://promotion.konomi.app/kintone-plugin/sidebar';
