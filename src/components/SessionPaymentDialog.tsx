import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, CreditCard, Banknote, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SessionPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  totalAmount: number;
  sessionId: string;
  designerName: string;
  designerId?: string;
}

export default function SessionPaymentDialog({
  isOpen,
  onClose,
  onPaymentSuccess,
  totalAmount,
  sessionId,
  designerName,
  designerId
}: SessionPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user?.id) {
      loadWalletBalance();
    }
  }, [isOpen, user]);

  const loadWalletBalance = async () => {
    try {
      console.log('Loading wallet balance for user:', user?.id);
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_wallet_balance', { user_uuid: user?.id });

      if (balanceError) {
        console.error('Balance fetch error:', balanceError);
        setWalletBalance(0);
      } else {
        const balance = balanceData || 0;
        console.log('Wallet balance loaded:', balance);
        setWalletBalance(balance);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setWalletBalance(0);
    }
  };

  const handlePayment = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to make a payment.",
        variant: "destructive",
      });
      return;
    }

    if (walletBalance < totalAmount) {
      // Open wallet top-up page in the same tab (navigate)
      window.location.href = '/customer-wallet';
      return;
    }

    setIsProcessing(true);

    try {
      const sessionIdWithPrefix = sessionId.includes("live_") ? sessionId : `live_${sessionId}`;
      console.log('Processing payment for session:', sessionIdWithPrefix);
      
      // Use designerId from props, or fallback to querying database
      let designerUserId = designerId;
      console.log('💰 Designer ID from props:', designerId);
      
      if (!designerUserId) {
        console.log('No designerId prop provided, querying database...');
        const { data: sessionData, error: sessionError } = await supabase
          .from('active_sessions')
          .select('designer_id')
          .eq('session_id', sessionIdWithPrefix)
          .single();

        if (sessionError || !sessionData?.designer_id) {
          throw new Error('Could not find designer for this session');
        }
        
        designerUserId = sessionData.designer_id;
      }
      
      // Look up the actual user_id from the designers table
      console.log('🔍 Looking up designer user_id for designer record ID:', designerUserId);
      const { data: designerData, error: designerError } = await supabase
        .from('designers')
        .select('user_id')
        .eq('id', designerUserId)
        .single();

      if (designerError || !designerData?.user_id) {
        console.error('Could not find designer user_id:', { designerError, designerData });
        designerUserId = null;
      } else {
        designerUserId = designerData.user_id;
        console.log('Designer ID to use:', designerUserId);
      }

      if (paymentMethod === 'wallet') {
        console.log('🔄 Processing wallet payment with proper commission and TDS...');
        
        // Calculate base amount (remove GST to get original amount)
        const gstRate = 0.18;
        const baseAmount = totalAmount / (1 + gstRate);
        
        console.log(`💰 Processing session payment: Total ₹${totalAmount}, Base ₹${baseAmount.toFixed(2)}`);
        
        // Call our fixed payment processing function
        const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('process-session-payment', {
          body: {
            sessionId: sessionIdWithPrefix,
            customerId: user?.id,
            designerId: designerUserId,
            amount: baseAmount,
            sessionType: 'live_session',
            duration: 180, // Default 3 minutes for booking sessions
            bookingId: null
          }
        });

        if (paymentError) {
          console.error('❌ Payment processing error:', paymentError);
          throw new Error('Payment processing failed: ' + paymentError.message);
        } else {
          console.log('✅ Payment processed successfully with proper deductions:', paymentResult);
        }

        toast({
          title: "Payment Successful",
          description: `₹${totalAmount.toFixed(2)} processed with proper commission and TDS deductions.`,
        });
        
      } else {
        // Handle other payment methods normally
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "Payment Successful", 
          description: `Payment of ₹${totalAmount.toFixed(2)} completed via ${paymentMethod}.`,
        });
      }

      // Reload balance after payment
      await loadWalletBalance();
      
      // Call success callback
      onPaymentSuccess();
      onClose();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'wallet',
      name: 'Wallet',
      description: `Balance: ₹${walletBalance.toFixed(2)}`,
      icon: Wallet,
      available: true
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Complete Session Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Designer:</span>
                  <span className="font-medium">{designerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Session ID:</span>
                  <span className="font-mono text-sm">{sessionId}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div key={method.id} className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      !method.available ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    } ${paymentMethod === method.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <RadioGroupItem value={method.id} id={method.id} disabled={!method.available} />
                      <Icon className="w-5 h-5" />
                      <div className="flex-1">
                        <Label htmlFor={method.id} className="font-medium cursor-pointer">
                          {method.name}
                        </Label>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Payment Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || (paymentMethod === 'wallet' && walletBalance < totalAmount)}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}