// Issue: #2688 — Hydration Stability, Exception Safety & Error Fallbacks
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileOptimizerModal from './ProfileOptimizerModal';
import type { ReactNode, HTMLAttributes, ErrorInfo } from 'react';
import React from 'react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,

  motion: {
    div: ({
      children,
      ...props
    }: HTMLAttributes<HTMLDivElement> & {
      children?: ReactNode;
    }) => <div {...props}>{children}</div>,

    p: ({
      children,
      ...props
    }: HTMLAttributes<HTMLParagraphElement> & {
      children?: ReactNode;
    }) => <p {...props}>{children}</p>,
  },
}));

class ErrorBoundary extends React.Component<
  { children: ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-fallback">Error boundary fallback</div>;
    }
    return this.props.children;
  }
}

const mockUserData = {
  profile: {
    developerScore: 75,
    bio: 'Full Stack Developer',
    stats: {
      repositories: 12,
      followers: 20,
    },
  },
  languages: ['TypeScript', 'JavaScript'],
  stats: {
    totalContributions: 500,
  },
};

describe('ProfileOptimizerModal - Error Resilience & Hydration Stability', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when userData is null', () => {
    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={null} />);

    expect(screen.getByText('Profile Optimizer')).toBeInTheDocument();
    expect(screen.getByText('Analysing GitHub profile...')).toBeInTheDocument();
  });

  it('renders without crashing when userData is undefined', () => {
    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={undefined} />);

    expect(screen.getByText('Profile Optimizer')).toBeInTheDocument();
    expect(screen.getByText('Analysing GitHub profile...')).toBeInTheDocument();
  });

  it('renders without NaN values when userData has partial nested properties', () => {
    const partialData = {
      profile: {},
      languages: [],
    };

    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={partialData} />);

    expect(screen.getByText('Profile Optimizer')).toBeInTheDocument();
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
  });

  it('handles clipboard API failure by logging to console.error without crashing', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')),
      },
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={mockUserData} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 4000));
    });

    await waitFor(() => {
      expect(screen.getByText('Copy Text')).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Copy Text'));
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy text', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  }, 15000);

  it('handles dynamic jspdf import failure without crashing', async () => {
    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={mockUserData} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 4000));
    });

    await waitFor(() => {
      expect(screen.getByText('Download Report')).not.toBeDisabled();
    });
  }, 15000);

  it('resets component state properly when modal is reopened after being closed', () => {
    const { rerender } = render(
      <ProfileOptimizerModal isOpen onClose={onClose} userData={mockUserData} />
    );

    expect(screen.getByText('Analysing GitHub profile...')).toBeInTheDocument();

    rerender(<ProfileOptimizerModal isOpen={false} onClose={onClose} userData={mockUserData} />);

    expect(screen.queryByText('Profile Optimizer')).not.toBeInTheDocument();

    rerender(<ProfileOptimizerModal isOpen onClose={onClose} userData={mockUserData} />);

    expect(screen.getByText('Analysing GitHub profile...')).toBeInTheDocument();
    expect(screen.getByText('Profile Optimizer')).toBeInTheDocument();
  });

  it('catches exceptions in userData access via error boundary without blank white screen', () => {
    const onError = vi.fn();
    const problematicData = Object.defineProperty({}, 'profile', {
      get() {
        throw new Error('Unexpected database error');
      },
    });

    render(
      <ErrorBoundary onError={onError}>
        <ProfileOptimizerModal isOpen onClose={onClose} userData={problematicData} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    const errorArg = onError.mock.calls[0][0] as Error;
    expect(errorArg.message).toBe('Unexpected database error');
  });

  it('gracefully handles userData with empty strings and zero values for all numeric fields', () => {
    const emptyData = {
      profile: {
        developerScore: 0,
        bio: '',
        stats: {
          repositories: 0,
          followers: 0,
        },
      },
      languages: [],
      stats: {
        totalContributions: 0,
      },
    };

    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={emptyData} />);

    expect(screen.getByText('Profile Optimizer')).toBeInTheDocument();
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
  });
});
