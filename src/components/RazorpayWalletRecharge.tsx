import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Wallet, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface RazorpayWalletRechargeProps {
  onSuccess?: (amount: number) => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function RazorpayWalletRecharge({ onSuccess, onError }: RazorpayWalletRechargeProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const predefinedAmounts = [100, 500, 1000, 2000, 5000, 10000]

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRecharge = async () => {
    const rechargeAmount = parseFloat(amount)
    
    if (!rechargeAmount || rechargeAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      })
      return
    }

    if (rechargeAmount < 10) {
      toast({
        title: "Minimum Amount",
        description: "Minimum recharge amount is ₹10",
        variant: "destructive"
      })
      return
    }

    if (rechargeAmount > 100000) {
      toast({
        title: "Maximum Amount",
        description: "Maximum recharge amount is ₹1,00,000",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK')
      }

      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-wallet-recharge', {
        body: {
          action: 'create_order',
          amount: rechargeAmount,
          currency: 'INR'
        }
      })

      if (orderError) {
        throw new Error(orderError.message || 'Failed to create payment order')
      }

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order')
      }

      const options = {
        key: orderData.order.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'meetmydesigners',
        description: orderData.order.description,
        order_id: orderData.order.id,
        prefill: orderData.order.prefill,
        theme: {
          color: '#059669', // green-600 to match website theme
          backdrop_color: 'rgba(0, 0, 0, 0.6)'
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-wallet-recharge', {
              body: {
                action: 'verify_payment',
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id
              }
            })

            if (verifyError) {
              throw new Error(verifyError.message || 'Payment verification failed')
            }

            if (verifyData.success) {
              toast({
                title: "Payment Successful",
                description: `₹${rechargeAmount} has been added to your wallet`,
              })
              
              setAmount('')
              setOpen(false)
              onSuccess?.(rechargeAmount)
            } else {
              throw new Error('Payment verification failed')
            }
          } catch (error: any) {
            console.error('Payment verification error:', error)
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support if amount was deducted",
              variant: "destructive"
            })
            onError?.(error.message)
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed')
            setLoading(false)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (error: any) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      })
      onError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Add Money
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Add Money to Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Enter Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">₹</span>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                min="10"
                max="100000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum: ₹10, Maximum: ₹1,00,000</p>
          </div>

          {/* Predefined Amounts */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Select</label>
            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((preAmount) => (
                <Button
                  key={preAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preAmount.toString())}
                  className="text-xs"
                >
                  ₹{preAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Secure Payment via Razorpay</span>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">UPI</Badge>
                  <Badge variant="outline" className="text-xs px-1 py-0">Cards</Badge>
                  <Badge variant="outline" className="text-xs px-1 py-0">Net Banking</Badge>
                  <Badge variant="outline" className="text-xs px-1 py-0">Wallets</Badge>
                </div>
                <p>✓ Instant credit to wallet</p>
                <p>✓ 256-bit SSL encryption</p>
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
              onClick={handleRecharge}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ₹{amount || '0'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
