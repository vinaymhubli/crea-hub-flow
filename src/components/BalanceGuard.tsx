import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePayment } from '@/hooks/usePayment';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, AlertTriangle, ArrowRight, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BalanceGuardProps {
  requiredAmount: number;
  children: React.ReactNode;
  onInsufficientBalance?: () => void;
  showModal?: boolean;
}

export function BalanceGuard({ 
  requiredAmount, 
  children, 
  onInsufficientBalance,
  showModal = true 
}: BalanceGuardProps) {
  const { user } = useAuth();
  const [hasBalance, setHasBalance] = useState<boolean | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  useEffect(() => {
    if (user && requiredAmount > 0) {
      checkBalance();
    }
  }, [user, requiredAmount]);

  const checkBalance = async () => {
    try {
      setLoading(true);
      const { data: balanceData, error } = await supabase.rpc('get_wallet_balance', { 
        user_uuid: user?.id 
      });
      
      if (error) throw error;
      
      const balance = balanceData || 0;
      setCurrentBalance(balance);
      const sufficient = balance >= requiredAmount;
      setHasBalance(sufficient);
      
      if (!sufficient && showModal) {
        setShowInsufficientModal(true);
      }
      
      if (!sufficient && onInsufficientBalance) {
        onInsufficientBalance();
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      setHasBalance(false);
    } finally {
      setLoading(false);
    }
  };

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        <span className="ml-2 text-sm text-muted-foreground">Checking balance...</span>
      </div>
    );
  }

  // If insufficient balance, show modal or redirect
  if (hasBalance === false && showModal) {
    return (
      <>
        {children}
        <Dialog open={showInsufficientModal} onOpenChange={setShowInsufficientModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Insufficient Balance
              </DialogTitle>
              <DialogDescription>
                You don't have enough balance in your wallet to complete this action.
              </DialogDescription>
            </DialogHeader>
            
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Wallet className="w-4 h-4 mr-2 text-orange-600" />
                  Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Balance:</span>
                    <span className="font-semibold">${currentBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Required Amount:</span>
                    <span className="font-semibold">${requiredAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm text-muted-foreground">Shortfall:</span>
                    <span className="font-semibold text-orange-600">${(requiredAmount - currentBalance).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowInsufficientModal(false)}
              >
                Cancel
              </Button>
              <Link to="/customer-dashboard/wallet">
                <Button className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white hover:shadow-lg transition-all duration-300">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Recharge Wallet
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // If sufficient balance or not showing modal, render children
  return <>{children}</>;
}

// Higher-order component for easier usage
export function withBalanceGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredAmount: number,
  options?: { showModal?: boolean; onInsufficientBalance?: () => void }
) {
  return function WrappedComponent(props: P) {
    return (
      <BalanceGuard 
        requiredAmount={requiredAmount}
        showModal={options?.showModal}
        onInsufficientBalance={options?.onInsufficientBalance}
      >
        <Component {...props} />
      </BalanceGuard>
    );
  };
}
