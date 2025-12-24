import React from 'react';
import ReactDOM from 'react-dom/client';

// GLOBAL ERROR HANDLER (Emergency Trap)
// GLOBAL ERROR HANDLER (Emergency Trap)
window.addEventListener('error', (event) => {
  const isResourceError = event.target instanceof HTMLElement && (event.target as HTMLElement).tagName;
  document.body.innerHTML = `
    <div style="padding:20px; color:red; font-family:sans-serif; background:#fff; position:absolute; top:0; left:0; width:100%; height:100%; z-index:9999;">
      <h1>Error Crítico ${isResourceError ? '(Recurso no cargado)' : '(Script)'}</h1>
      <p>${isResourceError ? 'No se pudo cargar un archivo vital (posiblemente JS o CSS).' : event.message}</p>
      <pre>${event.filename || 'N/A'}: ${event.lineno || 0}</pre>
    </div>
  `;
}, true); // TRUE prevents ignoring resource errors (404s)
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any, errorInfo: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fff', color: 'red', height: '100vh', overflow: 'auto' }}>
          <h1>Algo salió mal 😭</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Ver error</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);