
const plugin = {};

/**
 * プラグインに保持しているパラメータを返却します.
 *
 * @return {Object} プラグインに保持しているパラメータ
 */
plugin.getConfig = obj => {

  const config = kintone.plugin.app.getConfig(obj.id);

  return Object.keys(config).reduce((accu, key) => {

    accu[key] = JSON.parse(config[key]);

    return accu;

  }, {});
}

/**
 * プラグインに保持させるパラメータを設定します
 *
 * @param {Object} params プラグインに保持させるパラメータ
 */
plugin.setConfig = obj => {

  // 引数のプロパティをJSON形式に変換し、格納し直します
  const config = Object.keys(obj.config).reduce((accu, key) => {

    accu[key] = JSON.stringify(obj.config[key]);

    return accu;

  }, {});

  kintone.plugin.app.setConfig(config);
}

export default plugin;
