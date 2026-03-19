import { GUEST_SPACE_ID } from '@/common/global';
import { store } from '@/lib/store';
import {
  getAllRecords,
  getAppId,
  getQuery,
  getQueryCondition,
  kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { CellStyle, Range, RowInfo, WorkSheet, utils, writeFile } from 'xlsx-js-style';
import {
  currentAppFormFieldsAtom,
  currentAppPropertyAtom,
  currentAppViewsAtom,
} from '../states/kintone';

type ViewList = Record<string, kintoneAPI.view.Response>;
type DateCell = { __isDate: true; serial: number; format: string };
type CellValue = string | number | DateCell;

/* ---- スタイル定義 -------------------------------------------------------- */

const BORDER: CellStyle['border'] = {
  top: { style: 'thin', color: { rgb: 'D0D0D0' } },
  bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
  left: { style: 'thin', color: { rgb: 'D0D0D0' } },
  right: { style: 'thin', color: { rgb: 'D0D0D0' } },
};

const HEADER_STYLE: CellStyle = {
  font: { name: 'Yu Gothic', sz: 11, bold: true },
  fill: { fgColor: { rgb: 'FAFAFA' }, patternType: 'solid' },
  alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
  border: BORDER,
};

const DATA_STYLE: CellStyle = {
  font: { name: 'Yu Gothic', sz: 11 },
  alignment: { vertical: 'top', wrapText: true },
  border: BORDER,
};

/* ---- Excelシリアル日付変換 ------------------------------------------------ */

/** Date を Excel 日付シリアル値に変換します (1900 うるう年バグ込み) */
function toExcelSerial(date: Date): number {
  const epoch = Date.UTC(1899, 11, 30);
  return (date.getTime() - epoch) / 86400000;
}

/* ---- メイン関数 ----------------------------------------------------------- */

/**
 * 受け取ったkintoneレコードを変換し、XLSX形式でダウンロードします
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

  if (!targetRecords.length) {
    return;
  }

  const [app, { views }, { properties }] = await Promise.all([
    store.get(currentAppPropertyAtom),
    store.get(currentAppViewsAtom),
    store.get(currentAppFormFieldsAtom),
  ]);

  const merges: Range[] = [];
  const sheet: WorkSheet = utils.aoa_to_sheet([[]]);

  const fields = await getFields(
    views,
    properties,
    String(event.viewId),
    Boolean(config.allFields)
  );

  process.env.NODE_ENV === 'development' && console.log({ fields, views });

  const includesSubtable = fields.some((field) => field.type === 'SUBTABLE');

  let row = 0;
  let col = 0;
  const tableFields: kintoneAPI.property.Subtable[] = [];

  // 列幅の自動調整用: 各列の最大文字数を記録
  const colWidths: number[] = [];

  const trackWidth = (colIndex: number, value: CellValue) => {
    const len =
      typeof value === 'object' && '__isDate' in value
        ? 12 // 日付表示の目安幅
        : String(value).length;
    if (!colWidths[colIndex] || colWidths[colIndex] < len) {
      colWidths[colIndex] = len;
    }
  };

  // ヘッダー行を作成します
  for (const field of fields) {
    setCell(sheet, row, col, field.label);
    trackWidth(col, field.label);

    if (field.type === 'SUBTABLE') {
      tableFields.push(field as kintoneAPI.property.Subtable);

      Object.keys(field.fields).map((key, j) => {
        setCell(sheet, row + 1, col + j, field.fields[key].label);
        trackWidth(col + j, field.fields[key].label);
      });

      merges.push({
        s: { r: row, c: col },
        e: { r: row, c: col + Object.keys(field.fields).length - 1 },
      });

      col += Object.keys(field.fields).length;
    } else {
      if (includesSubtable) {
        merges.push({
          s: { r: row, c: col },
          e: { r: row + 1, c: col },
        });
      }
      col++;
    }
  }

  const headerRowCount = includesSubtable ? 2 : 1;
  row = headerRowCount;
  const maxCol = col;

  // データ行を作成します
  for (const record of targetRecords) {
    col = 0;

    let rowCount = 1;
    tableFields.map((tf) => {
      const subtable = record[tf.code] as kintoneAPI.field.Subtable;
      const len = subtable.value.length;
      if (rowCount < len) rowCount = len;
    });

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
            const value = getFieldValue(tableRow.value[key], config.dateAsExcel);
            setCell(sheet, row + j, col + k, value);
            trackWidth(col + k, value);
          });
        });

        col += Object.keys((field as any).fields).length;
      } else {
        const value = getFieldValue(targetField, config.dateAsExcel);
        setCell(sheet, row, col, value);
        trackWidth(col, value);

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
  sheet['!cols'] = colWidths.map((w) => ({ wch: Math.min(60, Math.max(8, w + 2)) }));

  // スタイルの適用 (游ゴシック・ヘッダー背景色・ボーダー)
  applyStyles(sheet, row, maxCol, headerRowCount);

  // ヘッダー行の固定 (Freeze Panes)
  (sheet as any)['!views'] = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: headerRowCount,
      topLeftCell: utils.encode_cell({ r: headerRowCount, c: 0 }),
    },
  ];

  const sheetName = buildSheetName(config.sheetName ?? '{appName}', app.name, appId);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, sheetName);

  const fileName = buildFileName(config.fileNameTemplate ?? '{appName}_{date}', app.name, appId);
  writeFile(workbook, `${fileName}.xlsx`);
}

/* ---- スタイル適用 --------------------------------------------------------- */

/**
 * シート全体に游ゴシックフォント・ヘッダースタイル・ボーダーを適用します
 */
function applyStyles(sheet: WorkSheet, lastRow: number, lastCol: number, headerRows: number): void {
  for (let r = 0; r < lastRow; r++) {
    for (let c = 0; c < lastCol; c++) {
      const addr = utils.encode_cell({ r, c });
      if (sheet[addr]) {
        sheet[addr].s = r < headerRows ? HEADER_STYLE : DATA_STYLE;
      }
    }
  }

  // 行の高さ: ヘッダー行は少し高めに設定
  const rows: RowInfo[] = Array.from({ length: lastRow }, (_, r) =>
    r < headerRows ? { hpx: 28 } : { hpx: 18 }
  );
  sheet['!rows'] = rows;
}

/* ---- ファイル名・シート名 -------------------------------------------------- */

/**
 * テンプレート変数を展開します
 * 使用可能な変数: {appName}, {date}, {time}, {appId}
 */
function buildFileName(template: string, appName: string, appId: string | number): string {
  const now = new Date();
  const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const time = `${hh}-${mm}`;

  return template
    .replace(/\{appName\}/g, appName)
    .replace(/\{date\}/g, date)
    .replace(/\{time\}/g, time)
    .replace(/\{appId\}/g, String(appId));
}

/**
 * シート名テンプレートから実際のシート名を生成します
 * Excel のシート名制限: 31文字以内, \/:*?[] 使用不可
 */
function buildSheetName(template: string, appName: string, appId: string | number): string {
  const raw = buildFileName(template, appName, appId);
  const cleaned = raw.replace(/[\\/:*?[\]]/g, '_');
  return cleaned.slice(0, 31) || 'Sheet1';
}

/* ---- フィールド一覧取得 --------------------------------------------------- */

/**
 * 出力するフィールド情報を返却します
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

  const foundView = Object.values(views).find((view) => viewId === view.id);

  if (!foundView || foundView.type !== 'LIST') {
    return Object.values(properties);
  }

  return foundView.fields
    .map<
      kintoneAPI.FieldProperty | undefined
    >((field) => Object.values(properties).find((property) => property.code === field))
    .filter(Boolean) as kintoneAPI.FieldProperty[];
};

/* ---- セル書き込み --------------------------------------------------------- */

/**
 * Excelシートの特定セルに値をセットします
 * 数値 → 数値型, 日付 → 日付シリアル値+フォーマット, それ以外 → 文字列型
 */
function setCell(sheet: WorkSheet, row: number, col: number, value: CellValue) {
  const coordinate = utils.encode_cell({ r: row, c: col });

  if (typeof value === 'object' && '__isDate' in value) {
    sheet[coordinate] = { t: 'n', v: value.serial, z: value.format };
  } else if (typeof value === 'number') {
    sheet[coordinate] = { t: 'n', v: value };
  } else {
    sheet[coordinate] = { t: 's', v: value };
  }
}

/* ---- フィールド値変換 ----------------------------------------------------- */

const getFieldValue = (field: kintoneAPI.Field, dateAsExcel = false): CellValue => {
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

    case 'NUMBER':
    case 'CALC': {
      const num = Number(field.value);
      return isNaN(num) ? (field.value ?? '') : num;
    }

    case 'DATE':
      if (dateAsExcel && field.value) {
        return {
          __isDate: true,
          serial: toExcelSerial(new Date(field.value + 'T00:00:00Z')),
          format: 'yyyy/mm/dd',
        };
      }
      return field.value || '';

    case 'DATETIME':
      if (dateAsExcel && field.value) {
        return {
          __isDate: true,
          serial: toExcelSerial(new Date(field.value)),
          format: 'yyyy/mm/dd\\ hh:mm:ss',
        };
      }
      return field.value || '';

    case 'TIME':
      if (dateAsExcel && field.value) {
        const [h, m] = field.value.split(':').map(Number);
        return { __isDate: true, serial: (h * 60 + m) / 1440, format: 'hh:mm' };
      }
      return field.value || '';

    default:
      return (field as any).value || '';
  }
};
