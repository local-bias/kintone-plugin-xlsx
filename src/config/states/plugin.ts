import { PLUGIN_ID } from '@/common/global';
import { createConfig } from '@/common/plugin';
import { restoreStorage } from '@konomi-app/kintone-utilities';
import { atom } from 'recoil';

const PREFIX = 'plugin';

export const storageState = atom<kintone.plugin.Storage>({
  key: `${PREFIX}storageState`,
  default: restoreStorage<kintone.plugin.Storage>(PLUGIN_ID) ?? createConfig(),
});

export const loadingState = atom<boolean>({
  key: `${PREFIX}loadingState`,
  default: false,
});
