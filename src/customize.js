import client from './kintone.client';
import xlsx from 'xlsx';

((PLUGIN_ID) => {
  'use strict';

  const CLASS_BUTTON = 'local-bias_excel_button-wrapper';

  const prefix = '[Excel出力プラグイン]';

  const app = kintone.app || kintone.mobile.app;

  kintone.events.on(['app.record.index.show', 'mobile.app.record.index.show'], (event) => {
    // 既に設置済みの場合は処理しません
    if (document.querySelector(`.${CLASS_BUTTON}`)) {
      return event;
    }

    // XLSXダウンロードボタンを設定します
    const button = document.createElement('button');
    button.classList.add(CLASS_BUTTON);
    button.innerHTML = `
      <div class="local-bias_excel_button-container">
        ${getExcelSvgHTML()}
        <div class="local-bias_spinner">
          <div class="local-bias_double-bounce1"></div>
          <div class="local-bias_double-bounce2"></div>
        </div>
      </div>
    `;

    // クリック時のイベントを作成します
    button.addEventListener('click', async (clicked) => {
      // 連続実行を防ぐため、ボタンを無効にします
      button.setAttribute('disabled', true);

      try {
        // Excelファイルをダウンロードします
        await downloadAsXlsx(event);
      } catch (error) {
        event.error(prefix + '出力時にエラーが発生しました');
        console.error(error);
      } finally {
        // ボタンを有効にします
        button.removeAttribute('disabled');
      }
    });

    // ヘッダーにボタンを設置します
    const headerMenuSpace = app.getHeaderMenuSpaceElement() || app.getHeaderSpaceElement();

    if (headerMenuSpace) {
      headerMenuSpace.append(button);
    }

    return event;
  });

  /**
   * 受け取ったkintoneレコードを変換し、XLSX形式でダウンロードします
   *
   * @param {Object} event kintoneイベント情報
   */
  async function downloadAsXlsx(event) {
    const config = client.plugin.getConfig({ id: PLUGIN_ID });

    let targetRecords = event.records;
    if (config.allRecords) {
      const allRecordsResponse = await client.records.get({
        query: app.getQuery(),
      });

      targetRecords = allRecordsResponse.records;
    }

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

  function getExcelSvgHTML() {
    return `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve">
      <g>
        <polygon points="388.032,45.654 388.032,83.077 474.573,83.077 474.573,428.961 388.032,428.961 388.032,466.388 512,466.388 512,45.654"></polygon>
        <rect x="388.032" y="120.5" width="49.118" height="65.398"></rect>
        <rect x="388.032" y="223.321" width="49.118" height="65.397"></rect>
        <rect x="388.032" y="326.141" width="49.118" height="65.397"></rect>
        <path d="M365.768,6.654V6.502L0,47.382V464.61l365.768,40.887v-39.11v-37.427v-37.423v-65.397v-37.423v-65.397v-37.423
          V120.5V83.077V45.654V10.511l0.015-3.857H365.768z M166.588,213.232l0.042-0.069l0.092,0.149l30.311-51.083l0.982-1.637
          l36.441-1.686l12.022-0.575l6.45-0.225l-16.835,27.792l-39.06,64.369l-3.742,6.175l3.742,6.13l38.733,63.57l10.914,17.938
          l5.917,9.891l-18.141-0.838l-19.598-0.906l-17.771-0.967l-0.054-0.091l-30.311-51.593l-7.112,11.646l-22.781,37.374l-33.647-1.526
          l-15.707-0.788l53.846-89.838l-36.913-61.571l-17.41-29.185l49.084-2.242l23.527,38.314l4.809,7.812L166.588,213.232z"></path>
      </g>
    </svg>
    `;
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
})(kintone.$PLUGIN_ID);
