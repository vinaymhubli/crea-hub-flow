import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Image, 
  Edit, 
  Save, 
  X, 
  ExternalLink,
  Eye,
  Upload,
  ImageIcon,
  FileUp,
  Trash2
} from 'lucide-react';

interface Logo {
  id: string;
  logo_type: string;
  logo_url: string;
  alt_text: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const LOGO_TYPES = {
  header_logo: 'Header Logo',
  footer_logo: 'Footer Logo'
};

const LOGO_DESCRIPTIONS = {
  header_logo: 'Logo displayed in the website header (top-left corner)',
  footer_logo: 'Logo displayed in the website footer'
};

export default function LogoManagement() {
  const { user } = useAuth();
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingLogo, setEditingLogo] = useState<Logo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const { toast } = useToast();

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('logo_management')
        .select('*')
        .order('logo_type', { ascending: true });

      if (error) throw error;
      setLogos(data || []);
    } catch (error) {
      console.error('Error fetching logos:', error);
      toast({
        title: "Error",
        description: "Failed to load logos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    try {
      setUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (logo: Logo) => {
    try {
      setSaving(true);
      
      let logoUrl = logo.logo_url;
      
      // If file upload is selected, upload the file first
      if (uploadMethod === 'file' && selectedFile) {
        logoUrl = await uploadFile(selectedFile);
      }
      
      if (logo.id) {
        // Update existing logo
        const { error } = await supabase
          .from('logo_management')
          .update({
            logo_url: logoUrl,
            alt_text: logo.alt_text,
            is_active: logo.is_active
          })
          .eq('id', logo.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Logo updated successfully.",
        });
      } else {
        // Create new logo
        const { error } = await supabase
          .from('logo_management')
          .insert({
            logo_type: logo.logo_type,
            logo_url: logoUrl,
            alt_text: logo.alt_text,
            is_active: logo.is_active
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Logo created successfully.",
        });
      }

      await fetchLogos();
      setIsDialogOpen(false);
      setEditingLogo(null);
      setSelectedFile(null);
      setUploadMethod('url');
    } catch (error) {
      console.error('Error saving logo:', error);
      toast({
        title: "Error",
        description: "Failed to save logo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, GIF, WebP, or SVG).",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const openEditDialog = (logo?: Logo) => {
    if (logo) {
      setEditingLogo({ ...logo });
      setUploadMethod('url');
    } else {
      setEditingLogo({
        id: '',
        logo_type: 'header_logo',
        logo_url: '',
        alt_text: '',
        is_active: true,
        created_at: null,
        updated_at: null
      });
      setUploadMethod('url');
    }
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const getLogoTypeLabel = (type: string) => {
    return LOGO_TYPES[type as keyof typeof LOGO_TYPES] || type;
  };

  const getLogoDescription = (type: string) => {
    return LOGO_DESCRIPTIONS[type as keyof typeof LOGO_DESCRIPTIONS] || '';
  };

  const deleteLogoFile = async (logoUrl: string) => {
    try {
      // Extract file path from URL
      const url = new URL(logoUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(2).join('/'); // Remove '/storage/v1/object/public/' prefix
      
      // Delete from storage
      const { error } = await supabase.storage
        .from('public')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file from storage:', error);
        // Don't throw error - file might not exist in storage
      }
    } catch (error) {
      console.error('Error deleting logo file:', error);
      // Don't throw error - continue with logo deletion
    }
  };

  const handleDeleteLogo = async (logo: Logo) => {
    if (!confirm(`Are you sure you want to delete the ${getLogoTypeLabel(logo.logo_type)}? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      
      // Delete the file from storage if it's a Supabase storage URL
      if (logo.logo_url.includes('supabase')) {
        await deleteLogoFile(logo.logo_url);
      }
      
      // Delete from database
      const { error } = await supabase
        .from('logo_management')
        .delete()
        .eq('id', logo.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Logo deleted successfully.",
      });

      await fetchLogos();
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast({
        title: "Error",
        description: "Failed to delete logo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading logos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logo Management</h1>
          <p className="text-muted-foreground">Manage website logos for header and footer. Upload files or use URLs.</p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Upload className="h-4 w-4 mr-2" />
          Add New Logo
        </Button>
      </div>

      {/* Logos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Website Logos</CardTitle>
          <CardDescription>
            Manage the logos that appear in the website header and footer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Alt Text</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logos.map((logo) => (
                  <TableRow key={logo.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{getLogoTypeLabel(logo.logo_type)}</div>
                        <div className="text-sm text-muted-foreground">
                          {getLogoDescription(logo.logo_type)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-16 border rounded-lg overflow-hidden bg-gray-50">
                        {logo.logo_url ? (
                          <img 
                            src={logo.logo_url} 
                            alt={logo.alt_text || 'Logo preview'} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-gray-400 ${logo.logo_url ? 'hidden' : ''}`}>
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground truncate max-w-xs">
                          {logo.logo_url}
                        </span>
                        {logo.logo_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(logo.logo_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{logo.alt_text || 'No alt text'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={logo.is_active ? 'default' : 'secondary'}>
                        {logo.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(logo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(logo.logo_url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteLogo(logo)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLogo?.id ? 'Edit Logo' : 'Add New Logo'}
            </DialogTitle>
            <DialogDescription>
              {editingLogo?.id 
                ? 'Update the logo details.' 
                : 'Add a new logo to the website.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {editingLogo && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo_type">Logo Type</Label>
                <select
                  id="logo_type"
                  value={editingLogo.logo_type}
                  onChange={(e) => setEditingLogo({ ...editingLogo, logo_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingLogo.id} // Don't allow changing type for existing logos
                >
                  <option value="header_logo">Header Logo</option>
                  <option value="footer_logo">Footer Logo</option>
                </select>
              </div>

              {/* Upload Method Selection */}
              <div>
                <Label>Upload Method</Label>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="url"
                      checked={uploadMethod === 'url'}
                      onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                      className="text-blue-600"
                    />
                    <span>URL</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="file"
                      checked={uploadMethod === 'file'}
                      onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                      className="text-blue-600"
                    />
                    <span>Upload File</span>
                  </label>
                </div>
              </div>
              
              {uploadMethod === 'url' ? (
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={editingLogo.logo_url}
                    onChange={(e) => setEditingLogo({ ...editingLogo, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="logo_file">Upload Logo File</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="logo_file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {selectedFile && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-green-600">
                          Supported formats: JPEG, PNG, GIF, WebP, SVG (max 5MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="alt_text">Alt Text</Label>
                <Input
                  id="alt_text"
                  value={editingLogo.alt_text || ''}
                  onChange={(e) => setEditingLogo({ ...editingLogo, alt_text: e.target.value })}
                  placeholder="Logo description for accessibility"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingLogo.is_active}
                  onCheckedChange={(checked) => setEditingLogo({ ...editingLogo, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              {/* Logo Preview */}
              {(editingLogo.logo_url || selectedFile) && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="w-32 h-16 border rounded-lg overflow-hidden bg-gray-50">
                    {uploadMethod === 'file' && selectedFile ? (
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt={editingLogo.alt_text || 'Logo preview'} 
                        className="w-full h-full object-contain"
                      />
                    ) : editingLogo.logo_url ? (
                      <img 
                        src={editingLogo.logo_url} 
                        alt={editingLogo.alt_text || 'Logo preview'} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full flex items-center justify-center text-gray-400 hidden">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={() => handleSave(editingLogo!)} 
              disabled={saving || uploading || (uploadMethod === 'file' && !selectedFile)}
            >
              {uploading ? (
                <Upload className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
