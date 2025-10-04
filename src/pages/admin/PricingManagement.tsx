import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Save, Eye, Edit, Plus, Trash2, ArrowUp, ArrowDown, 
  DollarSign, Users, Star, Zap, CheckCircle, XCircle 
} from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  button_text: string;
  button_url: string;
  is_popular: boolean;
  is_published: boolean;
  sort_order: number;
  plan_type: 'customer' | 'designer';
  created_at: string;
  updated_at: string;
}

interface DesignerPricing {
  id: string;
  title: string;
  description: string;
  platform_fee_percentage: number;
  features: string[];
  button_text: string;
  button_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function PricingManagement() {
  const { user } = useAuth();
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [designerPricing, setDesignerPricing] = useState<DesignerPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showDesignerDialog, setShowDesignerDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [editingDesigner, setEditingDesigner] = useState<DesignerPricing | null>(null);
  const [activeTab, setActiveTab] = useState('customer');
  const { toast } = useToast();

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pricing plans
      const { data: plansData, error: plansError } = await supabase
        .from('pricing_plans' as any)
        .select('*')
        .order('sort_order', { ascending: true });

      if (plansError) throw plansError;

      // Fetch designer pricing
      const { data: designerData, error: designerError } = await supabase
        .from('designer_pricing' as any)
        .select('*')
        .order('sort_order', { ascending: true });

      if (designerError) throw designerError;

      setPricingPlans(plansData || []);
      setDesignerPricing(designerData || []);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pricing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (planData: Partial<PricingPlan>) => {
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('pricing_plans' as any)
          .update({
            ...planData,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast({ title: "Success", description: "Pricing plan updated successfully" });
      } else {
        const { error } = await supabase
          .from('pricing_plans' as any)
          .insert({
            ...planData,
            created_by: user.id,
            updated_by: user.id
          });

        if (error) throw error;
        toast({ title: "Success", description: "Pricing plan created successfully" });
      }

      setShowPlanDialog(false);
      setEditingPlan(null);
      fetchData();
    } catch (error) {
      console.error('Error saving pricing plan:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing plan",
        variant: "destructive"
      });
    }
  };

  const handleSaveDesigner = async (designerData: Partial<DesignerPricing>) => {
    try {
      if (editingDesigner) {
        const { error } = await supabase
          .from('designer_pricing' as any)
          .update({
            ...designerData,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', editingDesigner.id);

        if (error) throw error;
        toast({ title: "Success", description: "Designer pricing updated successfully" });
      } else {
        const { error } = await supabase
          .from('designer_pricing' as any)
          .insert({
            ...designerData,
            created_by: user.id,
            updated_by: user.id
          });

        if (error) throw error;
        toast({ title: "Success", description: "Designer pricing created successfully" });
      }

      setShowDesignerDialog(false);
      setEditingDesigner(null);
      fetchData();
    } catch (error) {
      console.error('Error saving designer pricing:', error);
      toast({
        title: "Error",
        description: "Failed to save designer pricing",
        variant: "destructive"
      });
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pricing_plans' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Pricing plan deleted successfully" });
      fetchData();
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete pricing plan",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDesigner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('designer_pricing' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Designer pricing deleted successfully" });
      fetchData();
    } catch (error) {
      console.error('Error deleting designer pricing:', error);
      toast({
        title: "Error",
        description: "Failed to delete designer pricing",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublish = async (id: string, table: 'pricing_plans' | 'designer_pricing', currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from(table as any)
        .update({ 
          is_published: !currentStatus,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Item ${!currentStatus ? 'published' : 'unpublished'} successfully` 
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: "Error",
        description: "Failed to update publish status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading pricing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Management</h1>
          <p className="text-gray-600">Manage pricing plans and designer pricing for your platform</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer">Customer Plans</TabsTrigger>
            <TabsTrigger value="designer">Designer Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Customer Pricing Plans</h2>
              <Button onClick={() => {
                setEditingPlan(null);
                setShowPlanDialog(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
            </div>

            <div className="grid gap-6">
              {pricingPlans.map((plan) => (
                <Card key={plan.id} className={`${plan.is_popular ? 'border-primary shadow-lg' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {plan.is_popular && (
                            <Badge variant="default">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                          {!plan.is_published && (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="mt-2">
                          <span className="text-2xl font-bold">{plan.price}</span>
                          {plan.period && <span className="text-gray-500">{plan.period}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(plan.id, 'pricing_plans', plan.is_published)}
                        >
                          {plan.is_published ? <Eye className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPlan(plan);
                            setShowPlanDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Features:</h4>
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Button: "{plan.button_text}" → {plan.button_url}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="designer" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Designer Pricing</h2>
              <Button onClick={() => {
                setEditingDesigner(null);
                setShowDesignerDialog(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Pricing
              </Button>
            </div>

            <div className="grid gap-6">
              {designerPricing.map((pricing) => (
                <Card key={pricing.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {pricing.title}
                          {!pricing.is_published && (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{pricing.description}</CardDescription>
                        <div className="mt-2">
                          <span className="text-2xl font-bold">{pricing.platform_fee_percentage}%</span>
                          <span className="text-gray-500"> platform fee</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(pricing.id, 'designer_pricing', pricing.is_published)}
                        >
                          {pricing.is_published ? <Eye className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingDesigner(pricing);
                            setShowDesignerDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDesigner(pricing.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Features:</h4>
                      <ul className="space-y-1">
                        {pricing.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Button: "{pricing.button_text}" → {pricing.button_url}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Plan Dialog */}
        {showPlanDialog && (
          <PlanDialog
            plan={editingPlan}
            onSave={handleSavePlan}
            onClose={() => {
              setShowPlanDialog(false);
              setEditingPlan(null);
            }}
          />
        )}

        {/* Designer Dialog */}
        {showDesignerDialog && (
          <DesignerDialog
            pricing={editingDesigner}
            onSave={handleSaveDesigner}
            onClose={() => {
              setShowDesignerDialog(false);
              setEditingDesigner(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Plan Dialog Component
function PlanDialog({ plan, onSave, onClose }: {
  plan: PricingPlan | null;
  onSave: (data: Partial<PricingPlan>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || '',
    period: plan?.period || '',
    description: plan?.description || '',
    features: plan?.features || [],
    button_text: plan?.button_text || 'Get Started',
    button_url: plan?.button_url || '/auth',
    is_popular: plan?.is_popular || false,
    is_published: plan?.is_published || true,
    plan_type: plan?.plan_type || 'customer' as 'customer' | 'designer'
  });

  const [newFeature, setNewFeature] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{plan ? 'Edit Plan' : 'Add New Plan'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Free, ₹29, Custom"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="period">Period (optional)</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="/month, /year"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Features</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1">{feature}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add new feature"
                  />
                  <Button type="button" onClick={addFeature}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="button_text">Button Text</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="button_url">Button URL</Label>
                <Input
                  id="button_url"
                  value={formData.button_url}
                  onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
                <Label htmlFor="is_popular">Popular Plan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Designer Dialog Component
function DesignerDialog({ pricing, onSave, onClose }: {
  pricing: DesignerPricing | null;
  onSave: (data: Partial<DesignerPricing>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: pricing?.title || '',
    description: pricing?.description || '',
    platform_fee_percentage: pricing?.platform_fee_percentage || 5.00,
    features: pricing?.features || [],
    button_text: pricing?.button_text || 'Join as Designer',
    button_url: pricing?.button_url || '/auth',
    is_published: pricing?.is_published || true
  });

  const [newFeature, setNewFeature] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{pricing ? 'Edit Designer Pricing' : 'Add Designer Pricing'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="platform_fee">Platform Fee Percentage</Label>
              <Input
                id="platform_fee"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.platform_fee_percentage}
                onChange={(e) => setFormData({ ...formData, platform_fee_percentage: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div>
              <Label>Features</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1">{feature}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add new feature"
                  />
                  <Button type="button" onClick={addFeature}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="button_text">Button Text</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="button_url">Button URL</Label>
                <Input
                  id="button_url"
                  value={formData.button_url}
                  onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
              <Label htmlFor="is_published">Published</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
