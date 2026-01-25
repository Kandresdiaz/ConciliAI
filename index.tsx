import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Removed manual shim for process.env.
// According to @google/genai guidelines, process.env.API_KEY should be accessed directly
// and not defined or managed within the application code. This also resolves the 
// TypeScript error: Property 'process' does not exist on type 'Window'.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
