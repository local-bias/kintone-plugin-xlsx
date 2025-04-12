import { loadingAtom, loadingEndAtom, loadingStartAtom } from '@/common/global-state';
import { PLUGIN_NAME } from '@/common/static';
import { PluginConfigExportButton } from '@konomi-app/kintone-utilities-react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import React, { FC, memo } from 'react';
import { pluginConfigAtom } from '../../../states/plugin';

const handlePluginConfigExportAtom = atom(null, async (get, set) => {
  try {
    set(loadingStartAtom);
    const storage = await get(pluginConfigAtom);
    const blob = new Blob([JSON.stringify(storage, null)], {
      type: 'application/json',
    });
    const url = (window.URL || window.webkitURL).createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${PLUGIN_NAME}-config.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    enqueueSnackbar('プラグインの設定情報をエクスポートしました', { variant: 'success' });
  } catch (error) {
    enqueueSnackbar(
      'プラグインの設定情報のエクスポートに失敗しました。プラグイン開発者にお問い合わせください。',
      { variant: 'error' }
    );
    throw error;
  } finally {
    set(loadingEndAtom);
  }
});

const Component: FC = () => {
  const loading = useAtomValue(loadingAtom);
  const onClick = useSetAtom(handlePluginConfigExportAtom);

  return <PluginConfigExportButton loading={loading} onExportButtonClick={onClick} />;
};

export default memo(Component);
