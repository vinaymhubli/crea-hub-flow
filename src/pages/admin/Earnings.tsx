import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  FileText, 
  Download,
  RefreshCw,
  PieChart,
  BarChart3,
  Receipt,
  Building2
} from 'lucide-react';

interface EarningsStats {
  total_earnings: number;
  platform_commission: number;
  tax_collected: number;
  tds_collected: number;
  net_earnings: number;
  total_transactions: number;
  average_earnings_per_transaction: number;
  daily_earnings: number;
  weekly_earnings: number;
  monthly_earnings: number;
  admin_rates: {
    gstRate: number;
    commissionRate: number;
    tdsRate: number;
  };
}

interface TransactionEarning {
  id: string;
  session_id: string;
  customer_name: string;
  designer_name: string;
  customer_amount: number;
  platform_commission: number;
  tax_amount: number;
  tds_amount: number;
  designer_earnings: number;
  created_at: string;
  status: string;
}

export default function Earnings() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [transactions, setTransactions] = useState<TransactionEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchEarningsData();
  }, [timeRange]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Fetching earnings data...');

      // Fetch all wallet transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      console.log('📊 Total transactions fetched:', transactions?.length || 0);

      // Fetch admin settings for dynamic rates
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['gst_rate', 'platform_fee_rate']);
      
      const { data: commissionSettings } = await supabase
        .from('commission_settings')
        .select('commission_type, commission_value')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const { data: tdsSettings } = await supabase
        .from('tds_settings')
        .select('tds_rate')
        .eq('is_active', true)
        .single();

      // Parse settings from key-value structure
      const gstSetting = platformSettings?.find(s => s.setting_key === 'gst_rate');
      const commissionSetting = platformSettings?.find(s => s.setting_key === 'platform_fee_rate');
      
      const gstRate = (gstSetting?.setting_value as any)?.value ? (gstSetting.setting_value as any).value / 100 : 0.18; // Convert percentage to decimal
      const commissionRate = (commissionSetting?.setting_value as any)?.value || commissionSettings?.[0]?.commission_value || 30; // Default 30%
      const tdsRate = tdsSettings?.tds_rate || 10; // Default 10%

      console.log('⚙️ Admin Settings:');
      console.log('- GST Rate:', gstRate * 100, '%');
      console.log('- Commission Rate:', commissionRate, '%');
      console.log('- TDS Rate:', tdsRate, '%');

      // Filter customer payments and designer earnings
      const customerPayments = transactions?.filter(t => 
        t.transaction_type === 'payment' && 
        t.status === 'completed' &&
        t.description?.includes('Session payment')
      ) || [];

      const designerEarnings = transactions?.filter(t => 
        t.transaction_type === 'deposit' && 
        t.status === 'completed' &&
        t.description?.includes('Session earnings')
      ) || [];

      // Fetch all profiles for name resolution
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email');

      // Fetch all designers for name resolution
      const { data: designers } = await supabase
        .from('designers')
        .select('id, user_id');

      // Fetch all active sessions for session-based name resolution
      const { data: activeSessions } = await supabase
        .from('active_sessions')
        .select('session_id, customer_id, designer_id');

      // Create lookup maps
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      const designerMap = new Map();
      designers?.forEach(designer => {
        designerMap.set(designer.id, designer);
      });

      const sessionMap = new Map();
      activeSessions?.forEach(session => {
        sessionMap.set(session.session_id, session);
        // Also map with live_ prefix
        sessionMap.set(`live_${session.session_id}`, session);
      });

      console.log('💰 Customer payments:', customerPayments.length);
      console.log('💵 Designer earnings:', designerEarnings.length);
      console.log('👥 Profiles loaded:', profiles?.length || 0);
      console.log('🎨 Designers loaded:', designers?.length || 0);
      console.log('📋 Active sessions loaded:', activeSessions?.length || 0);

      // Calculate earnings using transaction pairs
      let totalCommission = 0;
      let totalTDS = 0;
      let totalGST = 0;
      const transactionEarnings: TransactionEarning[] = [];

      // Match customer payments with designer earnings by timestamp
      customerPayments.forEach(customerPayment => {
        const paymentTime = new Date(customerPayment.created_at);
        const matchingEarning = designerEarnings.find(earning => {
          const earningTime = new Date(earning.created_at);
          const timeDiff = Math.abs(paymentTime.getTime() - earningTime.getTime());
          return timeDiff < 60000; // Within 1 minute
        });

        if (matchingEarning) {
          const customerAmount = parseFloat(customerPayment.amount.toString());
          const designerAmount = parseFloat(matchingEarning.amount.toString());

          // Calculate with dynamic rates
          const baseAmount = customerAmount / (1 + gstRate);
          const gstAmount = customerAmount - baseAmount;
          const commissionAmount = baseAmount * (commissionRate / 100);
          const tdsAmount = baseAmount * (tdsRate / 100);

          totalGST += gstAmount;
          totalCommission += commissionAmount;
          totalTDS += tdsAmount;

          // Get customer and designer names
          let customerId = (customerPayment.metadata as any)?.customer_id;
          let designerId = (customerPayment.metadata as any)?.designer_id;
          const sessionId = (customerPayment.metadata as any)?.session_id;
          
          let customerName = 'Unknown Customer';
          let designerName = 'Unknown Designer';
          
          // If we don't have customer/designer IDs from metadata, try to get them from session data
          if ((!customerId || !designerId) && sessionId) {
            const session = sessionMap.get(sessionId);
            if (session) {
              customerId = customerId || session.customer_id;
              designerId = designerId || session.designer_id;
            }
          }
          
          if (customerId) {
            const customerProfile = profileMap.get(customerId);
            if (customerProfile) {
              customerName = `${customerProfile.first_name || ''} ${customerProfile.last_name || ''}`.trim() || customerProfile.email || 'Unknown Customer';
            }
          }
          
          if (designerId) {
            console.log(`🔍 Looking for designer ID: ${designerId}`);
            // First, find the designer by ID in designers table
            const designer = designerMap.get(designerId);
            console.log(`🎨 Designer found in map:`, designer);
            
            if (designer && designer.user_id) {
              console.log(`👤 Designer user_id: ${designer.user_id}`);
              // Then, find the profile using the designer's user_id
              const designerProfile = profileMap.get(designer.user_id);
              console.log(`👥 Designer profile found:`, designerProfile);
              
              if (designerProfile) {
                designerName = `${designerProfile.first_name || ''} ${designerProfile.last_name || ''}`.trim() || designerProfile.email || 'Unknown Designer';
              }
            } else {
              console.log(`⚠️ Designer not found in designers table, trying direct profile lookup`);
              // If not found in designers table, try direct profile lookup (fallback)
              const designerProfile = profileMap.get(designerId);
              if (designerProfile) {
                designerName = `${designerProfile.first_name || ''} ${designerProfile.last_name || ''}`.trim() || designerProfile.email || 'Unknown Designer';
              }
            }
          }

          console.log(`🔍 Session ${sessionId}: Customer ${customerId} -> ${customerName}, Designer ${designerId} -> ${designerName}`);

          // Create transaction earning record
          transactionEarnings.push({
            id: customerPayment.id,
            session_id: (customerPayment.metadata as any)?.session_id || 'Unknown',
            customer_name: customerName,
            designer_name: designerName,
            customer_amount: customerAmount,
            platform_commission: commissionAmount,
            tax_amount: gstAmount,
            tds_amount: tdsAmount,
            designer_earnings: designerAmount,
            created_at: customerPayment.created_at,
            status: customerPayment.status
          });
        }
      });

      // Calculate time-based earnings
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const dailyEarnings = transactionEarnings
        .filter(t => new Date(t.created_at) >= today)
        .reduce((sum, t) => sum + t.platform_commission + t.tds_amount, 0);

      const weeklyEarnings = transactionEarnings
        .filter(t => new Date(t.created_at) >= weekAgo)
        .reduce((sum, t) => sum + t.platform_commission + t.tds_amount, 0);

      const monthlyEarnings = transactionEarnings
        .filter(t => new Date(t.created_at) >= monthAgo)
        .reduce((sum, t) => sum + t.platform_commission + t.tds_amount, 0);

      const totalEarnings = totalCommission + totalTDS;
      const netEarnings = totalEarnings - totalGST; // Net after tax

      const earningsStats: EarningsStats = {
        total_earnings: totalEarnings,
        platform_commission: totalCommission,
        tax_collected: totalGST,
        tds_collected: totalTDS,
        net_earnings: netEarnings,
        total_transactions: transactionEarnings.length,
        average_earnings_per_transaction: transactionEarnings.length > 0 ? totalEarnings / transactionEarnings.length : 0,
        daily_earnings: dailyEarnings,
        weekly_earnings: weeklyEarnings,
        monthly_earnings: monthlyEarnings,
        admin_rates: {
          gstRate: gstRate,
          commissionRate: commissionRate,
          tdsRate: tdsRate
        }
      };

      console.log('📈 Earnings Stats:', earningsStats);
      setStats(earningsStats);
      setTransactions(transactionEarnings);

    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportEarningsReport = () => {
    if (!transactions.length) return;

    const csvContent = [
      ['Session ID', 'Customer', 'Designer', 'Customer Amount', 'Commission', 'Tax', 'TDS', 'Designer Earnings', 'Date'],
      ...transactions.map(t => [
        t.session_id,
        t.customer_name,
        t.designer_name,
        `₹${t.customer_amount.toFixed(2)}`,
        `₹${t.platform_commission.toFixed(2)}`,
        `₹${t.tax_amount.toFixed(2)}`,
        `₹${t.tds_amount.toFixed(2)}`,
        `₹${t.designer_earnings.toFixed(2)}`,
        new Date(t.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading earnings data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
          <p className="text-muted-foreground">
            Track platform earnings, tax collections, and TDS deductions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchEarningsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportEarningsReport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Earnings Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Platform Earnings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete breakdown of platform revenue and deductions
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Total Earnings</div>
              <div className="text-3xl font-bold text-green-600">₹{(stats?.total_earnings || 0).toFixed(2)}</div>
              <div className="text-xs text-gray-500">Platform + TDS</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">TDS Collected</div>
              <div className="text-3xl font-bold text-orange-600">₹{(stats?.tds_collected || 0).toFixed(2)}</div>
              <div className="text-xs text-gray-500">Tax Deducted at Source</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Tax Collected</div>
              <div className="text-3xl font-bold text-red-600">₹{(stats?.tax_collected || 0).toFixed(2)}</div>
              <div className="text-xs text-gray-500">GST (Government)</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Platform Earnings</div>
              <div className="text-3xl font-bold text-blue-600">₹{(stats?.platform_commission || 0).toFixed(2)}</div>
              <div className="text-xs text-gray-500">From session payments</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Total Transactions</div>
              <div className="text-3xl font-bold text-indigo-600">{stats?.total_transactions || 0}</div>
              <div className="text-xs text-gray-500">Session payments processed</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>Current Admin Rates:</strong> 
              GST: {(stats?.admin_rates.gstRate * 100).toFixed(1)}% | 
              Commission: {stats?.admin_rates.commissionRate}% | 
              TDS: {stats?.admin_rates.tdsRate}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time-based Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daily Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats?.daily_earnings || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Weekly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats?.weekly_earnings || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Monthly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats?.monthly_earnings || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Transaction Breakdown */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transaction Details</TabsTrigger>
          <TabsTrigger value="summary">Earnings Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Transaction Earnings ({transactions.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed breakdown of earnings from each session payment
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transaction earnings found
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Session: {transaction.session_id}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.customer_name} → {transaction.designer_name}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Customer Paid</div>
                          <div className="font-medium">₹{transaction.customer_amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Commission</div>
                          <div className="font-medium text-blue-600">₹{transaction.platform_commission.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Tax (GST)</div>
                          <div className="font-medium text-red-600">₹{transaction.tax_amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">TDS</div>
                          <div className="font-medium text-orange-600">₹{transaction.tds_amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Designer Got</div>
                          <div className="font-medium text-green-600">₹{transaction.designer_earnings.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Earnings Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Average Earnings per Transaction</div>
                    <div className="text-2xl font-bold">₹{stats?.average_earnings_per_transaction.toFixed(2) || 0}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Commission Rate</div>
                    <div className="text-2xl font-bold">{stats?.admin_rates.commissionRate}%</div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Earnings Formula:</strong> 
                    Customer Payment = GST + Commission + TDS + Designer Earnings
                    <br />
                    <strong>Platform Revenue:</strong> Commission + TDS = ₹{((stats?.platform_commission || 0) + (stats?.tds_collected || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
