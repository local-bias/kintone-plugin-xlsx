import { Sheet, utils, writeFile, Range } from 'xlsx';
import { getAppId, getQuery, getQueryCondition } from '@lb-ribbit/kintone-xapp';
import {
  getAllRecords,
  getApp,
  getFormFields,
  getViews,
  kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { GUEST_SPACE_ID } from '@/common/global';

type ViewList = Record<string, kintoneAPI.view.Response>;

/**
 * 受け取ったkintoneレコードを変換し、XLSX形式でダウンロードします
 *
 * @param {Object} event kintoneイベント情報
 */
export async function download(event: kintoneAPI.js.Event, config: kintone.plugin.Storage) {
  const appId = getAppId();

  if (!appId) {
    return;
  }

  const query = (config.allRecords ? getQueryCondition() : getQuery()) || '';

  const targetRecords = await getAllRecords({
    app: appId,
    query,
    guestSpaceId: GUEST_SPACE_ID,
    debug: process.env.NODE_ENV === 'development',
  });

  // レコードが存在しない場合は処理しません
  if (!targetRecords.length) {
    return;
  }

  const [app, { views }, { properties }] = await Promise.all([
    getApp({
      id: appId,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    }),
    getViews({
      app: appId,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    }),
    getFormFields({
      app: appId,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    }),
  ]);

  const merges: Range[] = [];
  const sheet = utils.aoa_to_sheet([[]]);

  // 情報を補完するため、アプリ情報・フィールド情報をそれぞれ取得します
  const fields = await getFields(
    views,
    properties,
    String(event.viewId),
    Boolean(config.allFields)
  );

  const includesSubtable = fields.some((field) => field.type === 'SUBTABLE');

  // Excelファイルを作成します
  let row = 0;
  let col = 0;
  const tableFields: kintoneAPI.property.Subtable[] = [];

  for (const field of fields) {
    // セルの値を設定します
    setCell(sheet, row, col, field.label);

    // サブテーブルの場合
    if (field.type === 'SUBTABLE') {
      tableFields.push(field as kintoneAPI.property.Subtable);

      Object.keys(field.fields).map((key, j) => {
        setCell(sheet, row + 1, col + j, field.fields[key].label);
      });

      merges.push({
        s: { r: row, c: col },
        e: { r: row, c: col + Object.keys(field.fields).length - 1 },
      });

      col += Object.keys(field.fields).length;
    } else {
      // セルの結合条件を設定します
      if (includesSubtable) {
        merges.push({
          s: { r: row, c: col },
          e: { r: row + 1, c: col },
        });
      }
      col++;
    }
  }

  row = includesSubtable ? 2 : 1;
  const maxCol = col;

  // 内容部分を作成します
  for (const record of targetRecords) {
    col = 0;

    // レコードが使用する行数を算出します
    let rowCount = 1;
    tableFields.map((tf) => {
      const subtable = record[tf.code] as kintoneAPI.field.Subtable;

      const len = subtable.value.length;
      if (rowCount < len) {
        rowCount = len;
      }
    });

    // フィールドの各値を設定します
    for (const field of fields) {
      const targetField = record[field.code];
      if (!targetField) {
        col++;
        continue;
      }

      if (targetField.type === 'SUBTABLE') {
        const subValue = targetField as any as kintoneAPI.field.Subtable;

        subValue.value.map((tableRow, j) => {
          Object.keys((field as any).fields).map((key, k) => {
            const value = getFieldValue(tableRow.value[key]);

            setCell(sheet, row + j, col + k, value);
          });
        });

        col += Object.keys((field as any).fields).length;
      } else {
        const value = getFieldValue(targetField);

        // セルの値を設定します
        setCell(sheet, row, col, value);

        if (includesSubtable && config.union) {
          merges.push({
            s: { r: row, c: col },
            e: { r: row + rowCount - 1, c: col },
          });
        }
        col++;
      }
    }

    row += rowCount;
  }

  sheet['!ref'] = utils.encode_range({ s: { c: 0, r: 0 }, e: { c: maxCol, r: row } });
  sheet['!merges'] = merges;

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, 'app');

  const date = new Date();
  const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  writeFile(workbook, `${app.name}_${dateString}.xlsx`);
}

/**
 * 出力するフィールド情報を返却します
 *
 * @param {Object} sample フィールドを取得するためのサンプルレコード
 */
const getFields = (
  views: ViewList,
  properties: kintoneAPI.FieldProperties,
  viewId: string,
  displaysAll: boolean
): kintoneAPI.FieldProperty[] => {
  if (displaysAll) {
    return Object.values(properties);
  }

  // レコードを全て表示しない場合は現在の一覧情報を取得し、表示しているフィールドを取得します
  const found = Object.values(views).find((view) => viewId === view.id);

  if (!found || found.type !== 'LIST') {
    return Object.values(properties);
  }

  return Object.values(properties).filter((property) => found.fields.includes(property.code));
};

/**
 * Excelシートオブジェクトの特定のセルに、値をセットします
 *
 * @param {Object} sheet Excelシートオブジェクト
 * @param {Number} row 設定するセルの行
 * @param {Number} col 設定するセルの列
 * @param {String} value 設定する値
 *
 */
function setCell(sheet: Sheet, row: number, col: number, value: string) {
  const coordinate = utils.encode_cell({ r: row, c: col });

  sheet[coordinate] = { t: 's', v: value };
}

const getFieldValue = (field: kintoneAPI.Field) => {
  switch (field.type) {
    case 'CREATOR':
    case 'MODIFIER':
      return `${field.value.name}(${field.value.code})`;

    case 'CHECK_BOX':
    case 'MULTI_SELECT':
    case 'CATEGORY':
      return field.value.join('\n');

    case 'USER_SELECT':
    case 'ORGANIZATION_SELECT':
    case 'GROUP_SELECT':
    case 'STATUS_ASSIGNEE':
      return field.value.map((value) => value.name).join('\n');

    case 'FILE':
      return field.value.map((value) => value.name).join('\n');

    case 'SUBTABLE':
      return '';

    default:
      return field.value || '';
  }
};
