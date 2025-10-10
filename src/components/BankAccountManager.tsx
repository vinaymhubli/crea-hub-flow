import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  AlertCircle,
  CreditCard,
  Star,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BankAccountVerification } from './BankAccountVerification';
import { PennyDropVerification } from './PennyDropVerification';

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

interface BankAccountManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded?: (account: BankAccount) => void;
}

export function BankAccountManager({ open, onOpenChange, onAccountAdded }: BankAccountManagerProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState<BankAccount | null>(null);
  const [showPennyDrop, setShowPennyDrop] = useState(false);
  const [pennyDropAccount, setPennyDropAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'savings'
  });
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      fetchBankAccounts();
    }
  }, [open, user]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data as BankAccount[] || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to add bank account');
      return;
    }

    try {
      setLoading(true);
      
      const accountData = {
        user_id: user.id,
        ...formData,
        is_verified: false,
        is_primary: accounts.length === 0 // First account is primary by default
      };

      let result;
      if (editingAccount) {
        // Update existing account
        const { data, error } = await (supabase as any)
          .from('bank_accounts')
          .update(accountData)
          .eq('id', editingAccount.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('Bank account updated successfully');
      } else {
        // Add new account
        const { data, error } = await (supabase as any)
          .from('bank_accounts')
          .insert(accountData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('Bank account added successfully');
      }

      await fetchBankAccounts();
      setShowAddForm(false);
      setEditingAccount(null);
      setFormData({
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        ifsc_code: '',
        account_type: 'savings'
      });
      
      onAccountAdded?.(result);
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast.error('Failed to save bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      
      toast.success('Bank account deleted successfully');
      await fetchBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error('Failed to delete bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      setLoading(true);
      
      // Remove primary from all accounts
      await (supabase as any)
        .from('bank_accounts')
        .update({ is_primary: false })
        .eq('user_id', user?.id);

      // Set selected account as primary
      const { error } = await (supabase as any)
        .from('bank_accounts')
        .update({ is_primary: true })
        .eq('id', accountId);

      if (error) throw error;
      
      toast.success('Primary bank account updated');
      await fetchBankAccounts();
    } catch (error) {
      console.error('Error setting primary account:', error);
      toast.error('Failed to update primary account');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_holder_name: account.account_holder_name,
      account_number: account.account_number,
      ifsc_code: account.ifsc_code,
      account_type: account.account_type
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingAccount(null);
    setShowAddForm(false);
    setFormData({
      bank_name: '',
      account_holder_name: '',
      account_number: '',
      ifsc_code: '',
      account_type: 'savings'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-blue-600" />
            Manage Bank Accounts
          </DialogTitle>
          <DialogDescription>
            Add and manage your bank accounts for withdrawals. You can add multiple accounts and set one as primary.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                        placeholder="e.g., State Bank of India"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_holder_name">Account Holder Name</Label>
                      <Input
                        id="account_holder_name"
                        value={formData.account_holder_name}
                        onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                        placeholder="Full name as per bank records"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        value={formData.account_number}
                        onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                        placeholder="Enter account number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ifsc_code">IFSC Code</Label>
                      <Input
                        id="ifsc_code"
                        value={formData.ifsc_code}
                        onChange={(e) => setFormData({...formData, ifsc_code: e.target.value.toUpperCase()})}
                        placeholder="e.g., SBIN0001234"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="account_type">Account Type</Label>
                    <Select 
                      value={formData.account_type} 
                      onValueChange={(value) => setFormData({...formData, account_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Savings Account</SelectItem>
                        <SelectItem value="current">Current Account</SelectItem>
                        <SelectItem value="salary">Salary Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : (editingAccount ? 'Update' : 'Add')} Account
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Bank Accounts List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Bank Accounts</h3>
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              )}
            </div>

            {loading && accounts.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : accounts.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bank Accounts</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Add a bank account to enable withdrawals from your wallet
                  </p>
                  <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Account
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((account) => (
                  <Card key={account.id} className={`relative ${account.is_primary ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">{account.bank_name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          {account.is_primary && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <Star className="w-3 h-3 mr-1" />
                              Primary
                            </Badge>
                          )}
                          {account.is_verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Account Holder</p>
                          <p className="font-medium">{account.account_holder_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Account Number</p>
                          <p className="font-mono">****{account.account_number.slice(-4)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">IFSC Code</p>
                          <p className="font-mono">{account.ifsc_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Account Type</p>
                          <p className="capitalize">{account.account_type}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        {!account.is_verified && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPennyDropAccount(account);
                                setShowPennyDrop(true);
                              }}
                              disabled={loading}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Penny Drop
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setVerifyingAccount(account);
                                setShowVerification(true);
                              }}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Manual
                            </Button>
                          </div>
                        )}
                        {!account.is_primary && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetPrimary(account.id)}
                            disabled={loading}
                          >
                            Set Primary
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(account)}
                          disabled={loading}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(account.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      
      {/* Bank Account Verification Modal */}
      <BankAccountVerification
        open={showVerification}
        onOpenChange={setShowVerification}
        bankAccount={verifyingAccount}
        onVerified={(account) => {
          // Refresh accounts after verification
          fetchBankAccounts();
          setShowVerification(false);
          setVerifyingAccount(null);
        }}
      />

      {pennyDropAccount && (
        <PennyDropVerification
          bankAccount={pennyDropAccount}
          open={showPennyDrop}
          onOpenChange={setShowPennyDrop}
          onVerified={() => {
            // Refresh accounts after verification
            fetchBankAccounts();
            setShowPennyDrop(false);
            setPennyDropAccount(null);
          }}
        />
      )}
    </Dialog>
  );
}
