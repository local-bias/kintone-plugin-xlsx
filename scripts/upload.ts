const { exec } = require('child_process');

require('dotenv').config();

(() => {
  if (!process.env.KINTONE_URL) {
    throw new Error('.envファイルが正しく設定されていません');
  }

  exec(
    `kintone-plugin-uploader dist/plugin-dev.zip --base-url ${process.env.KINTONE_URL} --username ${process.env.LOGIN_NAME} --password ${process.env.LOGIN_PASS} --watch --waiting-dialog-ms 3000`
  );
})();
