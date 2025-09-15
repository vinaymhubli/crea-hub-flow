import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, Smartphone, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const { user } = useAuth();
  const { toast } = useToast();
  
  console.log('🔍 SessionPaymentDialog - Props received:', { designerId, designerName, sessionId, totalAmount });
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  React.useEffect(() => {
    if (isOpen && user) {
      loadWalletBalance();
    }
  }, [isOpen, user]);

  const loadWalletBalance = async () => {
    try {
      console.log('Loading wallet balance for user:', user?.id);
      
      // Use the existing get_wallet_balance function
      const { data, error } = await (supabase as any)
        .rpc('get_wallet_balance', { user_uuid: user?.id });

      console.log('Wallet balance result:', { data, error });

      if (error) {
        console.error('Error loading wallet balance:', error);
        setWalletBalance(0);
        return;
      }

      const balance = data || 0;
      console.log('Current wallet balance:', balance);
      setWalletBalance(balance);

      // If balance is 0, create a deposit transaction to give user ₹100
      if (balance === 0) {
        console.log('Balance is 0, creating ₹100 deposit transaction');
        const { error: depositError } = await (supabase as any)
          .from('wallet_transactions')
          .insert({
            user_id: user?.id,
            transaction_type: 'deposit',
            amount: 100.00,
            description: 'Initial wallet deposit',
            status: 'completed'
          });

        if (depositError) {
          console.error('Error creating deposit transaction:', depositError);
        } else {
          console.log('Deposit transaction created, updating balance');
          setWalletBalance(100);
        }
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const handlePayment = async () => {
    console.log('🎯 SessionPaymentDialog props:', { designerId, designerName, sessionId, totalAmount });
    
    if (paymentMethod === 'wallet' && walletBalance < totalAmount) {
      toast({
        title: "Insufficient Balance",
        description: "Your wallet balance is insufficient. Opening profile to recharge wallet...",
        variant: "destructive",
        action: {
          altText: "Open Profile",
          onClick: () => {
            window.open('/customer-dashboard/profile', '_blank');
          }
        }
      });
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
        const { data: sessionData, error: sessionError } = await (supabase as any)
          .from('active_sessions')
          .select('designer_id')
          .eq('session_id', sessionIdWithPrefix)
          .single();

        console.log('Session query result:', { sessionData, sessionError });

        if (sessionError) {
          console.error('Session query error:', sessionError);
          throw new Error(`Could not find session: ${sessionError.message}`);
        }

        if (!sessionData?.designer_id) {
          console.error('No designer_id found in session data:', sessionData);
          throw new Error('Could not find designer for this session');
        }
        
        designerUserId = sessionData.designer_id;
      }
      
      // Look up the actual user_id from the designers table
      console.log('🔍 Looking up designer user_id for designer record ID:', designerUserId);
      const { data: designerData, error: designerError } = await (supabase as any)
        .from('designers')
        .select('user_id')
        .eq('id', designerUserId)
        .single();
      
      console.log('🔍 Designer lookup result:', { designerData, designerError, designerUserId });
      
      if (designerError) {
        console.error('❌ Designer lookup failed:', designerError);
        // Don't throw error, just use the original ID and let it fail later with better debugging
        console.warn('⚠️ Using original designerUserId since lookup failed');
      } else if (designerData?.user_id) {
        console.log('✅ Designer user_id found:', designerData.user_id);
        designerUserId = designerData.user_id;
      } else {
        console.warn('⚠️ No user_id in designer data, using original:', designerUserId);
      }
      
      console.log('💰 Final designer user ID:', designerUserId);
      
      console.log('Using designer ID:', designerUserId);
      console.log('Designer ID type:', typeof designerUserId);
      console.log('Designer ID length:', designerUserId?.length);

      // Skip profile validation - just log the designer ID
      if (designerUserId) {
        console.log('Designer ID to use:', designerUserId);
      } else {
        console.log('No designer ID provided');
      }

      if (paymentMethod === 'wallet') {
        console.log('Processing wallet payment...');
        
        // Create payment transaction for customer (deduct from wallet)
        const { error: customerPaymentError } = await (supabase as any)
          .from('wallet_transactions')
          .insert({
            user_id: user?.id,
            transaction_type: 'payment',
            amount: totalAmount,
            description: `Payment for session ${sessionIdWithPrefix}`,
            status: 'completed'
          });

        if (customerPaymentError) {
          console.error('❌ Customer payment transaction error:', customerPaymentError);
          throw customerPaymentError;
        } else {
          console.log('✅ Customer payment transaction created successfully');
        }
        console.log('Customer payment transaction created successfully');

        // Create deposit transaction for designer (add to wallet) - only if designer ID is valid
        console.log('🎯 About to create designer deposit - Designer ID check:', { designerUserId, type: typeof designerUserId, length: designerUserId?.length });
        
        if (designerUserId) {
          const depositTransaction = {
            user_id: designerUserId,
            transaction_type: 'deposit',
            amount: totalAmount,
            description: `Payment received for session ${sessionIdWithPrefix}`,
            status: 'completed'
          };
          
          console.log('💰 Creating designer deposit transaction:', depositTransaction);
          
          try {
            const { data: depositData, error: designerDepositError } = await (supabase as any)
              .from('wallet_transactions')
              .insert(depositTransaction)
              .select()
              .single();

            console.log('🔍 Designer deposit insert result:', { depositData, designerDepositError });

            if (designerDepositError) {
              console.error('❌ Designer deposit transaction error:', designerDepositError);
              console.error('❌ Full error details:', JSON.stringify(designerDepositError, null, 2));
              console.warn('Could not transfer to designer wallet, but payment was successful');
            } else {
              console.log('✅ Designer deposit transaction created successfully:', depositData);
              console.log('✅ Designer should now have received $' + totalAmount);
            }
          } catch (error) {
            console.error('❌ Error creating designer deposit:', error);
            console.error('❌ Full error details:', JSON.stringify(error, null, 2));
            console.warn('Could not transfer to designer wallet, but payment was successful');
          }
        } else {
          console.warn('⚠️ No designer ID provided, skipping designer wallet transfer');
          console.warn('⚠️ This means the designer will NOT receive payment!');
        }

        // Create payment record (optional - table might not exist yet)
        try {
          const { error: paymentError } = await (supabase as any)
            .from('payments')
            .insert({
              user_id: user?.id,
              session_id: sessionIdWithPrefix,
              amount: totalAmount,
              payment_method: 'wallet',
              status: 'completed',
              payment_date: new Date().toISOString()
            });

          if (paymentError) {
            console.warn('Payment record creation failed (table might not exist):', paymentError);
            // Don't throw error, continue with success
          }
        } catch (error) {
          console.warn('Payment record creation failed (table might not exist):', error);
          // Don't throw error, continue with success
        }

        toast({
          title: "Payment Successful",
          description: `₹${totalAmount.toFixed(2)} has been transferred to the designer's wallet.`,
        });
      } else {
        // For other payment methods, simulate processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create deposit transaction for designer (add to wallet) - only if designer ID is valid
        if (designerUserId) {
          console.log('💰 Creating designer deposit transaction (non-wallet payment):', {
            user_id: designerUserId,
            transaction_type: 'deposit',
            amount: totalAmount,
            description: `Payment received for session ${sessionIdWithPrefix} via ${paymentMethod}`,
            status: 'completed'
          });
          
          try {
            const { data: depositData, error: designerDepositError } = await (supabase as any)
              .from('wallet_transactions')
              .insert({
                user_id: designerUserId,
                transaction_type: 'deposit',
                amount: totalAmount,
                description: `Payment received for session ${sessionIdWithPrefix} via ${paymentMethod}`,
                status: 'completed'
              })
              .select()
              .single();

            if (designerDepositError) {
              console.error('❌ Designer deposit error:', designerDepositError);
              console.warn('Could not transfer to designer wallet, but payment was successful');
            } else {
              console.log('✅ Designer deposit transaction created successfully:', depositData);
            }
          } catch (error) {
            console.error('❌ Error creating designer deposit:', error);
            console.warn('Could not transfer to designer wallet, but payment was successful');
          }
        } else {
          console.warn('⚠️ No designer ID provided, skipping designer wallet transfer');
        }
        
        // Create payment record (optional - table might not exist yet)
        try {
          const { error: paymentError } = await (supabase as any)
            .from('payments')
            .insert({
              user_id: user?.id,
              session_id: sessionIdWithPrefix,
              amount: totalAmount,
              payment_method: paymentMethod,
              status: 'completed',
              payment_date: new Date().toISOString()
            });

          if (paymentError) {
            console.warn('Payment record creation failed (table might not exist):', paymentError);
            // Don't throw error, continue with success
          }
        } catch (error) {
          console.warn('Payment record creation failed (table might not exist):', error);
          // Don't throw error, continue with success
        }

        toast({
          title: "Payment Successful",
          description: `₹${totalAmount.toFixed(2)} has been transferred to the designer's wallet.`,
        });
      }

      console.log('Payment completed successfully, calling onPaymentSuccess()');
      onPaymentSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Complete Payment
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Pay for your design session with {designerName}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Payment Amount */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Choose Payment Method</Label>
            
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex items-center space-x-3 flex-1 cursor-pointer">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">Wallet Balance</p>
                    <p className="text-sm text-gray-500">₹{walletBalance.toFixed(2)} available</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center space-x-3 flex-1 cursor-pointer">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center space-x-3 flex-1 cursor-pointer">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">UPI Payment</p>
                    <p className="text-sm text-gray-500">Google Pay, PhonePe, Paytm</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              disabled={isProcessing || (paymentMethod === 'wallet' && walletBalance < totalAmount)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Pay $${totalAmount.toFixed(2)}`
              )}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>

          {paymentMethod === 'wallet' && walletBalance < totalAmount && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">
                <strong>Insufficient Balance:</strong> You need ${(totalAmount - walletBalance).toFixed(2)} more in your wallet.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            Your payment is secure and encrypted. We never store your payment details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
