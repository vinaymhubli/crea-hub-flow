import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Promotion {
  id: string;
  title: string;
  description?: string;
  promotion_type: string;
  discount_type?: string;
  discount_value?: number;
  discount_code?: string;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  target_audience: string;
  display_location: string[];
  priority: number;
  banner_image_url?: string;
  banner_text_color: string;
  banner_background_color: string;
  cta_text: string;
  cta_url?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export function PromotionsManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promotion_type: 'announcement',
    discount_type: '',
    discount_value: '',
    discount_code: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    target_audience: 'all',
    display_location: ['homepage'],
    priority: 1,
    banner_image_url: '',
    banner_text_color: '#000000',
    banner_background_color: '#ffffff',
    cta_text: 'Learn More',
    cta_url: '',
    admin_notes: ''
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions((data || []) as Promotion[]);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const createPromotion = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc('create_promotion', {
        p_title: formData.title,
        p_description: formData.description || null,
        p_promotion_type: formData.promotion_type,
        p_discount_type: formData.discount_type || null,
        p_discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        p_discount_code: formData.discount_code || null,
        p_min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        p_max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        p_usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        p_start_date: formData.start_date || new Date().toISOString(),
        p_end_date: formData.end_date || null,
        p_target_audience: formData.target_audience,
        p_display_location: formData.display_location,
        p_priority: formData.priority,
        p_banner_image_url: formData.banner_image_url || null,
        p_banner_text_color: formData.banner_text_color,
        p_banner_background_color: formData.banner_background_color,
        p_cta_text: formData.cta_text,
        p_cta_url: formData.cta_url || null,
        p_admin_notes: formData.admin_notes || null
      });

      if (error) throw error;

      toast.success('Promotion created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchPromotions();
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Failed to create promotion');
    } finally {
      setLoading(false);
    }
  };

  const updatePromotion = async () => {
    if (!editingPromotion) return;
    
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('promotions')
        .update({
          title: formData.title,
          description: formData.description || null,
          promotion_type: formData.promotion_type,
          discount_type: formData.discount_type || null,
          discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
          discount_code: formData.discount_code || null,
          min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
          max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          start_date: formData.start_date || new Date().toISOString(),
          end_date: formData.end_date || null,
          target_audience: formData.target_audience,
          display_location: formData.display_location,
          priority: formData.priority,
          banner_image_url: formData.banner_image_url || null,
          banner_text_color: formData.banner_text_color,
          banner_background_color: formData.banner_background_color,
          cta_text: formData.cta_text,
          cta_url: formData.cta_url || null,
          admin_notes: formData.admin_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPromotion.id);

      if (error) throw error;

      toast.success('Promotion updated successfully');
      setShowEditDialog(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error('Failed to update promotion');
    } finally {
      setLoading(false);
    }
  };

  const loadPromotionForEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    // Format dates for datetime-local input (remove timezone info)
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      title: promotion.title || '',
      description: promotion.description || '',
      promotion_type: promotion.promotion_type || 'announcement',
      discount_type: promotion.discount_type || '',
      discount_value: promotion.discount_value?.toString() || '',
      discount_code: promotion.discount_code || '',
      min_order_amount: promotion.min_order_amount?.toString() || '',
      max_discount_amount: promotion.max_discount_amount?.toString() || '',
      usage_limit: promotion.usage_limit?.toString() || '',
      start_date: formatDateForInput(promotion.start_date),
      end_date: promotion.end_date ? formatDateForInput(promotion.end_date) : '',
      target_audience: promotion.target_audience || 'all',
      display_location: promotion.display_location || ['homepage'],
      priority: promotion.priority || 1,
      banner_image_url: promotion.banner_image_url || '',
      banner_text_color: promotion.banner_text_color || '#000000',
      banner_background_color: promotion.banner_background_color || '#ffffff',
      cta_text: promotion.cta_text || 'Learn More',
      cta_url: promotion.cta_url || '',
      admin_notes: promotion.admin_notes || ''
    });
    
    if (promotion.banner_image_url) {
      setImagePreview(promotion.banner_image_url);
    }
    
    setShowEditDialog(true);
  };

  const togglePromotionStatus = async (promotionId: string, isActive: boolean) => {
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('promotions')
        .update({ is_active: !isActive })
        .eq('id', promotionId);

      if (error) throw error;

      toast.success(`Promotion ${!isActive ? 'activated' : 'deactivated'}`);
      fetchPromotions();
    } catch (error) {
      console.error('Error toggling promotion:', error);
      toast.error('Failed to update promotion');
    } finally {
      setLoading(false);
    }
  };

  const deletePromotion = async (promotionId: string) => {
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;

      toast.success('Promotion deleted successfully');
      fetchPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Failed to delete promotion');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      promotion_type: 'announcement',
      discount_type: '',
      discount_value: '',
      discount_code: '',
      min_order_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      start_date: '',
      end_date: '',
      target_audience: 'all',
      display_location: ['homepage'],
      priority: 1,
      banner_image_url: '',
      banner_text_color: '#000000',
      banner_background_color: '#ffffff',
      cta_text: 'Learn More',
      cta_url: '',
      admin_notes: ''
    });
    setImagePreview(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `promotion-${Date.now()}.${fileExt}`;
      const filePath = `promotions/${fileName}`;

      const { data, error } = await supabase.storage
        .from('promotions')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload image');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('promotions')
        .getPublicUrl(filePath);

      setFormData({ ...formData, banner_image_url: publicUrl });
      toast.success('Image uploaded successfully');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, banner_image_url: '' });
  };

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'discount': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'offer': return <Target className="w-4 h-4 text-blue-600" />;
      case 'announcement': return <Megaphone className="w-4 h-4 text-purple-600" />;
      case 'banner': return <Eye className="w-4 h-4 text-orange-600" />;
      case 'popup': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Megaphone className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;

    if (!promotion.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (startDate > now) {
      return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
    }

    if (endDate && endDate < now) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }

    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const filteredPromotions = promotions.filter(promotion => {
    switch (activeTab) {
      case 'active':
        return promotion.is_active && new Date(promotion.start_date) <= new Date() && 
               (!promotion.end_date || new Date(promotion.end_date) >= new Date());
      case 'inactive':
        return !promotion.is_active;
      case 'expired':
        return promotion.end_date && new Date(promotion.end_date) < new Date();
      case 'scheduled':
        return new Date(promotion.start_date) > new Date();
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Megaphone className="w-6 h-6 mr-2 text-purple-600" />
            Promotions & Offers
          </h2>
          <p className="text-muted-foreground">
            Manage website promotions, offers, and announcements
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
              <DialogDescription>
                Create a promotion, offer, or announcement to display on the website
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="Enter promotion title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Promotion Type *</Label>
                    <Select value={formData.promotion_type} onValueChange={(value) => setFormData({...formData, promotion_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="offer">Special Offer</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                        <SelectItem value="popup">Popup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Enter promotion description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Discount Settings */}
              {formData.promotion_type === 'discount' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Discount Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                          <SelectItem value="free_service">Free Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Value</Label>
                      <Input
                        type="number"
                        placeholder="Enter discount value"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Code (Optional)</Label>
                      <Input
                        placeholder="Enter discount code"
                        value={formData.discount_code}
                        onChange={(e) => setFormData({...formData, discount_code: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Order Amount</Label>
                      <Input
                        type="number"
                        placeholder="Enter minimum order amount"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Display Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Display Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select value={formData.target_audience} onValueChange={(value) => setFormData({...formData, target_audience: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users - Show to everyone</SelectItem>
                        <SelectItem value="customers">Customers Only - Only users who are clients/customers</SelectItem>
                        <SelectItem value="designers">Designers Only - Only users who are designers</SelectItem>
                        <SelectItem value="new_users">New Users - Users who just signed up</SelectItem>
                        <SelectItem value="existing_users">Existing Users - Users who have been on platform for a while</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {formData.target_audience === 'all' && 'Promotion will be visible to all users'}
                      {formData.target_audience === 'customers' && 'Promotion will only show to customers (clients)'}
                      {formData.target_audience === 'designers' && 'Promotion will only show to designers'}
                      {formData.target_audience === 'new_users' && 'Promotion will only show to newly registered users'}
                      {formData.target_audience === 'existing_users' && 'Promotion will only show to existing users (not new)'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Display Locations</Label>
                  <div className="flex flex-wrap gap-2">
                    {['homepage', 'designers', 'services', 'about', 'contact'].map((location) => (
                      <label key={location} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.display_location.includes(location)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                display_location: [...formData.display_location, location]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                display_location: formData.display_location.filter(l => l !== location)
                              });
                            }
                          }}
                        />
                        <span className="text-sm capitalize">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Banner Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Banner Settings</h3>
                
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <Label>Banner Image</Label>
                  
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {imagePreview || formData.banner_image_url ? (
                      <div className="space-y-4">
                        <div className="relative inline-block w-full flex justify-center">
                          <img
                            src={imagePreview || formData.banner_image_url}
                            alt="Banner preview"
                            className="max-w-full max-h-64 w-auto h-auto object-contain rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2"
                            onClick={removeImage}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">Image uploaded successfully</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <div className="flex items-center justify-center space-x-2">
                              <Upload className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                              </span>
                            </div>
                          </Label>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual URL Input */}
                  <div className="space-y-2">
                    <Label>Or enter image URL manually</Label>
                    <Input
                      placeholder="Enter banner image URL"
                      value={formData.banner_image_url}
                      onChange={(e) => setFormData({...formData, banner_image_url: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA Text</Label>
                    <Input
                      placeholder="Enter CTA text"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({...formData, cta_text: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA URL</Label>
                    <Input
                      placeholder="Enter CTA URL"
                      value={formData.cta_url}
                      onChange={(e) => setFormData({...formData, cta_url: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={formData.banner_text_color}
                      onChange={(e) => setFormData({...formData, banner_text_color: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={formData.banner_background_color}
                      onChange={(e) => setFormData({...formData, banner_background_color: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createPromotion} disabled={loading || !formData.title}>
                  {loading ? 'Creating...' : 'Create Promotion'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Promotion Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setEditingPromotion(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promotion</DialogTitle>
            <DialogDescription>
              Update promotion details and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="Enter promotion title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Promotion Type *</Label>
                  <Select value={formData.promotion_type} onValueChange={(value) => setFormData({...formData, promotion_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="offer">Special Offer</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter promotion description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            {/* Discount Settings */}
            {formData.promotion_type === 'discount' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Discount Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        <SelectItem value="free_service">Free Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      placeholder="Enter discount value"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Code (Optional)</Label>
                    <Input
                      placeholder="Enter discount code"
                      value={formData.discount_code}
                      onChange={(e) => setFormData({...formData, discount_code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Order Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter minimum order amount"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Display Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={formData.target_audience} onValueChange={(value) => setFormData({...formData, target_audience: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users - Show to everyone</SelectItem>
                      <SelectItem value="customers">Customers Only - Only users who are clients/customers</SelectItem>
                      <SelectItem value="designers">Designers Only - Only users who are designers</SelectItem>
                      <SelectItem value="new_users">New Users - Users who just signed up</SelectItem>
                      <SelectItem value="existing_users">Existing Users - Users who have been on platform for a while</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {formData.target_audience === 'all' && 'Promotion will be visible to all users'}
                    {formData.target_audience === 'customers' && 'Promotion will only show to customers (clients)'}
                    {formData.target_audience === 'designers' && 'Promotion will only show to designers'}
                    {formData.target_audience === 'new_users' && 'Promotion will only show to newly registered users'}
                    {formData.target_audience === 'existing_users' && 'Promotion will only show to existing users (not new)'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Display Locations</Label>
                <div className="flex flex-wrap gap-2">
                  {['homepage', 'designers', 'services', 'about', 'contact'].map((location) => (
                    <label key={location} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.display_location.includes(location)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              display_location: [...formData.display_location, location]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              display_location: formData.display_location.filter(l => l !== location)
                            });
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{location}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Banner Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Banner Settings</h3>
              
              {/* Image Upload Section */}
              <div className="space-y-4">
                <Label>Banner Image</Label>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {imagePreview || formData.banner_image_url ? (
                    <div className="space-y-4">
                      <div className="relative inline-block w-full flex justify-center">
                        <img
                          src={imagePreview || formData.banner_image_url}
                          alt="Banner preview"
                          className="max-w-full max-h-64 w-auto h-auto object-contain rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={removeImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">Image uploaded successfully</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <Label htmlFor="image-upload-edit" className="cursor-pointer">
                          <div className="flex items-center justify-center space-x-2">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                            </span>
                          </div>
                        </Label>
                        <input
                          id="image-upload-edit"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual URL Input */}
                <div className="space-y-2">
                  <Label>Or enter image URL manually</Label>
                  <Input
                    placeholder="Enter banner image URL"
                    value={formData.banner_image_url}
                    onChange={(e) => setFormData({...formData, banner_image_url: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CTA Text</Label>
                  <Input
                    placeholder="Enter CTA text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({...formData, cta_text: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA URL</Label>
                  <Input
                    placeholder="Enter CTA URL"
                    value={formData.cta_url}
                    onChange={(e) => setFormData({...formData, cta_url: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={formData.banner_text_color}
                    onChange={(e) => setFormData({...formData, banner_text_color: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={formData.banner_background_color}
                    onChange={(e) => setFormData({...formData, banner_background_color: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                setEditingPromotion(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={updatePromotion} disabled={loading || !formData.title}>
                {loading ? 'Updating...' : 'Update Promotion'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Promotion Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {promotions.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Total Promotions
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {promotions.filter(p => p.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Active Promotions
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {promotions.reduce((sum, p) => sum + p.used_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Total Usage
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {promotions.filter(p => p.promotion_type === 'discount').length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Discount Offers
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promotions List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredPromotions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Promotions Found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all' ? 'Create your first promotion' : `No ${activeTab} promotions found`}
                </p>
                {activeTab === 'all' && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Promotion
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPromotions.map((promotion) => (
              <Card key={promotion.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                      {getPromotionTypeIcon(promotion.promotion_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base">{promotion.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {promotion.promotion_type}
                          </Badge>
                          {promotion.discount_code && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Code: {promotion.discount_code}
                            </Badge>
                          )}
                          {getStatusBadge(promotion)}
                        </div>
                        {promotion.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {promotion.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Priority: </span>
                            <span className="font-medium">{promotion.priority}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Usage: </span>
                            <span className="font-medium">
                              {promotion.used_count}/{promotion.usage_limit || '∞'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Start: </span>
                            <span className="font-medium">
                              {new Date(promotion.start_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">End: </span>
                            <span className="font-medium">
                              {promotion.end_date ? new Date(promotion.end_date).toLocaleDateString() : 'No end date'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={promotion.is_active}
                        onCheckedChange={() => togglePromotionStatus(promotion.id, promotion.is_active)}
                        disabled={loading}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadPromotionForEdit(promotion)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deletePromotion(promotion.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PromotionsManager;
