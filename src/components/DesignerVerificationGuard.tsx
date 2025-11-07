import React from 'react';
import { useDesignerVerification } from '@/hooks/useDesignerVerification';
import { DesignerPendingVerification } from './DesignerPendingVerification';
import { useAuth } from '@/hooks/useAuth';

interface DesignerVerificationGuardProps {
  children: React.ReactNode;
}

export const DesignerVerificationGuard: React.FC<DesignerVerificationGuardProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const { isVerified, isPending, isRejected, verificationStatus, loading } = useDesignerVerification();

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

  // Allow draft designers to access their profile to make changes
  // They can access profile page but not other dashboard features
  if (verificationStatus === 'draft') {
    // Check if they're trying to access profile page
    const currentPath = window.location.pathname;
    if (currentPath.includes('/designer-dashboard/profile') || currentPath.includes('/profile')) {
      return <>{children}</>; // Allow access to profile page
    }
    // For other pages, show a message directing them to complete their profile
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 mb-6">
              Please complete your profile and submit it for admin approval to access all features.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/designer-dashboard/profile'}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Profile
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

  // Show pending verification screen
  if (isPending) {
    return <DesignerPendingVerification />;
  }

  // If verified, show the protected content
  if (isVerified) {
    return <>{children}</>;
  }

  // Default fallback
  return <DesignerPendingVerification />;
};
