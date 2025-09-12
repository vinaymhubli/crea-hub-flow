import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Wallet, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickRechargeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredAmount?: number;
  shortfall?: number;
  onSuccess?: () => void;
}

export function QuickRecharge({ 
  open, 
  onOpenChange, 
  requiredAmount = 0, 
  shortfall = 0,
  onSuccess 
}: QuickRechargeProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Set default amount to cover shortfall with some buffer
  React.useEffect(() => {
    if (shortfall > 0) {
      setAmount((shortfall + 10).toString()); // Add ₹10 buffer
    }
  }, [shortfall]);

  const handleRecharge = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to recharge');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phonepe-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          userId: user?.id,
          redirectUrl: `${window.location.origin}${window.location.pathname}?recharge_success=true`
        })
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        onOpenChange(false);
        // Redirect to PhonePe payment page
        window.location.href = result.paymentUrl;
      } else {
        toast.error(result.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Recharge error:', error);
      toast.error('Failed to process recharge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            Quick Recharge
          </DialogTitle>
          <DialogDescription>
            Add money to your wallet to continue with your transaction.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {requiredAmount > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Required Amount:</span>
                    <span className="font-semibold">₹{requiredAmount.toFixed(2)}</span>
                  </div>
                  {shortfall > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shortfall:</span>
                      <span className="font-semibold text-orange-600">₹{shortfall.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                id="amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 border-teal-200/50 focus:border-teal-400 focus:ring-teal-400/20"
                type="number"
                min="1"
                step="0.01"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              You will receive ₹{amount || '0'} as wallet credits
            </p>
          </div>

          <div className="space-y-2">
            <Label>Quick Amounts</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="hover:bg-teal-50 border-teal-200"
                >
                  ₹{quickAmount}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">PhonePe Payment</p>
                <p className="text-sm text-blue-700">Secure payment powered by PhonePe</p>
              </div>
            </div>
          </div>
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
            onClick={handleRecharge}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Recharge ₹{amount || '0'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
