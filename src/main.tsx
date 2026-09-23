import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { CartProvider } from './context/CartContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { ToastProvider } from './context/ToastContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <PreferencesProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </PreferencesProvider>
    </ToastProvider>
  </React.StrictMode>
);
