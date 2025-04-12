import { loadingAtom, loadingEndAtom, loadingStartAtom } from '@/common/global-state';
import styled from '@emotion/styled';
import { storeStorage } from '@konomi-app/kintone-utilities';
import { PluginFooter } from '@konomi-app/kintone-utilities-react';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import React, { FC, useCallback } from 'react';
import { pluginConfigAtom } from '../../../states/plugin';
import ExportButton from './export-button';
import ImportButton from './import-button';
import ResetButton from './reset-button';

const handlePluginConfigSaveAtom = atom(null, (get, set) => {
  set(loadingStartAtom);
  try {
    const storage = get(pluginConfigAtom);

    storeStorage(storage!, () => true);
    enqueueSnackbar('設定を保存しました', {
      variant: 'success',
      action: (
        <Button color='inherit' size='small' variant='outlined' onClick={() => history.back()}>
          プラグイン一覧に戻る
        </Button>
      ),
    });
  } finally {
    set(loadingEndAtom);
  }
});

const Component: FC<{ className?: string }> = ({ className }) => {
  const loading = useAtomValue(loadingAtom);
  const onBackButtonClick = useCallback(() => history.back(), []);
  const onSaveButtonClick = useSetAtom(handlePluginConfigSaveAtom);

  return (
    <PluginFooter {...{ className }}>
      <div>
        <Button
          variant='contained'
          color='primary'
          disabled={loading}
          onClick={onSaveButtonClick}
          startIcon={loading ? <CircularProgress color='inherit' size={20} /> : <SaveIcon />}
        >
          設定を保存
        </Button>
        <Button
          variant='contained'
          color='inherit'
          disabled={loading}
          onClick={onBackButtonClick}
          startIcon={
            loading ? <CircularProgress color='inherit' size={20} /> : <SettingsBackupRestoreIcon />
          }
        >
          プラグイン一覧へ戻る
        </Button>
      </div>
      <div>
        <ExportButton />
        <ImportButton />
        <ResetButton />
      </div>
    </PluginFooter>
  );
};

const StyledComponent = styled(Component)`
  button {
    margin: 8px;
  }
`;

export default StyledComponent;
