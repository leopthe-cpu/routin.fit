import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans/latin-300.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // offline support is optional; the app works without it
    });
  });
}

// Ask the browser not to clear saved progress under storage pressure (best effort).
navigator.storage?.persist?.().catch(() => {});

// iOS Safari ignores user-scalable=no for pinches; block its gesture events too.
for (const type of ['gesturestart', 'gesturechange']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}
