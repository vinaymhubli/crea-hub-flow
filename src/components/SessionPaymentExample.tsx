import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UniversalPaymentButton } from './UniversalPaymentButton';
import { useWallet } from '@/hooks/useWallet';
import { Clock, User, Star, CheckCircle } from 'lucide-react';

interface SessionPaymentExampleProps {
  sessionId: string;
  designerId: string;
  designerName: string;
  sessionType: string;
  duration: number;
  price: number;
  onPaymentSuccess?: () => void;
}

export function SessionPaymentExample({
  sessionId,
  designerId,
  designerName,
  sessionType,
  duration,
  price,
  onPaymentSuccess
}: SessionPaymentExampleProps) {
  const { balance, hasSufficientBalance } = useWallet();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Design Session</span>
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </Badge>
        </CardTitle>
        <CardDescription>
          Book a design session with {designerName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Designer:</span>
            <span className="font-medium">{designerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type:</span>
            <span className="font-medium">{sessionType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <span className="font-medium flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {duration} minutes
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price:</span>
            <span className="font-bold text-lg">₹{price}</span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="border-t pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Your Wallet Balance:</span>
              <span className="font-semibold">₹{balance.toFixed(2)}</span>
            </div>
            
            {hasSufficientBalance(price) ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✅ You have sufficient balance to book this session
                </p>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  ⚠️ You need ${(price - balance).toFixed(2)} more to book this session
                </p>
              </div>
            )}

            <UniversalPaymentButton
              amount={price}
              designerId={designerId}
              sessionId={sessionId}
              description={`Design session with ${designerName}`}
              onSuccess={() => {
                console.log('Payment successful!');
                onPaymentSuccess?.();
              }}
              onError={(error) => {
                console.error('Payment failed:', error);
              }}
              showBalance={false}
              className="w-full"
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Payment is processed securely through your wallet</p>
          <p>• Session will be confirmed after successful payment</p>
          <p>• You can cancel up to 2 hours before the session</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage component
export function ExampleUsage() {
  const handlePaymentSuccess = () => {
    console.log('Session booked successfully!');
    // Redirect to session page or show success message
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Book a Design Session</h2>
      <SessionPaymentExample
        sessionId="session_123"
        designerId="designer_456"
        designerName="John Doe"
        sessionType="Logo Design"
        duration={60}
        price={1500}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
