import { useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePayment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkWalletBalance = async (requiredAmount: number): Promise<{ 
    hasBalance: boolean; 
    currentBalance: number; 
    shortfall?: number 
  }> => {
    try {
      const { data: balanceData, error } = await supabase.rpc('get_wallet_balance', { 
        user_uuid: user?.id 
      });
      
      if (error) throw error;
      
      const currentBalance = balanceData || 0;
      const hasBalance = currentBalance >= requiredAmount;
      const shortfall = hasBalance ? 0 : requiredAmount - currentBalance;
      
      return { hasBalance, currentBalance, shortfall };
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      return { hasBalance: false, currentBalance: 0, shortfall: requiredAmount };
    }
  };

  const processPayment = async (
    amount: number,
    designerId: string,
    bookingId?: string,
    description?: string
  ): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Session expired' };
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          designerId,
          bookingId,
          description
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Payment of ₹${amount} processed successfully!`);
        return { 
          success: true, 
          newBalance: result.newBalance 
        };
      } else {
        toast.error(result.error || 'Payment failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const handleInsufficientBalance = (shortfall: number) => {
    toast.error(`Insufficient balance. You need ₹${shortfall} more. Redirecting to recharge...`);
    // Redirect to wallet recharge page after a short delay
    setTimeout(() => {
      window.location.href = '/customer-dashboard/wallet';
    }, 2000);
  };

  const payDesigner = async (
    amount: number,
    designerId: string,
    bookingId?: string,
    description?: string
  ): Promise<boolean> => {
    // First check if user has sufficient balance
    const balanceCheck = await checkWalletBalance(amount);
    
    if (!balanceCheck.hasBalance) {
      handleInsufficientBalance(balanceCheck.shortfall || 0);
      return false;
    }

    // Process the payment
    const result = await processPayment(amount, designerId, bookingId, description);
    return result.success;
  };

  return {
    loading,
    checkWalletBalance,
    processPayment,
    payDesigner,
    handleInsufficientBalance
  };
}
