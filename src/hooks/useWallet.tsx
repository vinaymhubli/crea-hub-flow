import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface WalletTransaction {
  id: string;
  transaction_type: 'deposit' | 'payment' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  booking_id?: string;
  created_at: string;
  metadata?: any;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export function useWallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_wallet_balance', {
        user_uuid: user.id
      });
      
      if (error) throw error;
      setBalance(Number(data) || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setBalance(0);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setBankAccounts([]);
    }
  };

  // Check if user has sufficient balance
  const hasSufficientBalance = (amount: number): boolean => {
    return balance >= amount;
  };

  // Get transaction history by type
  const getTransactionHistory = (type: string) => {
    return transactions.filter(t => t.transaction_type === type);
  };

  // Get primary bank account
  const getPrimaryBankAccount = (): BankAccount | null => {
    return bankAccounts.find(account => account.is_primary) || null;
  };

  // Pay designer (for session payments)
  const payDesigner = async (designerId: string, amount: number, sessionId?: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!hasSufficientBalance(amount)) {
      return { success: false, error: 'Insufficient balance' };
    }

    try {
      setLoading(true);
      
      // Create payment transaction
      const { data: paymentTransaction, error: paymentError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'payment',
          amount: amount,
          description: `Payment to designer for session${sessionId ? ` ${sessionId}` : ''}`,
          status: 'completed',
          metadata: {
            designer_id: designerId,
            session_id: sessionId,
            payment_type: 'session_payment'
          }
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create earnings transaction for designer
      const { error: earningsError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: designerId,
          transaction_type: 'deposit',
          amount: amount,
          description: `Earnings from session${sessionId ? ` ${sessionId}` : ''}`,
          status: 'completed',
          metadata: {
            customer_id: user.id,
            session_id: sessionId,
            payment_type: 'session_earnings'
          }
        });

      if (earningsError) throw earningsError;

      // Refresh data
      await Promise.all([fetchBalance(), fetchTransactions()]);
      
      toast.success(`Payment of ₹${amount} processed successfully!`);
      return { success: true, transaction: paymentTransaction };
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
      return { success: false, error: 'Payment failed' };
    } finally {
      setLoading(false);
    }
  };

  // Refresh all data
  const refresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBalance(),
        fetchTransactions(),
        fetchBankAccounts()
      ]);
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user]);

  return {
    balance,
    transactions,
    bankAccounts,
    loading,
    hasSufficientBalance,
    getTransactionHistory,
    getPrimaryBankAccount,
    payDesigner,
    refresh
  };
}
