import 'cheerio';
import 'htmlparser2';
import 'dayjs';
import 'protobufjs';
import '@fontsource/geist-sans';
import '@fontsource/geist-mono';
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

const { fetch: originalFetch } = window;

window.fetch = async (...args) => {
  const [resource, config] = args;
  const url = resource.toString();

  // Skip non-HTTP requests (relative paths, blobs, etc.)
  if (!url.startsWith('http://') && !url.startsWith('https://'))
    return await originalFetch(resource, config);

  // Skip localhost requests (Vite HMR, CSS, JS, etc.)
  if (url.includes('localhost') || url.includes('127.0.0.1'))
    return await originalFetch(resource, config);

  const _res = await originalFetch('http://localhost:3000/' + url, {
    ...config,
    credentials: 'include',
    mode: 'cors',
  });
  Object.defineProperty(_res, 'url', {
    value: _res.url.includes('localhost') ? url : _res.url,
  });
  return _res;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
