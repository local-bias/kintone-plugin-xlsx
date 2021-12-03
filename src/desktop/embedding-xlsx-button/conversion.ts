//@ts-nocheck

import xlsx from 'xlsx';
import { getAllRecords } from '@common/kintone-rest-api';
import { getQuery, getQueryCondition } from '@common/kintone';

const app = kintone.app || kintone.mobile.app;

/**
 * 受け取ったkintoneレコードを変換し、XLSX形式でダウンロードします
 *
 * @param {Object} event kintoneイベント情報
 */
export async function download(event: kintone.Event, config: kintone.plugin.Storage) {
  const query = (config.allRecords ? getQueryCondition() : getQuery()) || '';

  const targetRecords = await getAllRecords({ query });

  // レコードが存在しない場合は処理しません
  if (!targetRecords.length) {
    return false;
  }

  // 最終的にExcelシートとして登録するオブジェクトを定義します
  const sheet = {
    '!merges': [],
  };

  // 情報を補完するため、アプリ情報・フィールド情報をそれぞれ取得します
  const appRequest = kintone.api(kintone.api.url('/k/v1/app', true), 'GET', { id: app.getId() });

  const fieldResponse = await getFields(event.viewId, Boolean(config.allFields));

  const { fields, hasSubtable } = fieldResponse;

  // Excelファイルを作成します
  let row = 0;
  let col = 0;
  const tableFields = [];

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];

    // セルの値を設定します
    setCell(sheet, row, col, field.label);

    // サブテーブルの場合
    if (field.type === 'SUBTABLE') {
      tableFields.push(field);

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
      if (hasSubtable) {
        sheet['!merges'].push({
          s: { r: row, c: col },
          e: { r: row + 1, c: col },
        });
      }
      col++;
    }
  }

  row = hasSubtable ? 2 : 1;
  const maxCol = col;

  // 内容部分を作成します
  targetRecords.map((record) => {
    col = 0;

    // レコードが使用する行数を算出します
    let rowCount = 1;
    tableFields.map((tf) => {
      const len = record[tf.code].value.length;
      if (rowCount < len) {
        rowCount = len;
      }
    });

    // フィールドの各値を設定します
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      if (field.type === 'SUBTABLE') {
        const subValue = record[field.code].value;

        record[field.code].value.map((tableRow, j) => {
          Object.keys(field.fields).map((key, k) => {
            setCell(sheet, row + j, col + k, tableRow.value[key].value);
          });
        });

        col += Object.keys(field.fields).length;
      } else {
        // 設定する値を取得します
        let value = '';
        if (record[field.code]) {
          if (
            field.type === 'CREATOR' ||
            field.type === 'MODIFIER' ||
            field.type === 'STATUS_ASSIGNEE'
          ) {
            value = record[field.code].value.name;
          } else {
            value = record[field.code].value;
          }
        }

        // セルの値を設定します
        setCell(sheet, row, col, value);

        if (hasSubtable && config.union) {
          sheet['!merges'].push({
            s: { r: row, c: col },
            e: { r: row + rowCount - 1, c: col },
          });
        }
        col++;
      }
    }
    row += rowCount;
  });

  sheet['!ref'] = xlsx.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: maxCol, r: row } });

  const workbook = { SheetNames: [], Sheets: {} };
  workbook.SheetNames.push('app');
  workbook.Sheets['app'] = sheet;

  const appInfo = await appRequest;
  const date = new Date();

  xlsx.writeFile(workbook, `${appInfo.name}.xlsx`);
}

/**
 * 出力するフィールド情報を返却します
 *
 * @param {Object} sample フィールドを取得するためのサンプルレコード
 */
async function getFields(viewId, displaysAll) {
  let viewFields;

  // レコードを全て表示しない場合は現在の一覧情報を取得し、表示しているフィールドを取得します
  if (!displaysAll) {
    const viewResponse = await kintone.api(kintone.api.url('/k/v1/app/views', true), 'GET', {
      app: app.getId(),
    });

    const viewNames = Object.keys(viewResponse.views);

    for (let i = 0; i < viewNames.length; i++) {
      const view = viewResponse.views[viewNames[i]];

      if (view.id == viewId) {
        viewFields = view.fields;
        break;
      }
    }
  }

  // 取得した一覧のどのIDにも当てはまらない場合は、恐らく全てを表示している場合
  if (!displaysAll && !viewFields) {
    displaysAll = true;
  }

  const fieldsResponse = kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', {
    app: app.getId(),
  });

  const properties = (await fieldsResponse).properties;

  // レコード一覧にサブテーブルが存在する場合は、ヘッダーを2行に設定します
  // サブテーブルの有無を保持します
  let hasSubtable = false;

  // 設定から、出力する項目情報を取得します
  const fields = Object.keys(properties).reduce((accu, code) => {
    if (displaysAll || (viewFields && viewFields.includes(code))) {
      accu.push(properties[code]);

      if (!hasSubtable) {
        hasSubtable = properties[code].type === 'SUBTABLE';
      }
    }
    return accu;
  }, []);

  return {
    fields: fields,
    hasSubtable: hasSubtable,
  };
}

/**
 * Excelシートオブジェクトの特定のセルに、値をセットします
 *
 * @param {Object} sheet Excelシートオブジェクト
 * @param {Number} row 設定するセルの行
 * @param {Number} col 設定するセルの列
 * @param {String} value 設定する値
 *
 */
function setCell(sheet, row, col, value) {
  const coordinate = xlsx.utils.encode_cell({ r: row, c: col });

  sheet[coordinate] = { t: 's', v: value };
}
