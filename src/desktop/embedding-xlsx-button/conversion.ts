import xlsx, { Sheet, WorkBook } from 'xlsx';
import { getAllRecords } from '@common/kintone-rest-api';
import { getAppId, getQuery, getQueryCondition } from '@common/kintone';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { Properties, ViewForResponse } from '@kintone/rest-api-client/lib/client/types';
import {
  OneOf as FieldProperty,
  Subtable as SubtableProperty,
  InSubtable as InSubtableProperty,
} from '@kintone/rest-api-client/lib/KintoneFields/types/property';
import {
  InSubtable as InSubtableField,
  OneOf as KintoneField,
  Subtable as SubtableField,
} from '@kintone/rest-api-client/lib/KintoneFields/types/field';

type ViewList = Record<string, ViewForResponse>;

type SubTable = SubtableField<Record<string, InSubtableField>>;
type SubTableProperty = SubtableProperty<Record<string, InSubtableProperty>>;

/**
 * 受け取ったkintoneレコードを変換し、XLSX形式でダウンロードします
 *
 * @param {Object} event kintoneイベント情報
 */
export async function download(event: kintone.Event, config: kintone.plugin.Storage) {
  const appId = getAppId();

  if (!appId) {
    return;
  }

  const query = (config.allRecords ? getQueryCondition() : getQuery()) || '';

  const targetRecords = await getAllRecords({ app: appId, query });

  // レコードが存在しない場合は処理しません
  if (!targetRecords.length) {
    return;
  }

  const client = new KintoneRestAPIClient();

  const [app, { views }, { properties }] = await Promise.all([
    client.app.getApp({ id: appId }),
    client.app.getViews({ app: appId }),
    client.app.getFormFields({ app: appId }),
  ]);

  // 最終的にExcelシートとして登録するオブジェクトを定義します
  const sheet: Sheet = {
    '!merges': [],
  };

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
  const tableFields: SubTableProperty[] = [];

  for (const field of fields) {
    // セルの値を設定します
    setCell(sheet, row, col, field.label);

    // サブテーブルの場合
    if (field.type === 'SUBTABLE') {
      tableFields.push(field as SubTableProperty);

      Object.keys(field.fields).map((key, j) => {
        setCell(sheet, row + 1, col + j, field.fields[key].label);
      });

      sheet['!merges'].push({
        s: { r: row, c: col },
        e: { r: row, c: col + Object.keys(field.fields).length - 1 },
      });

      col += Object.keys(field.fields).length;
    } else {
      // セルの結合条件を設定します
      if (includesSubtable) {
        sheet['!merges'].push({
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
      const subtable = record[tf.code] as SubTable;

      const len = subtable.value.length;
      if (rowCount < len) {
        rowCount = len;
      }
    });

    // フィールドの各値を設定します
    for (const field of fields) {
      const targetField = record[field.code];

      if (targetField.type === 'SUBTABLE') {
        const subValue = targetField as any as SubTable;

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
          sheet['!merges'].push({
            s: { r: row, c: col },
            e: { r: row + rowCount - 1, c: col },
          });
        }
        col++;
      }
    }

    row += rowCount;
  }

  sheet['!ref'] = xlsx.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: maxCol, r: row } });

  const workbook: WorkBook = { SheetNames: [], Sheets: {} };
  workbook.SheetNames.push('app');
  workbook.Sheets['app'] = sheet;

  const date = new Date();
  const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  xlsx.writeFile(workbook, `${app.name}_${dateString}.xlsx`);
}

/**
 * 出力するフィールド情報を返却します
 *
 * @param {Object} sample フィールドを取得するためのサンプルレコード
 */
const getFields = async (
  views: ViewList,
  properties: Properties,
  viewId: string,
  displaysAll: boolean
) => {
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
  const coordinate = xlsx.utils.encode_cell({ r: row, c: col });

  sheet[coordinate] = { t: 's', v: value };
}

const getFieldValue = (field: KintoneField) => {
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
