import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { YggiFab } from './YggiFab';
import { YggiDrawer } from './YggiDrawer';
import { useSubscription } from '@/hooks/useSubscription';
import { logYggiChatOpened } from '@/lib/analytics/client';

// Mock subscription hook
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: jest.fn(),
}));

// Mock analytics client
jest.mock('@/lib/analytics/client', () => ({
  logYggiChatOpened: jest.fn(),
  logPaywallViewed: jest.fn(),
}));

describe('YggiFab', () => {
  it('renders correctly and responds to clicks', () => {
    const handleClick = jest.fn();
    render(<YggiFab onClick={handleClick} isOpen={false} />);
    
    const fabButton = screen.getByRole('button', { name: /open yggi/i });
    expect(fabButton).toBeInTheDocument();
    
    fireEvent.click(fabButton);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows close label when open', () => {
    const handleClick = jest.fn();
    render(<YggiFab onClick={handleClick} isOpen={true} />);
    
    const fabButton = screen.getByRole('button', { name: /close yggi/i });
    expect(fabButton).toBeInTheDocument();
  });
});

describe('YggiDrawer', () => {
  const defaultSubscription = {
    tier: 'FREE',
    entitlement: 'FREE',
    status: 'none',
    billingPeriod: null,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSubscription as jest.Mock).mockReturnValue(defaultSubscription);
  });

  it('fires yggi_chat_opened event when drawer is opened', () => {
    render(<YggiDrawer isOpen={true} onClose={jest.fn()} />);
    expect(logYggiChatOpened).toHaveBeenCalledTimes(1);
  });

  it('does not fire yggi_chat_opened when drawer is closed', () => {
    render(<YggiDrawer isOpen={false} onClose={jest.fn()} />);
    expect(logYggiChatOpened).not.toHaveBeenCalled();
  });

  it('triggers onClose when backdrop is clicked', () => {
    const handleClose = jest.fn();
    render(<YggiDrawer isOpen={true} onClose={handleClose} />);
    
    // Backdrop is the first div with onClick inside the render
    // Let's find it using aria-hidden
    const backdrop = screen.getByText((content, element) => {
      return element?.getAttribute('aria-hidden') === 'true' && element?.className.includes('bg-background');
    });
    
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<YggiDrawer isOpen={true} onClose={handleClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close drawer/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows upgrade prompt for Free users', () => {
    (useSubscription as jest.Mock).mockReturnValue({
      ...defaultSubscription,
      entitlement: 'FREE',
    });
    
    render(<YggiDrawer isOpen={true} onClose={jest.fn()} />);
    
    // FeatureGate fallback renders an upgrade card
    expect(screen.getByText(/upgrade required/i)).toBeInTheDocument();
    expect(screen.queryByText(/yggi companion/i)).not.toBeInTheDocument();
  });

  it('shows companion chat shell for Pro users', () => {
    (useSubscription as jest.Mock).mockReturnValue({
      ...defaultSubscription,
      entitlement: 'PRO',
      tier: 'PRO',
    });
    
    render(<YggiDrawer isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.queryByText(/upgrade required/i)).not.toBeInTheDocument();
    expect(screen.getByText(/yggi companion/i)).toBeInTheDocument();
    expect(screen.getByText(/when you're ready, I'll watch for how this evolves/i)).toBeInTheDocument();
  });
});
