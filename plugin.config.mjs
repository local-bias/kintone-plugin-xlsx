//@ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'xlsx';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 28304,
  },
  lint: {
    build: false,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.3.0',
      type: 'APP',
      name: {
        en: 'Excel Export Plugin',
        ja: 'Excel出力プラグイン',
        zh: 'Excel导出插件',
        'zh-TW': 'Excel匯出插件',
        es: 'Complemento de exportación de Excel',
        'pt-BR': 'Plugin de Exportação do Excel',
        th: 'ปลั๊กอินส่งออก Excel',
      },
      description: {
        en: 'By adding this plugin to your app, you can export the information from a list in xlsx format.',
        ja: 'アプリに追加することで、一覧の情報をそのままxlsx形式で出力できます。',
        zh: '将此插件添加到您的应用程序中，您可以将列表中的信息导出为xlsx格式。',
        'zh-TW': '將此插件添加到您的應用程式中，您可以將列表中的資訊匯出為xlsx格式。',
        es: 'Al agregar este complemento a su aplicación, puede exportar la información de una lista en formato xlsx.',
        'pt-BR':
          'Ao adicionar este plugin ao seu aplicativo, você pode exportar as informações de uma lista em formato xlsx.',
        th: 'โดยการเพิ่มปลั๊กอินนี้ลงในแอปของคุณ คุณสามารถส่งออกข้อมูลจากรายการในรูปแบบ xlsx ได้',
      },
      icon: 'icon.png',
      homepage_url: { ja: hp, en: hp },
      desktop: { js: [`${cdn}/common/desktop.js`], css: [`${cdn}/common/desktop.css`] },
      mobile: { js: [`${cdn}/common/desktop.js`], css: [`${cdn}/common/desktop.css`] },
      config: {
        html: 'config.html',
        js: [`${cdn}/common/config.js`],
        css: [`${cdn}/common/config.css`],
        required_params: [],
      },
    },
    prod: {
      desktop: { js: [`${cdn}/${key}/desktop.js`], css: [`${cdn}/${key}/desktop.css`] },
      mobile: { js: [`${cdn}/${key}/desktop.js`], css: [`${cdn}/${key}/desktop.css`] },
      config: { js: [`${cdn}/${key}/config.js`], css: [`${cdn}/${key}/config.css`] },
    },
    standalone: {
      desktop: { js: ['desktop.js'], css: ['desktop.css'] },
      mobile: { js: ['desktop.js'], css: ['desktop.css'] },
      config: { js: ['config.js'], css: ['config.css'] },
    },
  },
});
