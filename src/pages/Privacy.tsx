import React from 'react';
import { Shield, Eye, Lock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
            <Shield className="w-4 h-4 mr-2" />
            Privacy Policy
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Your Privacy Matters
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Last updated: January 1, 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <p className="text-gray-700 mb-6">
              At meetmydesigners, we collect information you provide directly to us, such as when you create an account, 
              update your profile, make a purchase, or contact us for support.
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Data We Collect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Personal information (name, email, phone number)</li>
                  <li>• Professional information (skills, experience, portfolio)</li>
                  <li>• Payment information (processed securely through our payment providers)</li>
                  <li>• Usage data (how you interact with our platform)</li>
                  <li>• Communication data (messages, support tickets)</li>
                </ul>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 mb-6">
              We use the information we collect to provide, maintain, and improve our services, 
              process transactions, and communicate with you.
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  How We Use Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Provide and maintain our platform services</li>
                  <li>• Process payments and transactions</li>
                  <li>• Send you important updates and notifications</li>
                  <li>• Improve our platform based on usage patterns</li>
                  <li>• Prevent fraud and ensure platform security</li>
                </ul>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information Sharing</h2>
            <p className="text-gray-700 mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
              except as described in this policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-6">
              We implement appropriate security measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction.
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Security Measures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• SSL encryption for all data transmission</li>
                  <li>• Regular security audits and penetration testing</li>
                  <li>• Secure data centers with 24/7 monitoring</li>
                  <li>• Employee access controls and training</li>
                  <li>• Incident response procedures</li>
                </ul>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-6">
              You have the right to access, update, or delete your personal information. You can also opt out of certain 
              communications and request a copy of your data.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 mb-6">
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide 
              personalized content.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about this Privacy Policy, please contact us at privacy@meetmydesigner.com 
              or through our support channels.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;