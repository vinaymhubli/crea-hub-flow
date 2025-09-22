import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Smartphone,
  Mail,
  CreditCard,
  Shield,
  Timer
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
  verified_at?: string;
  verification_method?: string;
}

interface BankAccountVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount: BankAccount | null;
  onVerified?: (account: BankAccount) => void;
}

const VERIFICATION_METHODS = {
  sms: {
    name: 'SMS Verification',
    icon: Smartphone,
    description: 'Receive OTP on your registered mobile number',
    color: 'bg-blue-50 border-blue-200 text-blue-900',
    iconColor: 'text-blue-600'
  },
  email: {
    name: 'Email Verification',
    icon: Mail,
    description: 'Receive OTP on your registered email address',
    color: 'bg-green-50 border-green-200 text-green-900',
    iconColor: 'text-green-600'
  },
  bank_api: {
    name: 'Automatic Verification',
    icon: Shield,
    description: 'Verify using bank API (instant)',
    color: 'bg-purple-50 border-purple-200 text-purple-900',
    iconColor: 'text-purple-600'
  },
  micro_deposit: {
    name: 'Micro Deposit',
    icon: CreditCard,
    description: 'Small amount deposited to your account',
    color: 'bg-orange-50 border-orange-200 text-orange-900',
    iconColor: 'text-orange-600'
  }
};

export function BankAccountVerification({ 
  open, 
  onOpenChange, 
  bankAccount, 
  onVerified 
}: BankAccountVerificationProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const { user } = useAuth();

  useEffect(() => {
    if (open && bankAccount) {
      setOtpSent(false);
      setOtp('');
      setTimeLeft(0);
      setAttemptsLeft(3);
    }
  }, [open, bankAccount]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleSendOTP = async () => {
    if (!bankAccount || !selectedMethod) {
      toast.error('Please select a verification method');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to verify account');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-bank-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'send_otp',
          bankAccountId: bankAccount.id,
          verificationMethod: selectedMethod
        })
      });

      const result = await response.json();

      if (result.success) {
        setOtpSent(true);
        setTimeLeft(result.expiresIn || 600); // 10 minutes default
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!bankAccount || !otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to verify account');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-bank-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'verify_otp',
          bankAccountId: bankAccount.id,
          otp: otp
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Bank account verified successfully!');
        onVerified?.(bankAccount);
        onOpenChange(false);
      } else {
        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
        toast.error(result.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoVerify = async () => {
    if (!bankAccount) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to verify account');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-bank-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'auto_verify',
          bankAccountId: bankAccount.id
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Bank account verified automatically!');
        onVerified?.(bankAccount);
        onOpenChange(false);
      } else {
        toast.error(result.message || 'Automatic verification failed');
      }
    } catch (error) {
      console.error('Error in auto verification:', error);
      toast.error('Automatic verification failed. Please try OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!bankAccount) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            Verify Bank Account
          </DialogTitle>
          <DialogDescription>
            Verify your {bankAccount.bank_name} account to enable withdrawals
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Bank Account Details */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">{bankAccount.bank_name}</p>
                  <p className="text-sm text-blue-700">
                    {bankAccount.account_holder_name} • ****{bankAccount.account_number.slice(-4)}
                  </p>
                  <p className="text-xs text-blue-600">{bankAccount.ifsc_code}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Methods */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Choose Verification Method</Label>
            
            <Tabs defaultValue="otp" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="otp">OTP Verification</TabsTrigger>
                <TabsTrigger value="auto">Auto Verification</TabsTrigger>
              </TabsList>
              
              <TabsContent value="otp" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(VERIFICATION_METHODS).filter(([key]) => key !== 'micro_deposit').map(([key, method]) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === key;
                    
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedMethod(key)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                isSelected ? 'text-blue-600' : method.iconColor
                              }`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{method.name}</h3>
                              <p className="text-xs text-muted-foreground">{method.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {selectedMethod && (
                  <div className="space-y-4">
                    {!otpSent ? (
                      <Button 
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4 mr-2" />
                            Send OTP
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-green-800 font-medium">OTP Sent Successfully!</p>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            Please check your {selectedMethod === 'sms' ? 'mobile' : 'email'} for the verification code.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="otp">Enter OTP</Label>
                          <Input
                            id="otp"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="text-center text-lg tracking-widest"
                            maxLength={6}
                          />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Attempts left: {attemptsLeft}
                            </span>
                            {timeLeft > 0 && (
                              <span className="text-orange-600 flex items-center">
                                <Timer className="w-4 h-4 mr-1" />
                                {formatTime(timeLeft)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setOtpSent(false);
                              setOtp('');
                              setTimeLeft(0);
                            }}
                            className="flex-1"
                          >
                            Resend OTP
                          </Button>
                          <Button 
                            onClick={handleVerifyOTP}
                            disabled={loading || !otp || otp.length !== 6 || timeLeft === 0}
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
                                Verify
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="auto" className="space-y-4">
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900">Automatic Verification</h4>
                        <p className="text-sm text-purple-800 mt-1">
                          We'll verify your account details using bank APIs. This is instant and secure.
                        </p>
                        <ul className="text-xs text-purple-700 mt-2 space-y-1">
                          <li>• Validates account number and IFSC code</li>
                          <li>• Checks account holder name</li>
                          <li>• Instant verification result</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleAutoVerify}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Automatically
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Security Notice */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Security Notice</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Bank account verification is required for security purposes. We use industry-standard 
                    encryption and never store your full account details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}



