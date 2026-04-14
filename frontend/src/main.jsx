import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './pages/App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
