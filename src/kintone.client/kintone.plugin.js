
const plugin = {};

/**
 * プラグインに保持しているパラメータを返却します.
 *
 * @return {Object} プラグインに保持しているパラメータ
 */
plugin.getConfig = props => {

  const config = kintone.plugin.app.getConfig(props.id);

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
plugin.setConfig = props => {

  // 引数のプロパティをJSON形式に変換し、格納し直します
  const config = Object.keys(props.config).reduce((accu, key) => {

    accu[key] = JSON.stringify(props.config[key]);

    return accu;

  }, {});

  kintone.plugin.app.setConfig(config);
}

export default plugin;
