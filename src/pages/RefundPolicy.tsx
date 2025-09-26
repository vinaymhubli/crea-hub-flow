import React from 'react';
import { FileText, Scale, AlertTriangle, CheckCircle, Clock, CreditCard, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            <Scale className="w-4 h-4 mr-2" />
            Refund & Cancellation Policy
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Refund & Cancellation Policy
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
            <h2>Overview</h2>
            <p>
              At meetmydesigners, we strive to provide excellent service and ensure customer satisfaction. 
              This policy outlines our refund and cancellation procedures for all services and transactions.
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  General Refund Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Refunds are processed within 5-10 business days</li>
                  <li>• Refunds will be issued to the original payment method</li>
                  <li>• Processing fees may apply to certain refunds</li>
                  <li>• Partial refunds may be issued based on work completed</li>
                  <li>• All refund requests must be submitted through our support system</li>
                </ul>
              </CardContent>
            </Card>

            <h2>Session Cancellation Policy</h2>
            <p>
              You may cancel or reschedule your design session under the following conditions:
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Cancellation Timeframes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-700">24+ Hours Before Session</h4>
                    <p className="text-sm text-gray-600">Full refund or free rescheduling</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-yellow-700">2-24 Hours Before Session</h4>
                    <p className="text-sm text-gray-600">50% refund or rescheduling with fee</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-red-700">Less than 2 Hours Before Session</h4>
                    <p className="text-sm text-gray-600">No refund, rescheduling with full fee</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2>Design Project Refunds</h2>
            <p>
              For ongoing design projects, refunds are calculated based on work completed and project milestones.
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Project Refund Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• <strong>0-25% Complete:</strong> 90% refund (10% processing fee)</li>
                  <li>• <strong>26-50% Complete:</strong> 60% refund</li>
                  <li>• <strong>51-75% Complete:</strong> 30% refund</li>
                  <li>• <strong>76-100% Complete:</strong> No refund (work delivered)</li>
                  <li>• <strong>Quality Issues:</strong> Full refund if work doesn't meet agreed standards</li>
                </ul>
              </CardContent>
            </Card>

            <h2>Subscription and Membership Refunds</h2>
            <p>
              Monthly and annual subscriptions can be cancelled at any time with the following terms:
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Subscription Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Monthly subscriptions: Cancellation effective next billing cycle</li>
                  <li>• Annual subscriptions: Prorated refund for unused months</li>
                  <li>• Premium features: Access continues until end of billing period</li>
                  <li>• No refunds for partially used months</li>
                </ul>
              </CardContent>
            </Card>

            <h2>Refund Request Process</h2>
            <p>
              To request a refund, please follow these steps:
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  How to Request a Refund
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>Contact our support team at support@meetmydesigner.com</li>
                  <li>Provide your order number and reason for refund</li>
                  <li>Include any relevant documentation or screenshots</li>
                  <li>Our team will review your request within 2 business days</li>
                  <li>You'll receive confirmation and timeline for processing</li>
                </ol>
              </CardContent>
            </Card>

            <h2>Non-Refundable Items</h2>
            <p>
              The following items are generally not eligible for refunds:
            </p>

            <Card className="my-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Exclusions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Completed and delivered design work</li>
                  <li>• Digital products and templates</li>
                  <li>• Services used beyond agreed scope</li>
                  <li>• Refunds requested after 30 days of service completion</li>
                  <li>• Third-party fees and processing charges</li>
                </ul>
              </CardContent>
            </Card>

            <h2>Dispute Resolution</h2>
            <p>
              If you're not satisfied with our refund decision, you can escalate your case through our 
              dispute resolution process. We're committed to fair and transparent resolution of all issues.
            </p>

            <h2>Contact Information</h2>
            <p>
              For questions about refunds or cancellations, please contact us at:
            </p>
            <ul>
              <li>Email: support@meetmydesigner.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Live Chat: Available on our website</li>
            </ul>

            <h2>Policy Updates</h2>
            <p>
              We reserve the right to update this refund and cancellation policy at any time. 
              Changes will be posted on this page with an updated revision date. Continued use 
              of our services after changes constitutes acceptance of the updated policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RefundPolicy;
