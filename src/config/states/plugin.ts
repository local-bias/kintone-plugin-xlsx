import { PLUGIN_ID } from '@/common/global';
import { createConfig } from '@/common/plugin';
import { restoreStorage } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';

export const pluginConfigAtom = atom<kintone.plugin.Storage>(
  restoreStorage<kintone.plugin.Storage>(PLUGIN_ID) ?? createConfig()
);
