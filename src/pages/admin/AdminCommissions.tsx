import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Percent, Plus, Edit, Trash2, TrendingUp } from 'lucide-react';

interface CommissionSetting {
  id: string;
  commission_type: 'fixed' | 'percentage';
  commission_value: number;
  min_transaction_amount: number;
  max_transaction_amount: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminEarnings {
  total_commission_earned: number;
  total_transactions: number;
  average_commission: number;
}

const AdminCommissions = () => {
  const { toast } = useToast();
  const [commissionSettings, setCommissionSettings] = useState<CommissionSetting[]>([]);
  const [adminEarnings, setAdminEarnings] = useState<AdminEarnings>({
    total_commission_earned: 0,
    total_transactions: 0,
    average_commission: 0
  });
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSetting, setEditingSetting] = useState<CommissionSetting | null>(null);
  
  const [formData, setFormData] = useState({
    commission_type: 'percentage' as 'fixed' | 'percentage',
    commission_value: 10,
    min_transaction_amount: 0,
    max_transaction_amount: '',
    is_active: true
  });

  useEffect(() => {
    fetchCommissionSettings();
    fetchAdminEarnings();
  }, []);

  const fetchCommissionSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissionSettings(data || []);
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch commission settings",
        variant: "destructive"
      });
    }
  };

  const fetchAdminEarnings = async () => {
    try {
      // Get total commission earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('admin_earnings')
        .select('commission_amount');

      if (earningsError) throw earningsError;

      const totalCommission = earningsData?.reduce((sum, earning) => sum + parseFloat(earning.commission_amount.toString()), 0) || 0;
      const totalTransactions = earningsData?.length || 0;
      const averageCommission = totalTransactions > 0 ? totalCommission / totalTransactions : 0;

      setAdminEarnings({
        total_commission_earned: totalCommission,
        total_transactions: totalTransactions,
        average_commission: averageCommission
      });
    } catch (error) {
      console.error('Error fetching admin earnings:', error);
      // Use fallback data if query fails
      setAdminEarnings({
        total_commission_earned: 0,
        total_transactions: 0,
        average_commission: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        commission_type: formData.commission_type,
        commission_value: formData.commission_value,
        min_transaction_amount: formData.min_transaction_amount,
        max_transaction_amount: formData.max_transaction_amount ? parseFloat(formData.max_transaction_amount) : null,
        is_active: formData.is_active
      };

      if (editingSetting) {
        // Update existing setting
        const { error } = await supabase
          .from('commission_settings')
          .update(submitData)
          .eq('id', editingSetting.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Commission setting updated successfully"
        });
      } else {
        // Create new setting
        const { error } = await supabase
          .from('commission_settings')
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Commission setting created successfully"
        });
      }

      resetForm();
      setShowDialog(false);
      fetchCommissionSettings();
    } catch (error) {
      console.error('Error saving commission setting:', error);
      toast({
        title: "Error",
        description: "Failed to save commission setting",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (setting: CommissionSetting) => {
    setEditingSetting(setting);
    setFormData({
      commission_type: setting.commission_type,
      commission_value: setting.commission_value,
      min_transaction_amount: setting.min_transaction_amount,
      max_transaction_amount: setting.max_transaction_amount?.toString() || '',
      is_active: setting.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commission setting?')) return;

    try {
      const { error } = await supabase
        .from('commission_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission setting deleted successfully"
      });

      fetchCommissionSettings();
    } catch (error) {
      console.error('Error deleting commission setting:', error);
      toast({
        title: "Error",
        description: "Failed to delete commission setting",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('commission_settings')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Commission setting ${!isActive ? 'activated' : 'deactivated'}`
      });

      fetchCommissionSettings();
    } catch (error) {
      console.error('Error updating commission setting:', error);
      toast({
        title: "Error",
        description: "Failed to update commission setting",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      commission_type: 'percentage',
      commission_value: 10,
      min_transaction_amount: 0,
      max_transaction_amount: '',
      is_active: true
    });
    setEditingSetting(null);
  };

  const formatCommissionValue = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : `₹${value}`;
  };

  const formatAmount = (amount: number | null) => {
    return amount ? `₹${amount.toLocaleString()}` : 'No limit';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commission Management</h1>
          <p className="text-gray-600">Set and manage commission rates for wallet transactions</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Commission Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSetting ? 'Edit Commission Rule' : 'Create Commission Rule'}
              </DialogTitle>
              <DialogDescription>
                {editingSetting ? 'Update the commission rule settings' : 'Create a new commission rule for wallet transactions'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="commission_type">Commission Type</Label>
                <Select 
                  value={formData.commission_type} 
                  onValueChange={(value: 'fixed' | 'percentage') => 
                    setFormData({...formData, commission_type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Percentage
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Fixed Amount
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="commission_value">
                  {formData.commission_type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
                </Label>
                <Input
                  id="commission_value"
                  type="number"
                  min="0"
                  step={formData.commission_type === 'percentage' ? '0.1' : '1'}
                  max={formData.commission_type === 'percentage' ? '100' : undefined}
                  value={formData.commission_value}
                  onChange={(e) => setFormData({...formData, commission_value: parseFloat(e.target.value) || 0})}
                  placeholder={formData.commission_type === 'percentage' ? '10' : '50'}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_amount">Min Transaction Amount (₹)</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    min="0"
                    value={formData.min_transaction_amount}
                    onChange={(e) => setFormData({...formData, min_transaction_amount: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="max_amount">Max Transaction Amount (₹)</Label>
                  <Input
                    id="max_amount"
                    type="number"
                    min="0"
                    value={formData.max_transaction_amount}
                    onChange={(e) => setFormData({...formData, max_transaction_amount: e.target.value})}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSetting ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Earnings Overview */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{adminEarnings.total_commission_earned.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {adminEarnings.total_transactions.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">Commission transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Commission</CardTitle>
            <Percent className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₹{adminEarnings.average_commission.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">Per transaction</p>
          </CardContent>
        </Card>
      </div> */}

      {/* Commission Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Rules ({commissionSettings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {commissionSettings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No commission rules configured</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowDialog(true)}
              >
                Create First Rule
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Transaction Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionSettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {setting.commission_type === 'percentage' ? (
                            <Percent className="w-4 h-4 text-blue-600" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-green-600" />
                          )}
                          <span className="capitalize">{setting.commission_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCommissionValue(setting.commission_type, setting.commission_value)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Min: {formatAmount(setting.min_transaction_amount)}</div>
                          <div className="text-gray-500">Max: {formatAmount(setting.max_transaction_amount)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(setting.id, setting.is_active)}
                        >
                          <Badge variant={setting.is_active ? 'default' : 'secondary'}>
                            {setting.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(setting.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(setting)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(setting.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Commission Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</div>
              <div>
                <p className="font-medium">Customer makes session payment (e.g., ₹100)</p>
                <p className="text-gray-600">Customer transfers money to designer for completed work</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
              <div>
                <p className="font-medium">Admin commission is deducted first</p>
                <p className="text-gray-600">Based on your active commission rules (fixed amount or percentage)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
              <div>
                <p className="font-medium">Remaining amount goes to designer</p>
                <p className="text-gray-600">Designer receives the payment minus commission in their wallet</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</div>
              <div>
                <p className="font-medium">Commission is added to admin earnings</p>
                <p className="text-gray-600">Track all commission earnings in the overview above</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCommissions;
