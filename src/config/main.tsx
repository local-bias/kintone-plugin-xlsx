import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './app';

const main = (pluginId: string): void => {
  createRoot(document.getElementById('settings')!).render(<App {...{ pluginId }} />);
};

export default main;
