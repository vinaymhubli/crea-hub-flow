import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { toast } from 'sonner';

interface PaymentButtonProps {
  designerId: string;
  designerName: string;
  bookingId?: string;
  defaultAmount?: number;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({
  designerId,
  designerName,
  bookingId,
  defaultAmount = 0,
  description = '',
  className = '',
  children
}: PaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [paymentDescription, setPaymentDescription] = useState(description);
  const { loading, payDesigner } = usePayment();

  const handlePayment = async () => {
    const paymentAmount = parseFloat(amount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const success = await payDesigner(
      paymentAmount,
      designerId,
      bookingId,
      paymentDescription || `Payment to ${designerName}`
    );

    if (success) {
      setOpen(false);
      setAmount(defaultAmount.toString());
      setPaymentDescription(description);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className={`bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white hover:shadow-lg transition-all duration-300 ${className}`}>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay Designer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-green-600" />
            Pay {designerName}
          </DialogTitle>
          <DialogDescription>
            Transfer money from your wallet to the designer's wallet.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 border-teal-200/50 focus:border-teal-400 focus:ring-teal-400/20"
                type="number"
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="e.g., Payment for logo design, session fee, etc."
              value={paymentDescription}
              onChange={(e) => setPaymentDescription(e.target.value)}
              className="border-teal-200/50 focus:border-teal-400 focus:ring-teal-400/20"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Wallet Payment</p>
                <p className="text-sm text-blue-700">
                  The amount will be deducted from your wallet and added to the designer's wallet instantly.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white hover:shadow-lg transition-all duration-300" 
            onClick={handlePayment}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ${amount || '0'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
