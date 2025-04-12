import { URL_BANNER, URL_PROMOTION } from '@/common/static';
import { PluginErrorBoundary } from '@/components/error-boundary';
import { PluginBanner, PluginContent, PluginLayout } from '@konomi-app/kintone-utilities-react';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { SnackbarProvider } from 'notistack';
import React, { Suspense } from 'react';
import Footer from './components/model/footer';
import Form from './components/model/form';

export default function App() {
  return (
    <Suspense fallback={<LoaderWithLabel label='画面の描画を待機しています' />}>
      <PluginErrorBoundary>
        <SnackbarProvider maxSnack={1}>
          <Suspense fallback={<LoaderWithLabel label='設定情報を取得しています' />}>
            <PluginLayout singleCondition>
              <PluginContent>
                <PluginErrorBoundary>
                  <Form />
                </PluginErrorBoundary>
              </PluginContent>
              <PluginBanner url={URL_BANNER} />
              <Footer />
            </PluginLayout>
          </Suspense>
        </SnackbarProvider>
      </PluginErrorBoundary>
      <iframe
        title='promotion'
        loading='lazy'
        src={URL_PROMOTION}
        style={{ border: '0', width: '100%', height: '64px' }}
      />
    </Suspense>
  );
}
