import React from 'react'
import './sentry';
console.log('[ponty] sentry boot ' + new Date().toISOString());
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)