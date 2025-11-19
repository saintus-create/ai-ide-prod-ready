import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useTheme } from '../hooks/useTheme';
import { act } from 'react-dom/test-utils';

const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button data-testid="toggle" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

describe('useTheme Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide theme context', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should toggle theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    
    await act(async () => {
      toggleButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('should persist theme in localStorage', async () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    
    await act(async () => {
      toggleButton.click();
    });

    expect(setItemSpy).toHaveBeenCalledWith('theme', 'light');
  });

  it('should load theme from localStorage', () => {
    localStorage.getItem = vi.fn().mockReturnValue('light');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });
});