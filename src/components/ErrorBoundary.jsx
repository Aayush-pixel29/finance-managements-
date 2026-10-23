import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'var(--coral-bg)',
            color: 'var(--coral-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <AlertTriangle size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>
            Something didn't load right
          </h2>
          <p className="text-muted" style={{ fontSize: '0.88rem', maxWidth: '380px', marginBottom: '24px', lineHeight: 1.5 }}>
            An unexpected error occurred in this view. Your financial records are safe and untouched.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleReset}
              className="btn-yc-primary"
              style={{ width: 'auto', padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-yc-secondary"
              style={{ width: 'auto', padding: '10px 18px', fontSize: '0.88rem' }}
            >
              <Home size={16} /> Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
