import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'Unexpected application error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let parsedError: { error?: string; operationType?: string; path?: string } | null = null;
      try {
        parsedError = JSON.parse(this.state.errorMessage);
      } catch {
        parsedError = null;
      }

      const isQuotaError =
        this.state.errorMessage.includes('Quota exceeded') ||
        (parsedError?.error && parsedError.error.includes('Quota exceeded'));

      return (
        <div className="min-h-screen bg-[#F7F6F2] text-[#0F1E19] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-stone-300 rounded-xl p-8">
            <div className="flex items-center gap-3 text-red-700 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-2xl font-display font-bold tracking-tight">
                {isQuotaError ? 'Daily Database Quota Reached' : 'League Ledger Sync Interrupted'}
              </h2>
            </div>

            <p className="text-sm text-stone-700 leading-relaxed mb-4">
              {isQuotaError
                ? 'The free daily Firestore quota for this project has been reached and will reset tomorrow.'
                : parsedError?.error || this.state.errorMessage}
            </p>

            {parsedError?.path && (
              <div className="text-xs font-mono tabular-nums text-stone-600 bg-stone-100 p-3 rounded-lg mb-6">
                Operation: {parsedError.operationType} · Path: {parsedError.path}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
