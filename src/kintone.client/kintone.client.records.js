
'use strict';

const END_POINT = '/k/v1/records';

// 各リクエストのレコード上限
const LIMIT_GET = 500;
const LIMIT_POST = 100;
const LIMIT_PUT = 100;
const LIMIT_DELETE = 100;

/**
 * 対象アプリの、指定条件のレコードを全て取得します
 * API使用回数を、(対象レコード数 / 500) + 1回消費します
 *
 * @param {Object} obj
 *   - {string} app アプリID (省略時は表示中アプリ)
 *   - {String} query 検索クエリ (省略時は全レコード)
 *   - {Array} fields 取得フィールド (省略時は全フィールド)
 * @return {Object} Promiseオブジェクト
 *   - {Array} records 取得レコードの配列
 */
exports.get = async obj => {

	// api送信用のパラメータを設定します
	const param = {
		'app': obj.app || kintone.app.getId() || kintone.mobile.app.getId(),
		'query': obj.query ? formatQuery(obj.query) : '',
		'fields': obj.fields || [],
		'size': LIMIT_GET
	};
	if (typeof obj.totalCount !== 'undefined') {
		param.totalCount = true;
	}

	const cursor = await kintone.api(kintone.api.url(`${END_POINT}/cursor`, true), 'POST', param);

  obj.onGetTotal ? obj.onGetTotal(cursor.totalCount) : '';

	return getRecordsByCursorId(cursor.id);
};

/**
 * 全件表示用に検索クエリを修正します
 *
 * @param {String} query 元のクエリ
 * @return {String} 修正後のクエリ
 */
function formatQuery(query) {
  return query.replace(/limit.*/g, '').replace(/offset.*/g, '');
}

/**
 * カーソルIDからAPIを利用し、レコードを取得します
 * 一度の検索で取得しきれない場合は、再帰的に関数が呼ばれ
 * レコードを蓄積させていきます
 *
 * @param {String} id カーソルID
 * @param {Object} loadedData 前回呼び出し時までに取得されたレコード
 * @return {Promise} 取得した全レコード
 */
async function getRecordsByCursorId(id, loadedData) {

	// 初期値を設定します
	const data = loadedData || {};
	data.records = data.records || [];

	const response = await kintone.api(kintone.api.url(`${END_POINT}/cursor`, true), 'GET', {id: id});

	data.records = data.records.concat(response.records);
	return response.next ? getRecordsByCursorId(id, data) : data;
}

/**
 * 受け取った全てのレコードを、対象アプリに作成します
 * API使用回数を、(対象レコード数 / 上限) + 1回消費します
 * 全てのAPIを並列で実行するとエラーが発生する場合があるため、
 * １つずつ完了を確認してから次を実行します
 *
 * @param {Array} _records 処理対象レコード
 * @param {String} _app アプリID (省略時はこの関数が実行されたアプリ)
 * @return {Promise} API実行結果の配列
 */
exports.post = async obj => {

	let records = obj.records.slice();
	const count = records.length;
	const app = obj.app || kintone.app.getId() || kintone.mobile.app.getId();

	const responses = [];

	while (records.length) {
		responses.push(await kintone.api(kintone.api.url(END_POINT, true), 'POST', {
			'app': app,
			'records': records.slice(0, LIMIT_POST)
		}));
		records.splice(0, LIMIT_POST);
	}

	responses.total = count;

	return responses;
}

/**
 * 受け取った全てのレコードを、対象アプリに更新します
 * API使用回数を、(対象レコード数 / 上限) + 1回消費します
 * 全てのAPIを並列で実行するとエラーが発生する場合があるため、
 * １つずつ完了を確認してから次を実行します
 *
 * @param {Array} _records 処理対象レコード
 *   - {String} id レコードID
 *   - {Object} record kintoneレコード
 * @param {String} _app アプリID (省略時はこの関数が実行されたアプリ)
 * @return {Object} Promiseオブジェクト
 */
exports.put = async obj => {

  // ディープコピー
	let records = obj.records.slice();

	const count = records.length;
	const app = obj.app || kintone.app.getId() || kintone.mobile.app.getId();
	const responses = [];

	while (records.length) {
		responses.push(await kintone.api(kintone.api.url(END_POINT, true), 'PUT', {
			'app': app,
			'records': records.slice(0, LIMIT_PUT)
		}));
		records.splice(0, LIMIT_PUT);
	}

	responses.total = count;

	return responses;
}

/**
 * 受け取ったIDの全てのレコードを、対象アプリから削除します
 * API使用回数を、(対象レコード数 / 上限) + 1回消費します
 * 全てのAPIを並列で実行するとエラーが発生する場合があるため、
 * １つずつ完了を確認してから次を実行します
 * Kintone REST APIのdeleteは、完了後空配列しか返さないため、
 * 代わりに削除したレコード数を返します
 *
 * @param {Array} _ids 処理対象レコードIDの配列
 * @param {String} _app アプリID (省略時はこの関数が実行されたアプリ)
 * @return {Promise} 削除したレコード数
 */
exports.delete = async obj => {

  // ディープコピー
	let ids = obj.ids.slice();

	const count = ids.length;
	const app = obj.app || kintone.app.getId() || kintone.mobile.app.getId();

	while (ids.length) {
		await kintone.api(kintone.api.url(END_POINT, true), 'DELETE', {
			'app': app,
			'ids': ids.slice(0, LIMIT_DELETE)
		});
		ids.splice(0, LIMIT_DELETE);
	}

	return count;
}

/**
 * クエリを指定してデータを一括削除します
 *
 * @param {String} query 検索クエリ
 * @param {String} _app アプリID(省略時はこの関数が実行されたアプリ)
 * @return {Object} Promiseオブジェクト(fullfilledでレコード数)
 */
exports.deleteByQuery = async obj => {

	const app = obj.app || kintone.app.getId() || kintone.mobile.app.getId();

	const body = {
		'app': app,
		'query': obj.query,
		'fields': ['$id']
	}

	const response = await exports.get(body);

	const ids = response.records.map(record => record.$id.value);

	return exports.delete(ids, app);
}
