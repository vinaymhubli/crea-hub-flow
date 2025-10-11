import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Wallet, CreditCard, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface SimpleRazorpayRechargeProps {
  onSuccess?: (amount: number) => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function SimpleRazorpayRecharge({ onSuccess, onError }: SimpleRazorpayRechargeProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const predefinedAmounts = [1, 10, 100, 500, 1000, 2000]

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

    if (rechargeAmount < 1) {
      toast({
        title: "Minimum Amount",
        description: "Minimum recharge amount is ₹1",
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

      // Get current theme colors
      const isDark = document.documentElement.classList.contains('dark')
      const themeColor = isDark ? '#1f2937' : '#3b82f6' // gray-800 for dark, blue-500 for light

      const options = {
        key: orderData.order.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'meetmydesigners',
        description: `Add ₹${rechargeAmount} to wallet`,
        order_id: orderData.order.id,
        prefill: {
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
          email: user?.email || '',
          contact: user?.user_metadata?.phone || ''
        },
        theme: {
          color: isDark ? '#10b981' : '#059669', // green-500 for dark, green-600 for light to match website
          backdrop_color: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)'
        },
        modal: {
          backdropclose: false,
          escape: true,
          handleback: true,
          confirm_close: true,
          ondismiss: () => {
            console.log('Payment modal dismissed')
            setLoading(false)
          }
        },
        handler: async (response: any) => {
          try {
            console.log('Payment successful, verifying...', response)
            
            // Verify payment manually (no webhook needed)
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
                title: "🎉 Payment Successful!",
                description: `₹${rechargeAmount} has been added to your wallet`,
                duration: 5000
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
              variant: "destructive",
              duration: 8000
            })
            onError?.(error.message)
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
        <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Wallet className="w-4 h-4 mr-2" />
          Add Money
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Add Money to Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enter Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-12 text-lg font-medium border-2 focus:border-blue-500 transition-colors"
                min="10"
                max="100000"
              />
            </div>
            <p className="text-xs text-gray-500">Minimum: ₹1 • Maximum: ₹1,00,000</p>
          </div>

          {/* Quick Select Amounts */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quick Select</label>
            <div className="grid grid-cols-3 gap-3">
              {predefinedAmounts.map((preAmount) => (
                <Button
                  key={preAmount}
                  variant={amount === preAmount.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(preAmount.toString())}
                  className="h-10 font-medium transition-all duration-200 hover:scale-105"
                >
                  ₹{preAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800 dark:text-gray-200">Secure Payment via Razorpay</span>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    UPI
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Cards
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Net Banking
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Wallets
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>✓ Instant credit to wallet</p>
                  <p>✓ Bank-grade security</p>
                  <p>✓ No hidden charges</p>
                </div>
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
              onClick={handleRecharge}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="flex-1 h-12 font-medium bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
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
