/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): kintone.plugin.Storage => ({
  allFields: false,
  allRecords: true,
  union: true,
});
