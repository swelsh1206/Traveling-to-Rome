import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-gray-200 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-stone-800/80 p-8 border-2 border-red-500 shadow-lg rounded-xl">
            <h1 className="text-3xl text-red-400 mb-4 font-bold">Something went wrong</h1>
            <p className="text-gray-300 mb-4">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-amber-400 cursor-pointer hover:text-amber-300">
                  Error details
                </summary>
                <pre className="mt-2 p-4 bg-stone-900/50 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
