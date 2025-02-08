import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import App from './App';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

async function enableMocking() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[MSW] Setting up mock service worker...');
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
  return Promise.resolve();
}

enableMocking().then(() => {
  console.log('[MSW] Mock service worker initialized');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="ten-theme">
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}).catch(error => {
  console.error('[MSW] Failed to initialize mock service worker:', error);
  // Still render the app even if MSW fails
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="ten-theme">
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
});
