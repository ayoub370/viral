import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';

const storedTheme = localStorage.getItem('viral_theme');
if (storedTheme === 'light') {
  document.documentElement.classList.add('light-theme');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserPreferencesProvider>
      <App />
    </UserPreferencesProvider>
  </StrictMode>
);
