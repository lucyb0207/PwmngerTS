import { describe, it, expect, vi, test, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  const mockOnLogin = vi.fn();
  const mockOnRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders hero section with main title", () => {
    render(<LandingPage onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    const title = screen.getByText(/Secure Zero-Knowledge/i);
    expect(title).toBeInTheDocument();
  });

  test("renders stats section", () => {
    render(<LandingPage onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    expect(screen.getAllByText(/Complete/i)[0]).toBeInTheDocument(); // From comparison table
  });

  test("renders feature and compare sections", () => {
    render(<LandingPage onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    expect(screen.getAllByText(/Zero-Knowledge/i)[0]).toBeInTheDocument();
  });

  test("renders footer with legal links", () => {
    render(<LandingPage onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
  });
});
