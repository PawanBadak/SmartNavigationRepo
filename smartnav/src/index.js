import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // This looks for App.js in the same folder (src)
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);