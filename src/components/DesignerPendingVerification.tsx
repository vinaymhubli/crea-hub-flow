import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Mail, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function DesignerPendingVerification() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              Profile Under Review
            </CardTitle>
            <p className="text-gray-600">
              Your designer profile is currently being reviewed by our admin team.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                Pending Admin Approval
              </Badge>
            </div>

            {/* Profile Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Your Profile Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-700">{user?.email}</span>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-700">
                    {profile?.first_name} {profile?.last_name}
                  </span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-700">Designer Account</span>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                What Happens Next?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Our admin team will review your profile and portfolio
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  You'll receive an email notification once approved
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  After approval, you'll have full access to your designer dashboard
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  You can start accepting design projects and earning money
                </li>
              </ul>
            </div>

            {/* Timeline */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Review Timeline
              </h3>
              <p className="text-sm text-green-800">
                Our admin team typically reviews new designer profiles within <strong>24-48 hours</strong>. 
                During peak times, it may take up to 72 hours. We'll notify you as soon as your profile is approved.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                className="flex-1"
              >
                Sign Out
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Check Status
              </Button>
            </div>

            {/* Support */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need help? Contact our support team at{' '}
                <a href="mailto:support@meetmydesigners.com" className="text-blue-600 hover:underline">
                  support@meetmydesigners.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
