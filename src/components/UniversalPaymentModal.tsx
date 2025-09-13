import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  ArrowRight, 
  Check,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UniversalPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (amount: number, method: string) => void;
}

const PAYMENT_METHODS = {
  upi: {
    name: 'UPI',
    icon: Smartphone,
    description: 'Pay using UPI ID or QR code',
    color: 'bg-blue-50 border-blue-200 text-blue-900',
    iconColor: 'text-blue-600'
  },
  card: {
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Pay using your card',
    color: 'bg-purple-50 border-purple-200 text-purple-900',
    iconColor: 'text-purple-600'
  },
  netbanking: {
    name: 'Net Banking',
    icon: Building2,
    description: 'Pay using net banking',
    color: 'bg-green-50 border-green-200 text-green-900',
    iconColor: 'text-green-600'
  },
  wallet: {
    name: 'Digital Wallet',
    icon: Wallet,
    description: 'Pay using digital wallets',
    color: 'bg-orange-50 border-orange-200 text-orange-900',
    iconColor: 'text-orange-600'
  }
};

export function UniversalPaymentModal({ open, onOpenChange, onSuccess }: UniversalPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<any>({});
  const { user } = useAuth();

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to make payment');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/universal-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod: selectedMethod,
          userDetails: userDetails
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Payment of $${amount} processed successfully!`);
        onSuccess?.(parseFloat(amount), selectedMethod);
        onOpenChange(false);
        setAmount('');
        setSelectedMethod('');
        setUserDetails({});
      } else {
        toast.error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground flex items-center">
            <Wallet className="w-6 h-6 mr-2 text-green-600" />
            Add Credits to Wallet
          </DialogTitle>
          <DialogDescription>
            Choose your preferred payment method to add credits to your wallet. You'll receive the same amount as credits.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Amount Selection */}
          <div className="space-y-4">
            <Label htmlFor="amount" className="text-lg font-semibold">Amount ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">$</span>
              <Input
                id="amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg h-12 border-2 focus:border-green-400 focus:ring-green-400/20"
                type="number"
                min="1"
                step="0.01"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              You will receive ${amount || '0'} as wallet credits
            </p>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Amounts</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="hover:bg-green-50 border-green-200 hover:border-green-300"
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Choose Payment Method</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === key;
                
                return (
                  <Card 
                    key={key}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'ring-2 ring-green-500 bg-green-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMethod(key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isSelected ? 'text-green-600' : method.iconColor
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{method.name}</h3>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Payment Method Details */}
          {selectedMethod && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Payment Details</Label>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4">
                  {selectedMethod === 'upi' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input
                          id="upiId"
                          placeholder="yourname@upi"
                          value={userDetails.upiId || ''}
                          onChange={(e) => setUserDetails({...userDetails, upiId: e.target.value})}
                          className="border-green-200 focus:border-green-400"
                        />
                      </div>
                    </div>
                  )}
                  {selectedMethod === 'card' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={userDetails.cardNumber || ''}
                          onChange={(e) => setUserDetails({...userDetails, cardNumber: e.target.value})}
                          className="border-green-200 focus:border-green-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="expiry">Expiry</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            value={userDetails.expiry || ''}
                            onChange={(e) => setUserDetails({...userDetails, expiry: e.target.value})}
                            className="border-green-200 focus:border-green-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={userDetails.cvv || ''}
                            onChange={(e) => setUserDetails({...userDetails, cvv: e.target.value})}
                            className="border-green-200 focus:border-green-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedMethod === 'netbanking' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="Select your bank"
                          value={userDetails.bankName || ''}
                          onChange={(e) => setUserDetails({...userDetails, bankName: e.target.value})}
                          className="border-green-200 focus:border-green-400"
                        />
                      </div>
                    </div>
                  )}
                  {selectedMethod === 'wallet' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="walletType">Wallet Type</Label>
                        <Input
                          id="walletType"
                          placeholder="Paytm, PhonePe, etc."
                          value={userDetails.walletType || ''}
                          onChange={(e) => setUserDetails({...userDetails, walletType: e.target.value})}
                          className="border-green-200 focus:border-green-400"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="info">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Payment Information</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Secure payment processing</li>
                      <li>• Instant credit to wallet</li>
                      <li>• No additional fees</li>
                      <li>• 24/7 support available</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white hover:shadow-lg transition-all duration-300" 
            onClick={handlePayment}
            disabled={loading || !amount || !selectedMethod || parseFloat(amount) <= 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Add ${amount || '0'} Credits
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
