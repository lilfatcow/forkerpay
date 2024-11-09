import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';
import { MoniteProvider } from '@/contexts/MoniteContext';
import { Toaster } from '@/components/ui/toaster';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="wonderpay-theme">
      <MoniteProvider>
        <App />
        <Toaster />
      </MoniteProvider>
    </ThemeProvider>
  </StrictMode>
);