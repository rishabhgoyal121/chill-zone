import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppLoader } from './components/AppLoader.jsx';
import './styles/global.css';

const App = lazy(() => import('./pages/App.jsx').then((m) => ({ default: m.App })));

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Suspense fallback={<AppLoader subtitle="Loading application shell..." />}>
        <App />
      </Suspense>
    </AuthProvider>
  </React.StrictMode>
);
