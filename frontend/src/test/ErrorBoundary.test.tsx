import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const ErrorComponent = () => {
  throw new Error('Test error');
  return <div>This should not render</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.console = {
      ...console,
      error: vi.fn(),
    };
  });

  it('should catch JavaScript errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should show error details in development', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });

  it('should provide retry functionality', async () => {
    const retrySpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      reload: vi.fn(),
    } as any);

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    expect(reloadButton).toBeInTheDocument();

    reloadButton.click();
    expect(retrySpy.mock.results[0].value.reload).toHaveBeenCalled();
  });

  it('should show GitHub issue template when clicked', async () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    const openGitHubButton = screen.getByText('Open GitHub Issue');
    expect(openGitHubButton).toBeInTheDocument();
  });
});