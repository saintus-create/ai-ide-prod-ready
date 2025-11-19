import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to reporting service if available
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Try to send to reporting endpoint
      const reportData = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      // Try to POST to error reporting endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'error',
          message: 'React Error Boundary',
          meta: reportData,
        }),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return (
          <this.props.fallback
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const { error: showToast } = useToast();

  const handleReport = async () => {
    const errorReport = {
      error: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      context: 'AI-IDE Error Boundary',
    };

    try {
      // Create a GitHub issue link
      const title = encodeURIComponent(`[Bug] Error in AI-IDE: ${error.message}`);
      const body = encodeURIComponent(`
## Error Report

**Error:** ${error.message}
**Stack Trace:**
\`\`\`
${error.stack || 'No stack trace available'}
\`\`\`

**User Agent:** ${navigator.userAgent}
**URL:** ${window.location.href}
**Timestamp:** ${new Date().toISOString()}

**Context:** This error was caught by the AI-IDE error boundary.
**Component Stack:**
\`\`\`
${error.stack || 'No component stack available'}
\`\`\`

Please provide steps to reproduce this issue.
      `);
      
      const githubUrl = `https://github.com/your-username/ai-ide/issues/new?title=${title}&body=${body}`;
      
      // Copy error details to clipboard
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      showToast('Error details copied to clipboard. Click the button to create a GitHub issue.');
      
      // Open GitHub issue in new tab
      const openIssue = confirm('Open GitHub issue in new tab? (Error details copied to clipboard)');
      if (openIssue) {
        window.open(githubUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to report error:', err);
      showToast('Failed to report error. Please manually copy the error details.');
    }
  };

  return (
    <div className="h-screen w-screen bg-overlay flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-400">
            AI-IDE encountered an unexpected error. This has been logged and we apologize for the inconvenience.
          </p>
        </div>

        <div className="bg-surface/50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Error Details</h2>
          <div className="bg-black/30 rounded p-4 font-mono text-sm text-red-300 overflow-auto">
            <div className="font-semibold mb-2">{error.name}: {error.message}</div>
            {error.stack && (
              <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={resetError}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Try Again
          </button>
          
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-surface hover:bg-surface/80 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh Page
          </button>
          
          <button
            onClick={handleReport}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30 rounded-lg transition-colors"
          >
            <ExclamationTriangleIcon className="w-5 h-5" />
            Report Issue
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            If this problem persists, please check the console for additional details or 
            contact support at{' '}
            <a 
              href="mailto:support@ai-ide.dev" 
              className="text-primary hover:underline"
            >
              support@ai-ide.dev
            </a>
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-gray-600">
          <p>
            AI-IDE v1.0.0 • Error ID: {Date.now().toString(36)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for programmatic error reporting
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Manual error report:', error, errorInfo);
    
    // Report to API if available
    try {
      fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'error',
          message: error.message,
          meta: {
            error: error.stack,
            errorInfo: errorInfo?.componentStack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
          },
        }),
      }).catch(err => console.error('Failed to send error report:', err));
    } catch (err) {
      console.error('Error reporting failed:', err);
    }
  }, []);
}
