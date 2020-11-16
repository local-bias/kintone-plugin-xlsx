
import plugin from './kintone.client/kintone.plugin.js';

(PLUGIN_ID => {
  'use strict';

  const allRecords = document.getElementById('allRecords');
  const allFields = document.getElementById('allFields');
  const union = document.getElementById('union');

  onload();

  const submitButton = document.getElementById('lb-submitButton');

  if (submitButton) {
    submitButton.addEventListener('click', clicked => {

      const config = plugin.getConfig({'id': PLUGIN_ID});

      config.allRecords = allRecords.checked;
      config.allFields = allFields.checked;
      config.union = union.checked;

      plugin.setConfig({'config': config});
    });
  }

  // キャンセルボタンクリック時の処理
  const cancelButton = document.getElementById('lb-cancelButton');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => history.back());
  }

  function onload() {
    const config = plugin.getConfig({'id': PLUGIN_ID});

    if (typeof config.allRecords !== 'undefined') {
      allRecords.checked = config.allRecords;
    }
    if (typeof config.allFields !== 'undefined') {
      allFields.checked = config.allFields;
    }
    if (typeof config.union !== 'undefined') {
      union.checked = config.union;
    }
  }
})(kintone.$PLUGIN_ID);
