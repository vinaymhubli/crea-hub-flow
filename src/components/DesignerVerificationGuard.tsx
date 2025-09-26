import React from 'react';
import { useDesignerVerification } from '@/hooks/useDesignerVerification';
import { DesignerPendingVerification } from './DesignerPendingVerification';
import { useAuth } from '@/hooks/useAuth';

interface DesignerVerificationGuardProps {
  children: React.ReactNode;
}

export const DesignerVerificationGuard: React.FC<DesignerVerificationGuardProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const { isVerified, isPending, isRejected, loading } = useDesignerVerification();

  // Only apply verification guard to designers
  if (!user || profile?.user_type !== 'designer') {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show pending verification screen
  if (isPending) {
    return <DesignerPendingVerification />;
  }

  // Show rejected screen (optional - you can customize this)
  if (isRejected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Rejected</h1>
            <p className="text-gray-600 mb-6">
              Unfortunately, your designer profile has been rejected. Please contact our support team for more information.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/contact'}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
              <button 
                onClick={() => window.location.href = '/auth'}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If verified, show the protected content
  if (isVerified) {
    return <>{children}</>;
  }

  // Default fallback
  return <DesignerPendingVerification />;
};
