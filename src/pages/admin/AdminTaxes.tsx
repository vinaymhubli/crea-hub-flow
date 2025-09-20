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
import { Calculator, Plus, Edit, Trash2, MapPin, Percent } from 'lucide-react';

interface TaxSetting {
  id: string;
  state_code: string;
  state_name: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminTaxes = () => {
  const { toast } = useToast();
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);
  
  const [formData, setFormData] = useState({
    state_code: '',
    state_name: '',
    cgst_rate: 9,
    sgst_rate: 9,
    igst_rate: 18,
    is_active: true
  });

  // Indian states data
  const indianStates = [
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' },
    { code: 'CT', name: 'Chhattisgarh' },
    { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'HR', name: 'Haryana' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JK', name: 'Jammu and Kashmir' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'KL', name: 'Kerala' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'MN', name: 'Manipur' },
    { code: 'ML', name: 'Meghalaya' },
    { code: 'MZ', name: 'Mizoram' },
    { code: 'NL', name: 'Nagaland' },
    { code: 'OR', name: 'Odisha' },
    { code: 'PB', name: 'Punjab' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'TG', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'UT', name: 'Uttarakhand' },
    { code: 'WB', name: 'West Bengal' },
    { code: 'AN', name: 'Andaman and Nicobar Islands' },
    { code: 'CH', name: 'Chandigarh' },
    { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
    { code: 'DL', name: 'Delhi' },
    { code: 'LD', name: 'Lakshadweep' },
    { code: 'PY', name: 'Puducherry' }
  ];

  useEffect(() => {
    fetchTaxSettings();
  }, []);

  const fetchTaxSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .order('state_name', { ascending: true });

      if (error) throw error;
      setTaxSettings(data || []);
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tax settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all states are configured and trying to create new
    if (!editingTax && getAvailableStates().length === 0) {
      toast({
        title: "All States Configured",
        description: "All states already have tax settings. Please edit existing settings instead.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (editingTax) {
        // Update existing tax setting
        const { error } = await supabase
          .from('invoice_settings')
          .update(formData)
          .eq('id', editingTax.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tax setting updated successfully"
        });
      } else {
        // Create new tax setting
        const { error } = await supabase
          .from('invoice_settings')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tax setting created successfully"
        });
      }

      resetForm();
      setShowDialog(false);
      fetchTaxSettings();
    } catch (error) {
      console.error('Error saving tax setting:', error);
      toast({
        title: "Error",
        description: "Failed to save tax setting",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (tax: TaxSetting) => {
    setEditingTax(tax);
    setFormData({
      state_code: tax.state_code,
      state_name: tax.state_name,
      cgst_rate: tax.cgst_rate,
      sgst_rate: tax.sgst_rate,
      igst_rate: tax.igst_rate,
      is_active: tax.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax setting?')) return;

    try {
      const { error } = await supabase
        .from('invoice_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tax setting deleted successfully"
      });

      fetchTaxSettings();
    } catch (error) {
      console.error('Error deleting tax setting:', error);
      toast({
        title: "Error",
        description: "Failed to delete tax setting",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('invoice_settings')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tax setting ${!isActive ? 'activated' : 'deactivated'}`
      });

      fetchTaxSettings();
    } catch (error) {
      console.error('Error updating tax setting:', error);
      toast({
        title: "Error",
        description: "Failed to update tax setting",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      state_code: '',
      state_name: '',
      cgst_rate: 9,
      sgst_rate: 9,
      igst_rate: 18,
      is_active: true
    });
    setEditingTax(null);
  };

  const handleStateChange = (stateCode: string) => {
    const state = indianStates.find(s => s.code === stateCode);
    if (state) {
      setFormData({
        ...formData,
        state_code: state.code,
        state_name: state.name
      });
    }
  };

  // Filter out states that already have tax settings
  const getAvailableStates = () => {
    const configuredStates = taxSettings.map(tax => tax.state_code);
    return indianStates.filter(state => !configuredStates.includes(state.code));
  };

  const calculateTotalGST = (cgst: number, sgst: number, igst: number) => {
    return cgst + sgst + igst;
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
          <h1 className="text-3xl font-bold">Tax Management</h1>
          <p className="text-gray-600">Set and manage GST rates by state for invoice generation</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              disabled={getAvailableStates().length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              {getAvailableStates().length === 0 ? 'All States Configured' : 'New Tax Setting'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTax ? 'Edit Tax Setting' : 'Create Tax Setting'}
              </DialogTitle>
              <DialogDescription>
                {editingTax ? 'Update the tax rates for this state' : 'Set GST rates for a specific state'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="state">State</Label>
                {getAvailableStates().length === 0 ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ All states have been configured with tax settings!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      You can edit existing settings or create new ones by modifying the state selection.
                    </p>
                  </div>
                ) : (
                  <Select 
                    value={formData.state_code} 
                    onValueChange={handleStateChange}
                    disabled={!!editingTax}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStates().map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cgst_rate">CGST Rate (%)</Label>
                  <Input
                    id="cgst_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.cgst_rate}
                    onChange={(e) => setFormData({...formData, cgst_rate: parseFloat(e.target.value) || 0})}
                    placeholder="9"
                  />
                </div>
                <div>
                  <Label htmlFor="sgst_rate">SGST Rate (%)</Label>
                  <Input
                    id="sgst_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.sgst_rate}
                    onChange={(e) => setFormData({...formData, sgst_rate: parseFloat(e.target.value) || 0})}
                    placeholder="9"
                  />
                </div>
                <div>
                  <Label htmlFor="igst_rate">IGST Rate (%)</Label>
                  <Input
                    id="igst_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.igst_rate}
                    onChange={(e) => setFormData({...formData, igst_rate: parseFloat(e.target.value) || 0})}
                    placeholder="18"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total GST Rate</span>
                </div>
                <div className="text-lg font-bold text-blue-900">
                  {calculateTotalGST(formData.cgst_rate, formData.sgst_rate, formData.igst_rate)}%
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  CGST: {formData.cgst_rate}% + SGST: {formData.sgst_rate}% + IGST: {formData.igst_rate}%
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTax ? 'Update Setting' : 'Create Setting'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tax Settings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total States</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {taxSettings.length}
            </div>
            <p className="text-xs text-gray-600">States configured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active States</CardTitle>
            <Percent className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {taxSettings.filter(t => t.is_active).length}
            </div>
            <p className="text-xs text-gray-600">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average GST</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {taxSettings.length > 0 
                ? (taxSettings.reduce((sum, tax) => sum + calculateTotalGST(tax.cgst_rate, tax.sgst_rate, tax.igst_rate), 0) / taxSettings.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-gray-600">Across all states</p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Settings by State ({taxSettings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {taxSettings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tax settings configured</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowDialog(true)}
                disabled={getAvailableStates().length === 0}
              >
                {getAvailableStates().length === 0 ? 'All States Configured' : 'Create First Setting'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>CGST %</TableHead>
                    <TableHead>SGST %</TableHead>
                    <TableHead>IGST %</TableHead>
                    <TableHead>Total GST</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxSettings.map((tax) => (
                    <TableRow key={tax.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{tax.state_name}</div>
                            <div className="text-sm text-gray-500">({tax.state_code})</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{tax.cgst_rate}%</TableCell>
                      <TableCell className="font-medium">{tax.sgst_rate}%</TableCell>
                      <TableCell className="font-medium">{tax.igst_rate}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-blue-600">
                            {calculateTotalGST(tax.cgst_rate, tax.sgst_rate, tax.igst_rate)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(tax.id, tax.is_active)}
                        >
                          <Badge variant={tax.is_active ? 'default' : 'secondary'}>
                            {tax.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(tax.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tax)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tax.id)}
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

      {/* How Tax System Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Tax System Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</div>
              <div>
                <p className="font-medium">CGST (Central GST)</p>
                <p className="text-gray-600">Tax collected by Central Government for intra-state transactions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
              <div>
                <p className="font-medium">SGST (State GST)</p>
                <p className="text-gray-600">Tax collected by State Government for intra-state transactions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
              <div>
                <p className="font-medium">IGST (Integrated GST)</p>
                <p className="text-gray-600">Tax collected by Central Government for inter-state transactions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</div>
              <div>
                <p className="font-medium">Invoice Generation</p>
                <p className="text-gray-600">Tax rates are automatically applied based on customer's state when generating invoices</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTaxes;
