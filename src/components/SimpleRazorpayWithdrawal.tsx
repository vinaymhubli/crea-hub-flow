import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowDownCircle, 
  Banknote, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Shield,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { BankAccountManager } from './BankAccountManager'

interface BankAccount {
  id: string
  account_holder_name: string
  bank_name: string
  account_number: string
  ifsc_code: string
  account_type: string
  is_verified: boolean
  is_primary: boolean
  created_at: string
  updated_at: string
}

interface SimpleRazorpayWithdrawalProps {
  currentBalance: number
  onSuccess?: (amount: number) => void
  onError?: (error: string) => void
}

export function SimpleRazorpayWithdrawal({ currentBalance, onSuccess, onError }: SimpleRazorpayWithdrawalProps) {
  const [amount, setAmount] = useState('')
  const [selectedBankAccount, setSelectedBankAccount] = useState('')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [open, setOpen] = useState(false)
  const [showBankManager, setShowBankManager] = useState(false)
  const [minWithdrawal, setMinWithdrawal] = useState(100)
  const [maxWithdrawal, setMaxWithdrawal] = useState(50000)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (open) {
      fetchBankAccounts()
      fetchWithdrawalLimits()
    }
  }, [open])

  const fetchBankAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setBankAccounts(data || [])
      
      // Auto-select primary account
      const primaryAccount = data?.find(account => account.is_primary)
      if (primaryAccount) {
        setSelectedBankAccount(primaryAccount.id)
      }
    } catch (error: any) {
      console.error('Error fetching bank accounts:', error)
      toast({
        title: "Error",
        description: "Failed to fetch bank accounts",
        variant: "destructive"
      })
    } finally {
      setLoadingAccounts(false)
    }
  }

  const fetchWithdrawalLimits = async () => {
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('minimum_withdrawal_amount, maximum_withdrawal_amount')
        .single()

      if (data) {
        setMinWithdrawal(data.minimum_withdrawal_amount || 100)
        setMaxWithdrawal(data.maximum_withdrawal_amount || 50000)
      }
    } catch (error) {
      console.error('Error fetching withdrawal limits:', error)
    }
  }

  // Simple withdrawal without Razorpay payouts - just create transaction
  const handleSimpleWithdrawal = async () => {
    const withdrawalAmount = parseFloat(amount)
    
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      })
      return
    }

    if (withdrawalAmount < minWithdrawal) {
      toast({
        title: "Minimum Amount",
        description: `Minimum withdrawal amount is ₹${minWithdrawal}`,
        variant: "destructive"
      })
      return
    }

    if (withdrawalAmount > maxWithdrawal) {
      toast({
        title: "Maximum Amount",
        description: `Maximum withdrawal amount is ₹${maxWithdrawal}`,
        variant: "destructive"
      })
      return
    }

    if (withdrawalAmount > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds wallet balance",
        variant: "destructive"
      })
      return
    }

    if (!selectedBankAccount) {
      toast({
        title: "Select Bank Account",
        description: "Please select a verified bank account",
        variant: "destructive"
      })
      return
    }

    const selectedAccount = bankAccounts.find(account => account.id === selectedBankAccount)
    if (!selectedAccount?.is_verified) {
      toast({
        title: "Account Not Verified",
        description: "Please verify your bank account before withdrawal",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Create withdrawal transaction (will be processed manually by admin)
      const { error: insertError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user?.id,
          amount: withdrawalAmount,
          transaction_type: 'withdrawal',
          status: 'pending',
          description: `Withdrawal request to ${selectedAccount.bank_name} - ${selectedAccount.account_number}`,
          metadata: {
            bank_account_id: selectedBankAccount,
            bank_name: selectedAccount.bank_name,
            account_number: selectedAccount.account_number,
            account_holder_name: selectedAccount.account_holder_name,
            ifsc_code: selectedAccount.ifsc_code,
            withdrawal_method: 'manual_processing',
            requested_at: new Date().toISOString()
          }
        })

      if (insertError) {
        throw new Error('Failed to create withdrawal request')
      }

      toast({
        title: "✅ Withdrawal Request Submitted",
        description: `₹${withdrawalAmount} withdrawal request submitted. Processing time: 2-4 business days`,
        duration: 6000
      })
      
      setAmount('')
      setOpen(false)
      onSuccess?.(withdrawalAmount)

    } catch (error: any) {
      console.error('Withdrawal error:', error)
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal request",
        variant: "destructive"
      })
      onError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  const verifiedAccounts = bankAccounts.filter(account => account.is_verified)
  const hasVerifiedAccounts = verifiedAccounts.length > 0

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 transition-all duration-300">
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Banknote className="w-6 h-6 text-orange-600" />
              Withdraw Money
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Balance */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Balance</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                    ₹{currentBalance.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Bank Account Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Bank Account</label>
              {loadingAccounts ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Loading accounts...</span>
                </div>
              ) : hasVerifiedAccounts ? (
                <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                  <SelectTrigger className="h-12 border-2">
                    <SelectValue placeholder="Choose bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {verifiedAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-3 py-1">
                          <Shield className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="font-medium">{account.bank_name}</div>
                            <div className="text-xs text-gray-500">****{account.account_number.slice(-4)}</div>
                          </div>
                          {account.is_primary && (
                            <Badge variant="secondary" className="text-xs ml-2">Primary</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 dark:text-orange-200">
                    No verified bank accounts found. Please add and verify a bank account first.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBankManager(true)}
                className="w-full h-10 border-dashed border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                {hasVerifiedAccounts ? 'Manage Bank Accounts' : 'Add Bank Account'}
              </Button>
            </div>

            {/* Amount Input */}
            {hasVerifiedAccounts && (
              <>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Withdrawal Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8 h-12 text-lg font-medium border-2 focus:border-orange-500 transition-colors"
                      min={minWithdrawal}
                      max={Math.min(maxWithdrawal, currentBalance)}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Min: ₹{minWithdrawal} • Max: ₹{Math.min(maxWithdrawal, currentBalance).toLocaleString()}
                  </p>
                </div>

                {/* Processing Info */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Withdrawal Processing</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>✓ Manual verification by admin</p>
                      <p>✓ NEFT/IMPS bank transfer</p>
                      <p>✓ Processing time: 2-4 business days</p>
                      <p>✓ No processing charges</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1 h-12 font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSimpleWithdrawal}
                    disabled={loading || !amount || !selectedBankAccount || parseFloat(amount) <= 0}
                    className="flex-1 h-12 font-medium bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="w-5 h-5 mr-2" />
                        Request ₹{amount || '0'}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BankAccountManager
        open={showBankManager}
        onOpenChange={setShowBankManager}
        onAccountAdded={() => {
          fetchBankAccounts()
          setShowBankManager(false)
        }}
      />
    </>
  )
}
























