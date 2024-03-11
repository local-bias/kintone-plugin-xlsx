import React, { FC } from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';
import { URL_INQUIRY } from '@/common/static';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

const Component: FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div>
    <Alert severity='error'>
      <AlertTitle title={error.message}>エラーが発生しました</AlertTitle>
      <p>予期しないエラーが発生しました</p>
      <p>リトライしても解決しない場合は、開発者までお問い合わせください。</p>
      <div>
        <Button color='error' onClick={resetErrorBoundary}>
          リトライ
        </Button>
        <Button color='error' onClick={() => window.open(URL_INQUIRY, '_blank')}>
          お問い合わせ
        </Button>
      </div>
    </Alert>
  </div>
);

const Container: FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary FallbackComponent={Component}>{children}</ErrorBoundary>
);

export const PluginErrorBoundary = Container;
