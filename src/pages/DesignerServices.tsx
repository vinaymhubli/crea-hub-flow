
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DesignerSidebar } from '@/components/DesignerSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  DollarSign, 
  Clock, 
  Package,
  Tag,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  currency: string;
  delivery_time_days: number;
  revisions: number;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  cover_image_url: string;
  gallery_urls: string[];
  created_at: string;
  updated_at: string;
  packages?: ServicePackage[];
}

interface ServicePackage {
  id: string;
  tier: 'basic' | 'standard' | 'premium';
  title: string;
  description: string;
  price: number;
  delivery_time_days: number;
  revisions: number;
  features: string[];
}


const categories = [
  'Logo Design', 'Web Design', 'UI/UX Design', 'Mobile App Design', 
  'Branding', 'Print Design', 'Illustration', 'Other'
];

export default function DesignerServices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    price: 0,
    delivery_time_days: 3,
    revisions: 1,
    cover_image_url: '',
    gallery_urls: ''
  });

  const coverFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  const [packages, setPackages] = useState({
    basic: { title: 'Basic', description: '', price: 0, delivery_time_days: 3, revisions: 1, features: [''] },
    standard: { title: 'Standard', description: '', price: 0, delivery_time_days: 5, revisions: 2, features: ['', ''] },
    premium: { title: 'Premium', description: '', price: 0, delivery_time_days: 7, revisions: 3, features: ['', '', ''] }
  });

  useEffect(() => {
    fetchServices();
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;
    
    try {
      // First get the designer record
      const { data: designer } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (designer) {
        const { data: servicesData, error } = await supabase
          .from('services')
          .select(`
            *,
            service_packages (*)
          `)
          .eq('designer_id', designer.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setServices(servicesData || []);
      } else {
        // No designer profile yet, show empty state
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!user || !formData.title.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      // Get or create designer profile
      let { data: designer } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!designer) {
        // Create designer profile with default values
        const { data: newDesigner, error: designerError } = await supabase
          .from('designers')
          .insert({
            user_id: user.id,
            specialty: 'General',
            hourly_rate: 50.00,
            bio: 'Professional designer ready to help with your projects',
            skills: ['Design'],
            location: 'Remote'
          })
          .select()
          .single();

        if (designerError) throw designerError;
        designer = newDesigner;
      }

      const { data: service, error } = await supabase
        .from('services')
        .insert({
          designer_id: designer.id,
          title: formData.title,
          description: formData.description,
          category: formData.category || 'Other',
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          price: formData.price,
          delivery_time_days: formData.delivery_time_days,
          revisions: formData.revisions,
          cover_image_url: formData.cover_image_url,
          gallery_urls: formData.gallery_urls.split(',').map(u => u.trim()).filter(u => u)
        })
        .select()
        .single();

      if (error) throw error;

      // Create packages if they have data
      const packageData = [];
      Object.entries(packages).forEach(([tier, pkg]) => {
        if (pkg.price > 0) {
          packageData.push({
            service_id: service.id,
            tier,
            title: pkg.title,
            description: pkg.description,
            price: pkg.price,
            delivery_time_days: pkg.delivery_time_days,
            revisions: pkg.revisions,
            features: pkg.features.filter(f => f.trim())
          });
        }
      });

      if (packageData.length > 0) {
        await supabase.from('service_packages').insert(packageData);
      }

      toast.success('Service created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Failed to create service');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;

      toast.success(`Service ${service.is_active ? 'deactivated' : 'activated'}`);
      fetchServices(); // Refetch to ensure UI is in sync
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || '',
      category: service.category,
      tags: service.tags.join(', '),
      price: service.price,
      delivery_time_days: service.delivery_time_days,
      revisions: service.revisions,
      cover_image_url: service.cover_image_url || '',
      gallery_urls: service.gallery_urls.join(', ')
    });
    
    // Load existing packages
    if (service.packages) {
      const existingPackages = { ...packages };
      service.packages.forEach(pkg => {
        if (pkg.tier in existingPackages) {
          existingPackages[pkg.tier as keyof typeof existingPackages] = {
            title: pkg.title,
            description: pkg.description,
            price: pkg.price,
            delivery_time_days: pkg.delivery_time_days,
            revisions: pkg.revisions,
            features: pkg.features
          };
        }
      });
      setPackages(existingPackages);
    }
    
    setEditDialogOpen(true);
  };

  const handleUpdateService = async () => {
    if (!editingService || !user || !formData.title.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category || 'Other',
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          price: formData.price,
          delivery_time_days: formData.delivery_time_days,
          revisions: formData.revisions,
          cover_image_url: formData.cover_image_url,
          gallery_urls: formData.gallery_urls.split(',').map(u => u.trim()).filter(u => u)
        })
        .eq('id', editingService.id);

      if (error) throw error;

      // Delete existing packages and create new ones
      await supabase
        .from('service_packages')
        .delete()
        .eq('service_id', editingService.id);

      const packageData = [];
      Object.entries(packages).forEach(([tier, pkg]) => {
        if (pkg.price > 0) {
          packageData.push({
            service_id: editingService.id,
            tier,
            title: pkg.title,
            description: pkg.description,
            price: pkg.price,
            delivery_time_days: pkg.delivery_time_days,
            revisions: pkg.revisions,
            features: pkg.features.filter(f => f.trim())
          });
        }
      });

      if (packageData.length > 0) {
        await supabase.from('service_packages').insert(packageData);
      }

      toast.success('Service updated successfully!');
      setEditDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleViewService = (service: Service) => {
    navigate(`/services/${service.id}`);
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${path}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('service-images')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('service-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadFile(file, 'covers');
      setFormData({ ...formData, cover_image_url: url });
      toast.success('Cover image uploaded!');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setUploading(true);
      const urls = [];
      
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, 'gallery');
        urls.push(url);
      }
      
      const existingUrls = formData.gallery_urls ? formData.gallery_urls.split(',').map(u => u.trim()).filter(u => u) : [];
      const allUrls = [...existingUrls, ...urls];
      setFormData({ ...formData, gallery_urls: allUrls.join(', ') });
      toast.success(`${urls.length} image(s) uploaded to gallery!`);
    } catch (error) {
      console.error('Error uploading gallery images:', error);
      toast.error('Failed to upload gallery images');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      tags: '',
      price: 0,
      delivery_time_days: 3,
      revisions: 1,
      cover_image_url: '',
      gallery_urls: ''
    });
    setPackages({
      basic: { title: 'Basic', description: '', price: 0, delivery_time_days: 3, revisions: 1, features: [''] },
      standard: { title: 'Standard', description: '', price: 0, delivery_time_days: 5, revisions: 2, features: ['', ''] },
      premium: { title: 'Premium', description: '', price: 0, delivery_time_days: 7, revisions: 3, features: ['', '', ''] }
    });
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DesignerSidebar />
          
          <main className="flex-1">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">My Services</h1>
                  <p className="text-gray-600">Manage your service offerings</p>
                </div>
              </div>
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-40 sm:h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-3 sm:p-4">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2.5 sm:h-3 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DesignerSidebar />
        
        <main className="flex-1">
          <DashboardHeader
            title="My Services"
            subtitle="Create and manage your design services"
            icon={<Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            additionalInfo={
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
                <span className="text-white/90 font-medium">{services.length} Total Services</span>
                <span className="text-white/60">•</span>
                <span className="text-white/90 font-medium">{services.filter(s => s.is_active).length} Active</span>
              </div>
            }
            actionButton={
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm w-full sm:w-auto"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Create Service
              </Button>
            }
          />

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="packages">Packages</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Service Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="I will create a professional logo design..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe what you'll deliver..."
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Starting Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="5"
                      step="5"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery">Delivery (days)</Label>
                    <Input
                      id="delivery"
                      type="number"
                      min="1"
                      value={formData.delivery_time_days}
                      onChange={(e) => setFormData({...formData, delivery_time_days: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="revisions">Revisions</Label>
                    <Input
                      id="revisions"
                      type="number"
                      min="0"
                      value={formData.revisions}
                      onChange={(e) => setFormData({...formData, revisions: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="logo, branding, business, modern"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cover">Cover Image</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cover"
                      value={formData.cover_image_url}
                      onChange={(e) => setFormData({...formData, cover_image_url: e.target.value})}
                      placeholder="https://example.com/image.jpg or upload file"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => coverFileRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <input
                    ref={coverFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                  />
                  {formData.cover_image_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.cover_image_url} 
                        alt="Cover preview" 
                        className="w-20 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gallery">Gallery Images</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gallery"
                      value={formData.gallery_urls}
                      onChange={(e) => setFormData({...formData, gallery_urls: e.target.value})}
                      placeholder="URLs or upload multiple files"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => galleryFileRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <input
                    ref={galleryFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                  {formData.gallery_urls && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {formData.gallery_urls.split(',').map((url, idx) => (
                        url.trim() && (
                          <img 
                            key={idx}
                            src={url.trim()} 
                            alt={`Gallery ${idx + 1}`} 
                            className="w-16 h-16 object-cover rounded border flex-shrink-0"
                          />
                        )
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="packages" className="space-y-6">
                {Object.entries(packages).map(([tier, pkg]) => (
                  <Card key={tier}>
                    <CardHeader>
                      <CardTitle className="capitalize">{tier} Package</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Package Title</Label>
                          <Input
                            value={pkg.title}
                            onChange={(e) => setPackages({...packages, [tier]: {...pkg, title: e.target.value}})}
                          />
                        </div>
                        <div>
                          <Label>Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="5"
                            value={pkg.price}
                            onChange={(e) => setPackages({...packages, [tier]: {...pkg, price: parseFloat(e.target.value) || 0}})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={pkg.description}
                          onChange={(e) => setPackages({...packages, [tier]: {...pkg, description: e.target.value}})}
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Delivery (days)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={pkg.delivery_time_days}
                            onChange={(e) => setPackages({...packages, [tier]: {...pkg, delivery_time_days: parseInt(e.target.value) || 1}})}
                          />
                        </div>
                        <div>
                          <Label>Revisions</Label>
                          <Input
                            type="number"
                            min="0"
                            value={pkg.revisions}
                            onChange={(e) => setPackages({...packages, [tier]: {...pkg, revisions: parseInt(e.target.value) || 0}})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Features</Label>
                        {pkg.features.map((feature, idx) => (
                          <Input
                            key={idx}
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...pkg.features];
                              newFeatures[idx] = e.target.value;
                              setPackages({...packages, [tier]: {...pkg, features: newFeatures}});
                            }}
                            placeholder={`Feature ${idx + 1}`}
                            className="mb-2"
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateService} className="bg-gradient-to-r from-green-600 to-blue-600">
                Create Service
              </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Service Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Service</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="packages">Packages</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-title">Service Title *</Label>
                        <Input
                          id="edit-title"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="I will create a professional logo design..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Describe what you'll deliver..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-price">Starting Price (₹)</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          min="5"
                          step="5"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-delivery">Delivery (days)</Label>
                        <Input
                          id="edit-delivery"
                          type="number"
                          min="1"
                          value={formData.delivery_time_days}
                          onChange={(e) => setFormData({...formData, delivery_time_days: parseInt(e.target.value) || 1})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-revisions">Revisions</Label>
                        <Input
                          id="edit-revisions"
                          type="number"
                          min="0"
                          value={formData.revisions}
                          onChange={(e) => setFormData({...formData, revisions: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                      <Input
                        id="edit-tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                        placeholder="logo, branding, business, modern"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-cover">Cover Image</Label>
                      <div className="flex gap-2">
                        <Input
                          id="edit-cover"
                          value={formData.cover_image_url}
                          onChange={(e) => setFormData({...formData, cover_image_url: e.target.value})}
                          placeholder="https://example.com/image.jpg or upload file"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => coverFileRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                      {formData.cover_image_url && (
                        <div className="mt-2">
                          <img 
                            src={formData.cover_image_url} 
                            alt="Cover preview" 
                            className="w-20 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-gallery">Gallery Images</Label>
                      <div className="flex gap-2">
                        <Input
                          id="edit-gallery"
                          value={formData.gallery_urls}
                          onChange={(e) => setFormData({...formData, gallery_urls: e.target.value})}
                          placeholder="URLs or upload multiple files"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => galleryFileRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                      {formData.gallery_urls && (
                        <div className="flex gap-2 mt-2 overflow-x-auto">
                          {formData.gallery_urls.split(',').map((url, idx) => (
                            url.trim() && (
                              <img 
                                key={idx}
                                src={url.trim()} 
                                alt={`Gallery ${idx + 1}`} 
                                className="w-16 h-16 object-cover rounded border flex-shrink-0"
                              />
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="packages" className="space-y-6">
                    {Object.entries(packages).map(([tier, pkg]) => (
                      <Card key={tier}>
                        <CardHeader>
                          <CardTitle className="capitalize">{tier} Package</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Package Title</Label>
                              <Input
                                value={pkg.title}
                                onChange={(e) => setPackages({...packages, [tier]: {...pkg, title: e.target.value}})}
                              />
                            </div>
                            <div>
                              <Label>Price (₹)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="5"
                                value={pkg.price}
                                onChange={(e) => setPackages({...packages, [tier]: {...pkg, price: parseFloat(e.target.value) || 0}})}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={pkg.description}
                              onChange={(e) => setPackages({...packages, [tier]: {...pkg, description: e.target.value}})}
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Delivery (days)</Label>
                              <Input
                                type="number"
                                min="1"
                                value={pkg.delivery_time_days}
                                onChange={(e) => setPackages({...packages, [tier]: {...pkg, delivery_time_days: parseInt(e.target.value) || 1}})}
                              />
                            </div>
                            <div>
                              <Label>Revisions</Label>
                              <Input
                                type="number"
                                min="0"
                                value={pkg.revisions}
                                onChange={(e) => setPackages({...packages, [tier]: {...pkg, revisions: parseInt(e.target.value) || 0}})}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label>Features</Label>
                            {pkg.features.map((feature, idx) => (
                              <Input
                                key={idx}
                                value={feature}
                                onChange={(e) => {
                                  const newFeatures = [...pkg.features];
                                  newFeatures[idx] = e.target.value;
                                  setPackages({...packages, [tier]: {...pkg, features: newFeatures}});
                                }}
                                placeholder={`Feature ${idx + 1}`}
                                className="mb-2"
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateService} className="bg-gradient-to-r from-green-600 to-blue-600">
                    Update Service
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-2xl font-bold">{services.filter(s => s.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {services.length > 0 
                    ? (services.reduce((acc, s) => acc + s.rating, 0) / services.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Starting From</p>
                <p className="text-2xl font-bold">
                  ₹{services.length > 0 ? Math.min(...services.map(s => s.price)).toFixed(0) : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Services Yet</h3>
          <p className="text-gray-500 mb-6">Create your first service to start attracting clients</p>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-green-600 to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Service
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <div className="h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {service.cover_image_url ? (
                    <img 
                      src={service.cover_image_url} 
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant={service.is_active ? "default" : "secondary"}>
                    {service.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-1">{service.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">{service.description}</p>
                
                <div className="flex items-center justify-between mb-3 gap-2">
                  <Badge variant="outline" className="text-xs">{service.category}</Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs sm:text-sm font-medium">{service.rating}</span>
                    
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                    <span className="font-semibold text-green-600 text-sm sm:text-base">₹{service.price}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{service.delivery_time_days}d delivery</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
                  {service.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Separator className="my-3 sm:my-4" />
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(service)}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    {service.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditService(service)}
                    className="px-2 sm:px-3"
                  >
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewService(service)}
                    className="px-2 sm:px-3"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
        </main>
      </div>
    </SidebarProvider>
  );
}
