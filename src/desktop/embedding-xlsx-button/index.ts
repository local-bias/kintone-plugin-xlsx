import { getHeaderSpace } from '@common/kintone';
import { restoreStorage } from '@common/plugin';
import { getButton } from './button-creation';
import { download } from './conversion';

const BUTTON_ID = 'ribbit-plugin-xlsx';

const PREFIX = '[Excel出力プラグイン]';

const events: launcher.EventTypes = ['app.record.index.show'];

const action: launcher.Action = (event, pluginId) => {
  // 既に設置済みの場合は処理しません
  if (document.querySelector(`#${BUTTON_ID}`)) {
    return event;
  }

  const storage = restoreStorage(pluginId);

  const button = getButton(BUTTON_ID);
  const headerMenuSpace = getHeaderSpace(event.type);
  if (headerMenuSpace) {
    headerMenuSpace.append(button);
  }

  // クリック時のイベントを作成します
  button.onclick = async () => {
    button.disabled = true;
    try {
      await download(event, storage);
    } catch (error) {
      console.error(error);
      (event as any)?.error(PREFIX + '出力時にエラーが発生しました');
    } finally {
      button.disabled = false;
    }
  };

  return event;
};

export default { events, action };
