import { KintoneEventListener, restoreStorage } from '@konomi-app/kintone-utilities';
import { getButton } from './button-creation';
import { download } from './conversion';
import { getHeaderSpace } from '@lb-ribbit/kintone-xapp';
import { createConfig } from '@/common/plugin';

const BUTTON_ID = 'ribbit-plugin-xlsx';

export default (listener: KintoneEventListener) => {
  listener.add(['app.record.index.show'], async (event, otherProps) => {
    const { pluginId } = otherProps ?? {};
    if (!pluginId) {
      return event;
    }
    // 既に設置済みの場合は処理しません
    if (document.querySelector(`#${BUTTON_ID}`)) {
      return event;
    }

    const storage = restoreStorage(pluginId) ?? createConfig();

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
      } finally {
        button.disabled = false;
      }
    };

    return event;
  });
};
