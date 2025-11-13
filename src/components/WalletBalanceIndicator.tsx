import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Plus,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { UniversalPaymentModal } from './UniversalPaymentModal';
import { WithdrawalModal } from './WithdrawalModal';

interface WalletBalanceIndicatorProps {
  className?: string;
  showActions?: boolean;
}

export function WalletBalanceIndicator({ className = '', showActions = true }: WalletBalanceIndicatorProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const { user, profile } = useAuth();
  const { balance, loading, refresh } = useWallet();

  // Determine if user is customer or designer
  const isDesigner = profile?.user_type === 'designer';
  const isCustomer = profile?.user_type === 'customer';

  // Get earnings for designers
  const [earnings, setEarnings] = useState(0);
  const [earningsLoading, setEarningsLoading] = useState(false);

  useEffect(() => {
    if (isDesigner && user) {
      fetchDesignerEarnings();
    }
  }, [isDesigner, user]);

  const fetchDesignerEarnings = async () => {
    try {
      setEarningsLoading(true);
      const { data, error } = await (supabase as any).rpc('get_total_earnings', { designer_user_id: user?.id });
      if (error) throw error;
      setEarnings(Number(data) || 0);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setEarningsLoading(false);
    }
  };

  if (!user || (!isCustomer && !isDesigner)) {
    return null;
  }

  const handleRefresh = async () => {
    await refresh();
    if (isDesigner) {
      await fetchDesignerEarnings();
    }
  };

  return (
    <>
      <Card className={`bg-gradient-to-r from-green-50 to-teal-50 border-green-200 hover:shadow-md transition-all duration-300 ${className}`}>
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Wallet className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <p className="text-xs font-medium text-green-800 whitespace-nowrap">
                    {isDesigner ? 'Earnings' : 'Wallet'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-3 w-3 p-0 hover:bg-green-100 flex-shrink-0"
                  >
                    {showBalance ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                  </Button>
                </div>
                <div className="flex items-center space-x-1.5">
                  {loading || earningsLoading ? (
                    <div className="flex items-center space-x-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-green-600" />
                      <span className="text-xs text-green-600">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-green-900 whitespace-nowrap">
                        {showBalance ? `₹${(isDesigner ? earnings : balance).toFixed(2)}` : '••••••'}
                      </p>
                      {isDesigner && (
                        <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 h-4 flex items-center">
                          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                          <span className="leading-none">Earnings</span>
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {showActions && (
              <div className="flex items-center space-x-1">
                {isCustomer && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPaymentModal(true)}
                      className="h-7 px-2 text-xs border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowWithdrawalModal(true)}
                      className="h-7 px-2 text-xs border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      Withdraw
                    </Button>
                  </>
                )}
                {isDesigner && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowWithdrawalModal(true)}
                    className="h-7 px-2 text-xs border-green-300 text-green-700 hover:bg-green-100"
                    disabled={earnings <= 0}
                  >
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    Withdraw
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-7 w-7 p-0 hover:bg-green-100"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {isCustomer && (
        <>
          <UniversalPaymentModal
            open={showPaymentModal}
            onOpenChange={setShowPaymentModal}
            onSuccess={() => {
              refresh();
              setShowPaymentModal(false);
            }}
          />
          
          <WithdrawalModal
            open={showWithdrawalModal}
            onOpenChange={setShowWithdrawalModal}
            onSuccess={() => {
              refresh();
              setShowWithdrawalModal(false);
            }}
          />
        </>
      )}

      {isDesigner && (
        <WithdrawalModal
          open={showWithdrawalModal}
          onOpenChange={setShowWithdrawalModal}
          onSuccess={() => {
            refresh();
            fetchDesignerEarnings();
            setShowWithdrawalModal(false);
          }}
          userType="designer"
        />
      )}
    </>
  );
}
