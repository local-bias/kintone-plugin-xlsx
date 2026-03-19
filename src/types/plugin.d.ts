declare namespace kintone {
  namespace plugin {
    /** プラグインがアプリ単位で保存する設定情報🔌 */
    type Storage = {
      allRecords: boolean;
      allFields: boolean;
      union: boolean;
      /** ファイル名テンプレート ({appName}, {date}, {time}, {appId} が使用可能) */
      fileNameTemplate: string;
      /** シート名テンプレート ({appName}, {date}, {time}, {appId} が使用可能, 最大31文字) */
      sheetName: string;
      /** 日付/時刻フィールドをExcel日付形式で出力するか */
      dateAsExcel: boolean;
    };
  }
}
