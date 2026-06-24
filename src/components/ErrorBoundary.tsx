'use client';

import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            background: 'linear-gradient(135deg, #0a0015 0%, #1a0030 100%)',
            color: '#e0d0f0',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔮</div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#c0a0e0' }}>
            Что-то пошло не так
          </h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1.5rem', maxWidth: '300px' }}>
            Карты запутались в потоке энергии. Попробуй перезагрузить приложение.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Перезагрузить ✨
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
