import { PLUGIN_ID } from '@/common/global';
import { createConfig } from '@/common/plugin';
import { restorePluginConfig } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';

export const pluginConfigAtom = atom<kintone.plugin.Storage>({
  ...createConfig(),
  ...(restorePluginConfig<kintone.plugin.Storage>(PLUGIN_ID) ?? {}),
});
