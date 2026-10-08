import { loadCatalog } from './lib/catalog';
import { AffiliateProvider } from './context/AffiliateContext';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { CartProvider } from './context/CartContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { ToastProvider } from './context/ToastContext';

// Inicia a consulta enquanto o código da página inicial é carregado.
if (!/\/(admin|checkout)\/?$/.test(window.location.pathname)) void loadCatalog().catch(() => undefined);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <PreferencesProvider>
        <AffiliateProvider><CartProvider>
          <App />
        </CartProvider></AffiliateProvider>
      </PreferencesProvider>
    </ToastProvider>
  </React.StrictMode>
);
