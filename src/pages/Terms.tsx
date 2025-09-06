import React from 'react';
import { FileText, Scale, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            <Scale className="w-4 h-4 mr-2" />
            Terms of Service
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Last updated: January 1, 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using Meet My Designer, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Platform Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• You must be at least 18 years old to use our services</li>
                  <li>• You agree to provide accurate and complete information</li>
                  <li>• You are responsible for maintaining account security</li>
                  <li>• You agree to comply with all applicable laws and regulations</li>
                  <li>• You will not use the platform for illegal or unauthorized purposes</li>
                </ul>
              </CardContent>
            </Card>

            <h2>User Responsibilities</h2>
            <p>
              Users are responsible for their conduct on the platform and must comply with our community guidelines 
              and professional standards.
            </p>

            <h2>Payment Terms</h2>
            <p>
              All payments are processed securely through our payment providers. Fees are clearly disclosed before 
              any transaction is completed.
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Payment Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Platform fees are clearly disclosed upfront</li>
                  <li>• Payments are held in escrow until project completion</li>
                  <li>• Refunds are processed according to our refund policy</li>
                  <li>• Disputes are handled through our resolution process</li>
                  <li>• All prices are in USD unless otherwise specified</li>
                </ul>
              </CardContent>
            </Card>

            <h2>Intellectual Property</h2>
            <p>
              Users retain ownership of their original content while granting us necessary licenses to operate the platform.
            </p>

            <h2>Service Availability</h2>
            <p>
              We strive to maintain high availability but cannot guarantee uninterrupted service. We reserve the right 
              to modify or discontinue services with appropriate notice.
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Important Disclaimers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Services are provided "as is" without warranties</li>
                  <li>• We are not liable for user-generated content</li>
                  <li>• Users are responsible for their own tax obligations</li>
                  <li>• Platform availability may vary by geographic location</li>
                  <li>• We reserve the right to suspend accounts for violations</li>
                </ul>
              </CardContent>
            </Card>

            <h2>Dispute Resolution</h2>
            <p>
              Disputes between users are handled through our mediation process. Platform-related disputes are subject 
              to binding arbitration.
            </p>

            <h2>Termination</h2>
            <p>
              Either party may terminate the agreement at any time. Upon termination, certain provisions will survive 
              including intellectual property rights and dispute resolution clauses.
            </p>

            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Users will be notified of significant changes 
              and continued use constitutes acceptance of the modified terms.
            </p>

            <h2>Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at legal@meetmydesigner.com or through 
              our support channels.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;