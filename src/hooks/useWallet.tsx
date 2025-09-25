import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface WalletTransaction {
  id: string;
  amount: number;
  transaction_type: 'deposit' | 'payment' | 'refund' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  description: string;
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
}

export function useWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_wallet_balance', { user_uuid: user.id });
      if (error) throw error;
      setBalance(data || 0);
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
      setError('Failed to fetch wallet balance');
    }
  };

  // Fetch wallet transactions
  const fetchTransactions = async (limit = 50) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTransactions((data as any) || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
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
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      setError('Failed to fetch bank accounts');
    }
  };

  // Add credits to wallet
  const addCredits = async (amount: number, paymentMethod: string, userDetails: any) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/universal-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
          userDetails
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchBalance();
        await fetchTransactions();
      }
      
      return result;
    } catch (err) {
      console.error('Error adding credits:', err);
      return { success: false, error: 'Failed to add credits' };
    } finally {
      setLoading(false);
    }
  };

  // Withdraw from wallet
  const withdraw = async (amount: number, bankAccountId: string, description?: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          bankAccountId,
          description: description || 'Wallet withdrawal'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchBalance();
        await fetchTransactions();
      }
      
      return result;
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      return { success: false, error: 'Failed to process withdrawal' };
    } finally {
      setLoading(false);
    }
  };

  // Pay designer from wallet
  const payDesigner = async (designerId: string, amount: number, sessionId?: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          designerId,
          amount,
          sessionId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchBalance();
        await fetchTransactions();
      }
      
      return result;
    } catch (err) {
      console.error('Error paying designer:', err);
      return { success: false, error: 'Failed to pay designer' };
    } finally {
      setLoading(false);
    }
  };

  // Add bank account
  const addBankAccount = async (accountData: Omit<BankAccount, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          ...accountData
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchBankAccounts();
      return { success: true, data };
    } catch (err) {
      console.error('Error adding bank account:', err);
      return { success: false, error: 'Failed to add bank account' };
    } finally {
      setLoading(false);
    }
  };

  // Update bank account
  const updateBankAccount = async (accountId: string, updates: Partial<BankAccount>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', accountId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchBankAccounts();
      return { success: true, data };
    } catch (err) {
      console.error('Error updating bank account:', err);
      return { success: false, error: 'Failed to update bank account' };
    } finally {
      setLoading(false);
    }
  };

  // Delete bank account
  const deleteBankAccount = async (accountId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchBankAccounts();
      return { success: true };
    } catch (err) {
      console.error('Error deleting bank account:', err);
      return { success: false, error: 'Failed to delete bank account' };
    } finally {
      setLoading(false);
    }
  };

  // Set primary bank account
  const setPrimaryBankAccount = async (accountId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      
      // Remove primary from all accounts
      await supabase
        .from('bank_accounts')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Set selected account as primary
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_primary: true })
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchBankAccounts();
      return { success: true };
    } catch (err) {
      console.error('Error setting primary bank account:', err);
      return { success: false, error: 'Failed to set primary bank account' };
    } finally {
      setLoading(false);
    }
  };

  // Refresh all data
  const refresh = async () => {
    await Promise.all([
      fetchBalance(),
      fetchTransactions(),
      fetchBankAccounts()
    ]);
  };

  // Initialize data when user changes
  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setBalance(0);
      setTransactions([]);
      setBankAccounts([]);
    }
  }, [user]);

  return {
    // State
    balance,
    transactions,
    bankAccounts,
    loading,
    error,
    
    // Actions
    addCredits,
    withdraw,
    payDesigner,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    setPrimaryBankAccount,
    refresh,
    
    // Utilities
    hasSufficientBalance: (amount: number) => balance >= amount,
    getPrimaryBankAccount: () => bankAccounts.find(acc => acc.is_primary),
    getTransactionHistory: (type?: string) => 
      type ? transactions.filter(t => t.transaction_type === type) : transactions
  };
}








