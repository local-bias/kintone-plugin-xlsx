import Launcher from '@common/launcher';

import main from './embedding-xlsx-button';

((PLUGIN_ID) => new Launcher(PLUGIN_ID).launch([main]))(kintone.$PLUGIN_ID);
