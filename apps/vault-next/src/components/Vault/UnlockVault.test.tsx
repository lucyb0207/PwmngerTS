/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { UnlockVault } from './UnlockVault';

describe('UnlockVault', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly', () => {
    render(
      <UnlockVault 
        onUnlock={vi.fn()} 
        onRecover={vi.fn()} 
        error="" 
      />
    );
    expect(screen.getByRole('heading', { name: /unlock vault/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Master Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unlock vault/i })).toBeInTheDocument();
  });

  it('calls onUnlock with password when button is clicked', () => {
    const onUnlock = vi.fn();
    render(
      <UnlockVault 
        onUnlock={onUnlock} 
        onRecover={vi.fn()} 
        error="" 
      />
    );

    const input = screen.getByPlaceholderText('Enter Master Password');
    fireEvent.change(input, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /unlock vault/i }));

    expect(onUnlock).toHaveBeenCalledWith('password123');
  });

  it('calls onUnlock when Enter key is pressed', () => {
    const onUnlock = vi.fn();
    render(
      <UnlockVault 
        onUnlock={onUnlock} 
        onRecover={vi.fn()} 
        error="" 
      />
    );

    const input = screen.getByPlaceholderText('Enter Master Password');
    fireEvent.change(input, { target: { value: 'password123' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(onUnlock).toHaveBeenCalledWith('password123');
  });

  it('displays error message when provided', () => {
    render(
      <UnlockVault 
        onUnlock={vi.fn()} 
        onRecover={vi.fn()} 
        error="Invalid password" 
      />
    );

    expect(screen.getByText('Invalid password')).toBeInTheDocument();
  });

  it('switches to recovery view when "Forgot Password?" is clicked', () => {
    render(
      <UnlockVault 
        onUnlock={vi.fn()} 
        onRecover={vi.fn()} 
        error="" 
      />
    );

    const forgotLinks = screen.getAllByText(/Forgot Password\?/i);
    const forgotLink = forgotLinks[0];
    if (forgotLink) {
      fireEvent.click(forgotLink);
    }
    expect(screen.getByText(/Upload your/i)).toBeInTheDocument();
    expect(screen.getByText(/Back to Password Entry/i)).toBeInTheDocument();
  });

  it('calls onRecover when a valid recovery kit is uploaded', async () => {
    const onRecover = vi.fn();
    render(
      <UnlockVault 
        onUnlock={vi.fn()} 
        onRecover={onRecover} 
        error="" 
      />
    );

    const forgotLinks = screen.getAllByText(/Forgot Password\?/i);
    const forgotLink = forgotLinks[0];
    if (forgotLink) {
      fireEvent.click(forgotLink);
    }

    const kit = { recoveryKey: 'key', encryptedVaultKey: 'vault' };
    const file = new File([JSON.stringify(kit)], 'recovery_kit.json', { type: 'application/json' });
    const inputs = screen.getAllByLabelText(/Upload your/i);
    const input = inputs[inputs.length - 1]; // Use the one from the most recent render
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(onRecover).toHaveBeenCalledWith('key', 'vault');
    });
  });

  it('shows alert on invalid JSON upload', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <UnlockVault 
        onUnlock={vi.fn()} 
        onRecover={vi.fn()} 
        error="" 
      />
    );

    const forgotLinks = screen.getAllByText(/Forgot Password\?/i);
    const lastForgotLink = forgotLinks[forgotLinks.length - 1];
    fireEvent.click(lastForgotLink!);
    
    const file = new File(['invalid json'], 'recovery_kit.json', { type: 'application/json' });
    const inputs = screen.getAllByLabelText(/Upload your/i);
    const input = inputs[inputs.length - 1];
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to parse recovery kit');
    });
    alertMock.mockRestore();
  });
});
