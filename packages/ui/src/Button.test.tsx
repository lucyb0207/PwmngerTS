import { render, screen, fireEvent, cleanup } from '@testing-library/react';
/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { Button } from './Button';

afterEach(() => {
  cleanup();
});

describe('Button', () => {
  it('renders correctly with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(onClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
