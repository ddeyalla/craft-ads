'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { AuthModal } from './AuthModal';

interface AuthRequiredWrapperProps {
  children: ReactNode;
}

export function AuthRequiredWrapper({ children }: AuthRequiredWrapperProps) {
  const { user, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Show the auth modal if the user is not authenticated and not loading
    if (!isLoading && !user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, isLoading]);

  // While checking auth state, show a simple loading indicator
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          // Auth is required, so we don't allow closing the modal
          // without authentication. This is a no-op.
        }} 
      />
    </>
  );
}
