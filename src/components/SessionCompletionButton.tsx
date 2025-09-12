import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  CreditCard,
  User
} from 'lucide-react';
import { useSessionPayment } from '@/hooks/useSessionPayment';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';

interface SessionCompletionButtonProps {
  sessionId: string;
  amount: number;
  designerId: string;
  designerName?: string;
  sessionType?: string;
  duration?: number;
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: string) => void;
  className?: string;
}

export function SessionCompletionButton({
  sessionId,
  amount,
  designerId,
  designerName,
  sessionType = 'Design Session',
  duration,
  onPaymentSuccess,
  onPaymentError,
  className = ''
}: SessionCompletionButtonProps) {
  const { completeSession, loading } = useSessionPayment();
  const { balance, hasSufficientBalance } = useWallet();

  const handleCompleteSession = async () => {
    if (!hasSufficientBalance(amount)) {
      toast.error(`Insufficient balance. You need ₹${(amount - balance).toFixed(2)} more.`);
      onPaymentError?.('Insufficient balance');
      return;
    }

    const result = await completeSession({
      sessionId,
      amount,
      designerId,
      sessionType,
      duration
    });

    if (result.success) {
      onPaymentSuccess?.(result);
    } else {
      onPaymentError?.(result.error || 'Payment failed');
    }
  };

  const canComplete = hasSufficientBalance(amount) && !loading;

  return (
    <Card className={`border-2 ${canComplete ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Complete Session
          </span>
          <Badge className={canComplete ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
            {canComplete ? 'Ready' : 'Insufficient Balance'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Complete the session to process payment and add earnings to designer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Details */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Session Type:</span>
            <span className="font-medium">{sessionType}</span>
          </div>
          {duration && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Duration:</span>
              <span className="font-medium">{duration} minutes</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Designer:</span>
            <span className="font-medium">{designerName || 'Designer'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="font-bold text-lg">₹{amount}</span>
          </div>
        </div>

        {/* Balance Check */}
        <div className={`p-3 rounded-lg border ${
          canComplete 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center space-x-2">
            {canComplete ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-orange-600" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                canComplete ? 'text-green-800' : 'text-orange-800'
              }`}>
                {canComplete ? 'Sufficient Balance' : 'Insufficient Balance'}
              </p>
              <p className={`text-xs ${
                canComplete ? 'text-green-700' : 'text-orange-700'
              }`}>
                Wallet Balance: ₹{balance.toFixed(2)}
                {!canComplete && (
                  <span className="block">
                    You need ₹{(amount - balance).toFixed(2)} more
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <CreditCard className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Payment Processing</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• ₹{amount} will be deducted from your wallet</li>
                <li>• Same amount will be added to designer's earnings</li>
                <li>• Payment is processed automatically</li>
                <li>• You'll receive confirmation notification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <Button
          onClick={handleCompleteSession}
          disabled={!canComplete}
          className={`w-full ${
            canComplete 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Session & Pay ₹{amount}
            </>
          )}
        </Button>

        {!canComplete && (
          <p className="text-xs text-orange-600 text-center">
            Add credits to your wallet to complete this session
          </p>
        )}
      </CardContent>
    </Card>
  );
}
