import './index.css';
import '@fontsource/raleway/300-italic.css';
import '@fontsource/raleway/300.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import App from './App.tsx';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
