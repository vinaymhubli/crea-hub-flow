import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Wallet, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { UniversalPaymentModal } from './UniversalPaymentModal';
import { toast } from 'sonner';

interface UniversalPaymentButtonProps {
  amount: number;
  designerId?: string;
  sessionId?: string;
  description?: string;
  onSuccess?: (amount: number, method: string) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  showBalance?: boolean;
  children?: React.ReactNode;
}

export function UniversalPaymentButton({
  amount,
  designerId,
  sessionId,
  description,
  onSuccess,
  onError,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  showBalance = true,
  children
}: UniversalPaymentButtonProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { balance, hasSufficientBalance, payDesigner } = useWallet();

  const handlePayment = async (paymentAmount: number, paymentMethod: string) => {
    setProcessing(true);
    
    try {
      if (designerId) {
        // Pay designer from wallet
        const result = await payDesigner(designerId, paymentAmount, sessionId);
        
        if (result.success) {
          toast.success(`Payment of ₹${paymentAmount} processed successfully!`);
          onSuccess?.(paymentAmount, paymentMethod);
        } else {
          toast.error(result.error || 'Payment failed');
          onError?.(result.error || 'Payment failed');
        }
      } else {
        // Just add credits to wallet
        toast.success(`₹${paymentAmount} added to your wallet!`);
        onSuccess?.(paymentAmount, paymentMethod);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = 'Failed to process payment. Please try again.';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
      setShowPaymentModal(false);
    }
  };

  const handleClick = () => {
    if (designerId && hasSufficientBalance(amount)) {
      // Direct payment from wallet
      handlePayment(amount, 'wallet');
    } else {
      // Show payment modal for adding credits or insufficient balance
      setShowPaymentModal(true);
    }
  };

  const getButtonText = () => {
    if (processing) return 'Processing...';
    if (children) return children;
    
    if (designerId) {
      if (hasSufficientBalance(amount)) {
        return `Pay ₹${amount} from Wallet`;
      } else {
        return `Add Credits & Pay ₹${amount}`;
      }
    } else {
      return `Add ₹${amount} Credits`;
    }
  };

  const getButtonIcon = () => {
    if (processing) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (designerId && hasSufficientBalance(amount)) return <Wallet className="w-4 h-4" />;
    return <CreditCard className="w-4 h-4" />;
  };

  const getButtonVariant = () => {
    if (designerId && !hasSufficientBalance(amount)) {
      return 'outline';
    }
    return variant;
  };

  const getButtonClassName = () => {
    const baseClasses = className;
    
    if (designerId && hasSufficientBalance(amount)) {
      return `${baseClasses} bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white hover:shadow-lg transition-all duration-300`;
    }
    
    if (designerId && !hasSufficientBalance(amount)) {
      return `${baseClasses} border-orange-300 text-orange-700 hover:bg-orange-50`;
    }
    
    return baseClasses;
  };

  return (
    <>
      <div className="space-y-2">
        {showBalance && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Wallet Balance:</span>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">₹{balance.toFixed(2)}</span>
              {designerId && (
                <Badge 
                  variant={hasSufficientBalance(amount) ? "default" : "destructive"}
                  className={hasSufficientBalance(amount) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                >
                  {hasSufficientBalance(amount) ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Sufficient
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Insufficient
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <Button
          onClick={handleClick}
          disabled={disabled || processing}
          variant={getButtonVariant()}
          size={size}
          className={getButtonClassName()}
        >
          {getButtonIcon()}
          <span className="ml-2">{getButtonText()}</span>
          {!processing && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
        
        {designerId && !hasSufficientBalance(amount) && (
          <p className="text-xs text-orange-600">
            You need ₹{(amount - balance).toFixed(2)} more. Click to add credits first.
          </p>
        )}
      </div>

      <UniversalPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={handlePayment}
      />
    </>
  );
}
