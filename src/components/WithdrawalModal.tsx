import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  ArrowUpRight, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  is_verified: boolean;
  is_primary: boolean;
}

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (amount: number) => void;
  userType?: 'customer' | 'designer';
}

export function WithdrawalModal({ open, onOpenChange, onSuccess, userType = 'customer' }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showBankManager, setShowBankManager] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      fetchBankAccounts();
      fetchWalletBalance();
    }
  }, [open, user]);

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
      
      // Auto-select primary account if available
      const primaryAccount = data?.find(acc => acc.is_primary);
      if (primaryAccount) {
        setSelectedAccount(primaryAccount.id);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      if (userType === 'designer') {
        const { data, error } = await (supabase as any).rpc('get_available_earnings', { user_uuid: user?.id });
        if (error) throw error;
        setWalletBalance(Number(data) || 0);
      } else {
        const { data, error } = await supabase.rpc('get_wallet_balance', { user_uuid: user?.id });
        if (error) throw error;
        setWalletBalance(data || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleWithdrawal = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedAccount) {
      toast.error('Please select a bank account');
      return;
    }

    if (parseFloat(amount) > walletBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to make withdrawal');
        return;
      }

      const endpoint = userType === 'designer' 
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-designer-withdrawal`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          bankAccountId: selectedAccount,
          description: description || 'Wallet withdrawal'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Withdrawal of ₹${amount} initiated successfully!`);
        onSuccess?.(parseFloat(amount));
        onOpenChange(false);
        setAmount('');
        setDescription('');
      } else {
        toast.error(result.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];
  const selectedBankAccount = bankAccounts.find(acc => acc.id === selectedAccount);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
          <DialogTitle className="text-2xl text-foreground flex items-center">
            <ArrowUpRight className="w-6 h-6 mr-2 text-green-600" />
            {userType === 'designer' ? 'Withdraw Earnings' : 'Withdraw from Wallet'}
          </DialogTitle>
          <DialogDescription>
            {userType === 'designer' 
              ? 'Transfer your earnings to your bank account. Withdrawals typically take 1-2 business days.'
              : 'Transfer money from your wallet to your bank account. Withdrawals typically take 2-4 business days.'
            }
          </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Wallet Balance */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">
                      {userType === 'designer' ? 'Available Earnings' : 'Available Balance'}
                    </p>
                    <p className="text-2xl font-bold text-green-800">₹{walletBalance.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amount Selection */}
            <div className="space-y-4">
              <Label htmlFor="amount" className="text-lg font-semibold">
                {userType === 'designer' ? 'Earnings Withdrawal Amount (₹)' : 'Withdrawal Amount (₹)'}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">₹</span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-lg h-12 border-2 focus:border-green-400 focus:ring-green-400/20"
                  type="number"
                  min="1"
                  step="0.01"
                  max={walletBalance}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum {userType === 'designer' ? 'earnings withdrawal' : 'withdrawal'}: ₹{walletBalance.toFixed(2)}
              </p>

              {/* Quick Amount Buttons */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Amounts</Label>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                      disabled={quickAmount > walletBalance}
                      className="hover:bg-green-50 border-green-200 hover:border-green-300"
                    >
                      ₹{quickAmount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bank Account Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Select Bank Account</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBankManager(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Manage Accounts
                </Button>
              </div>
              
              {bankAccounts.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Building2 className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bank Accounts</h3>
                    <p className="text-gray-500 text-center mb-4">
                      Add a bank account to enable withdrawals
                    </p>
                    <Button onClick={() => setShowBankManager(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Bank Account
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-medium">{account.bank_name}</p>
                            <p className="text-sm text-muted-foreground">
                              ****{account.account_number.slice(-4)} • {account.ifsc_code}
                              {account.is_primary && (
                                <Badge className="ml-2 bg-blue-100 text-blue-800">Primary</Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Selected Account Details */}
              {selectedBankAccount && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-900">{selectedBankAccount.bank_name}</p>
                        <p className="text-sm text-blue-700">
                          {selectedBankAccount.account_holder_name} • ****{selectedBankAccount.account_number.slice(-4)}
                        </p>
                        <p className="text-xs text-blue-600">{selectedBankAccount.ifsc_code}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a note for this withdrawal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-green-200 focus:border-green-400 focus:ring-green-400/20"
                rows={3}
              />
            </div>

            {/* Withdrawal Info */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900">Withdrawal Information</h4>
                    <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                      <li>• {userType === 'designer' ? 'Earnings withdrawals typically take 1-2 business days' : 'Withdrawals typically take 2-4 business days'}</li>
                      <li>• Processing time may vary by bank</li>
                      <li>• You'll receive a notification when completed</li>
                      <li>• Minimum withdrawal amount: ₹100</li>
                      {userType === 'designer' && <li>• Only verified bank accounts can be used</li>}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              onClick={handleWithdrawal}
              disabled={loading || !amount || !selectedAccount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  {userType === 'designer' ? 'Withdraw Earnings' : 'Withdraw'} ₹{amount || '0'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Account Manager Modal */}
      {showBankManager && (
        <div className="fixed inset-0 z-50">
          {/* This would be the BankAccountManager component */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowBankManager(false)} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              {/* Bank Account Manager content would go here */}
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Manage Bank Accounts</h2>
                <p className="text-gray-600 mb-4">
                  Bank account management functionality would be integrated here.
                </p>
                <Button onClick={() => setShowBankManager(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
