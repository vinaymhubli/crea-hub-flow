import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  IndianRupee,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface BankAccount {
  id: string
  account_holder_name: string
  bank_name: string
  account_number: string
  ifsc_code: string
  is_verified: boolean
}

interface PennyDropVerificationProps {
  bankAccount: BankAccount
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
}

type VerificationStep = 'initiate' | 'waiting' | 'verify' | 'completed'

export function PennyDropVerification({ 
  bankAccount, 
  open, 
  onOpenChange, 
  onVerified 
}: PennyDropVerificationProps) {
  const [step, setStep] = useState<VerificationStep>('initiate')
  const [loading, setLoading] = useState(false)
  const [amountReceived, setAmountReceived] = useState('')
  const [payoutId, setPayoutId] = useState('')
  const [expectedAmount, setExpectedAmount] = useState('')
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)
  const { toast } = useToast()

  const initiatePennyDrop = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('razorpay-penny-drop', {
        body: {
          bank_account_id: bankAccount.id,
          action: 'initiate_penny_drop'
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to initiate penny drop')
      }

      if (data.success) {
        setPayoutId(data.data.payout_id)
        setExpectedAmount(data.data.expected_amount_display)
        setStep('waiting')
        
        toast({
          title: "💰 Penny Drop Initiated!",
          description: `₹${data.data.expected_amount_display} will be sent to your account within 2-4 hours`,
          duration: 6000
        })
      } else {
        throw new Error(data.error || 'Failed to initiate penny drop')
      }
    } catch (error: any) {
      console.error('Penny drop initiation error:', error)
      toast({
        title: "Initiation Failed",
        description: error.message || "Failed to initiate penny drop",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const verifyPennyDrop = async () => {
    if (!amountReceived) {
      toast({
        title: "Enter Amount",
        description: "Please enter the exact amount you received",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('razorpay-penny-drop', {
        body: {
          bank_account_id: bankAccount.id,
          action: 'verify_penny_drop',
          amount_received: amountReceived
        }
      })

      if (error) {
        throw new Error(error.message || 'Verification failed')
      }

      if (data.success) {
        setStep('completed')
        toast({
          title: "🎉 Account Verified!",
          description: "Your bank account has been successfully verified",
          duration: 5000
        })
        
        setTimeout(() => {
          onVerified()
          onOpenChange(false)
        }, 2000)
      } else {
        setAttemptsRemaining(data.attempts_remaining || 0)
        toast({
          title: "Verification Failed",
          description: data.error || "Incorrect amount entered",
          variant: "destructive"
        })
        
        if (data.attempts_remaining === 0) {
          setStep('initiate') // Reset to allow new penny drop
        }
      }
    } catch (error: any) {
      console.error('Penny drop verification error:', error)
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify amount",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetVerification = () => {
    setStep('initiate')
    setAmountReceived('')
    setPayoutId('')
    setExpectedAmount('')
    setAttemptsRemaining(3)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Verify Bank Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bank Account Info */}
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Bank</span>
                  <span className="font-medium">{bankAccount.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Account</span>
                  <span className="font-medium">****{bankAccount.account_number.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Holder</span>
                  <span className="font-medium">{bankAccount.account_holder_name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Initiate Penny Drop */}
          {step === 'initiate' && (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Penny Drop Verification</strong><br />
                  We'll send a small amount (₹1-₹10) to your account. You'll need to confirm the exact amount received.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>✓ Secure verification method</p>
                  <p>✓ Amount will be sent within 2-4 hours</p>
                  <p>✓ Check your bank statement or SMS</p>
                  <p>✓ Enter exact amount to verify</p>
                </div>
              </div>

              <Button
                onClick={initiatePennyDrop}
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <IndianRupee className="w-4 h-4 mr-2" />
                    Start Penny Drop Verification
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Waiting for Amount */}
          {step === 'waiting' && (
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <strong>Penny Drop Sent!</strong><br />
                  A small amount has been sent to your account. It may take 2-4 hours to reflect.
                </AlertDescription>
              </Alert>

              {payoutId && (
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Transfer Initiated
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Payout ID: {payoutId}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('verify')}
                  className="flex-1"
                >
                  I Received the Amount
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={resetVerification}
                  size="icon"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Verify Amount */}
          {step === 'verify' && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <IndianRupee className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Enter Exact Amount</strong><br />
                  Check your bank statement or SMS and enter the exact amount you received.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <label className="text-sm font-medium">Amount Received</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="pl-8 h-12 text-lg font-medium"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter amount with decimals (e.g., 1.23, 5.67)
                  {attemptsRemaining < 3 && (
                    <span className="text-orange-600 ml-2">
                      • {attemptsRemaining} attempts remaining
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('waiting')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={verifyPennyDrop}
                  disabled={loading || !amountReceived}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify Amount
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Completed */}
          {step === 'completed' && (
            <div className="space-y-4 text-center">
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Account Verified Successfully!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    You can now use this account for withdrawals
                  </p>
                </div>
              </div>

              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Shield className="w-3 h-3 mr-1" />
                Verified Account
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}






