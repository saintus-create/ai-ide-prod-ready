import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from '../components/SettingsModal';

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render modal when open', () => {
    render(
      <SettingsModal isOpen={true} onClose={() => {}} />
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Git')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Keyboard')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <SettingsModal isOpen={false} onClose={() => {}} />
    );

    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('should switch between tabs', () => {
    render(
      <SettingsModal isOpen={true} onClose={() => {}} />
    );

    // AI tab should be active initially
    expect(screen.getByText('AI Configuration')).toBeInTheDocument();

    // Click Git tab
    const gitTab = screen.getByText('Git');
    fireEvent.click(gitTab);

    expect(screen.getByText('Git Configuration')).toBeInTheDocument();
    expect(screen.queryByText('AI Configuration')).not.toBeInTheDocument();
  });

  it('should save settings to localStorage', async () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    render(
      <SettingsModal isOpen={true} onClose={() => {}} />
    );

    // Navigate to General tab
    const generalTab = screen.getByText('General');
    fireEvent.click(generalTab);

    // Toggle auto-save
    const autoSaveCheckbox = screen.getByLabelText('Enable Auto Save');
    fireEvent.click(autoSaveCheckbox);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        'ai-ide-settings',
        expect.stringContaining('"autoSave":true')
      );
    });
  });

  it('should load settings from localStorage', () => {
    localStorage.setItem(
      'ai-ide-settings',
      JSON.stringify({
        general: { autoSave: false, theme: 'dark' },
        ai: { provider: 'codestral', autoComplete: true },
        git: { user: { name: 'Test User', email: 'test@example.com' } },
        editor: { fontSize: 16, tabSize: 2 },
        keyboard: { shortcuts: {} },
        theme: { mode: 'light', colors: {} }
      })
    );

    render(
      <SettingsModal isOpen={true} onClose={() => {}} />
    );

    // General tab should show the loaded settings
    const generalTab = screen.getByText('General');
    fireEvent.click(generalTab);

    const autoSaveCheckbox = screen.getByLabelText('Enable Auto Save');
    expect(autoSaveCheckbox).not.toBeChecked();
  });

  it('should close modal when clicking close button', () => {
    const onCloseSpy = vi.fn();

    render(
      <SettingsModal isOpen={true} onClose={onCloseSpy} />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });
});