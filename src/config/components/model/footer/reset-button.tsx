import { createConfig } from '@/common/plugin';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import React, { FC } from 'react';
import { pluginConfigAtom } from '../../../states/plugin';

const openAtom = atom(false);

const handleIconButtonClickAtom = atom(null, (_, set) => {
  set(openAtom, true);
});

const handleDialogCloseAtom = atom(null, (_, set) => {
  set(openAtom, false);
});

const handlePluginConfigResetAtom = atom(null, (_, set) => {
  set(pluginConfigAtom, createConfig());
  set(openAtom, false);
  enqueueSnackbar('設定をリセットしました', { variant: 'success' });
});

function ResetDialog() {
  const open = useAtomValue(openAtom);
  const onDecisionButtonClick = useSetAtom(handlePluginConfigResetAtom);
  const onClose = useSetAtom(handleDialogCloseAtom);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>設定のリセット</DialogTitle>
      <DialogContent>
        <DialogContentText>
          このプラグインの設定を初期状態に戻します。よろしいですか？
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color='primary' variant='contained' onClick={onDecisionButtonClick}>
          実行
        </Button>
        <Button color='inherit' variant='contained' onClick={onClose}>
          キャンセル
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const ResetButtonComponent: FC = () => {
  const onIconButtonClick = useSetAtom(handleIconButtonClickAtom);
  return (
    <Tooltip title='プラグインの設定をリセット'>
      <IconButton onClick={onIconButtonClick}>
        <RestartAltIcon />
      </IconButton>
    </Tooltip>
  );
};

export default function ResetButton() {
  return (
    <>
      <ResetDialog />
      <ResetButtonComponent />
    </>
  );
}
