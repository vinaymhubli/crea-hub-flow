import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Shield
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

interface RazorpayWithdrawalProps {
  currentBalance: number
  onSuccess?: (amount: number) => void
  onError?: (error: string) => void
}

export function RazorpayWithdrawal({ currentBalance, onSuccess, onError }: RazorpayWithdrawalProps) {
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

  const handleWithdrawal = async () => {
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
      const { data, error } = await supabase.functions.invoke('razorpay-withdrawal', {
        body: {
          amount: withdrawalAmount,
          bank_account_id: selectedBankAccount,
          purpose: 'payout'
        }
      })

      if (error) {
        throw new Error(error.message || 'Withdrawal request failed')
      }

      if (data.success) {
        toast({
          title: "Withdrawal Initiated",
          description: `₹${withdrawalAmount} withdrawal request submitted successfully`,
        })
        
        setAmount('')
        setOpen(false)
        onSuccess?.(withdrawalAmount)
      } else {
        throw new Error(data.error || 'Withdrawal request failed')
      }

    } catch (error: any) {
      console.error('Withdrawal error:', error)
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal",
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
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            Withdraw
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Withdraw Money
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Balance */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Available Balance</span>
                  <span className="font-semibold text-green-800">₹{currentBalance.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Bank Account Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Bank Account</label>
              {loadingAccounts ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm">Loading accounts...</span>
                </div>
              ) : hasVerifiedAccounts ? (
                <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {verifiedAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3 text-green-600" />
                          <span>{account.bank_name} - ****{account.account_number.slice(-4)}</span>
                          {account.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No verified bank accounts found. Please add and verify a bank account first.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBankManager(true)}
                className="mt-2 w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {hasVerifiedAccounts ? 'Manage Bank Accounts' : 'Add Bank Account'}
              </Button>
            </div>

            {/* Amount Input */}
            {hasVerifiedAccounts && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Withdrawal Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">₹</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8"
                      min={minWithdrawal}
                      max={Math.min(maxWithdrawal, currentBalance)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Min: ₹{minWithdrawal}, Max: ₹{Math.min(maxWithdrawal, currentBalance).toLocaleString()}
                  </p>
                </div>

                {/* Processing Info */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Withdrawal Processing</span>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>✓ Processed via Razorpay</p>
                      <p>✓ IMPS transfer (instant)</p>
                      <p>✓ Processing time: 2-4 hours</p>
                      <p>✓ No additional charges</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleWithdrawal}
                    disabled={loading || !amount || !selectedBankAccount || parseFloat(amount) <= 0}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                        Withdraw ₹{amount || '0'}
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
