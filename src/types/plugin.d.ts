declare namespace kintone {
  namespace plugin {
    /** プラグインがアプリ単位で保存する設定情報🔌 */
    type Storage = {
      allRecords: boolean;
      allFields: boolean;
      union: boolean;
    };
  }
}
