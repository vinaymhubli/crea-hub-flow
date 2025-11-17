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
  Share2, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ExternalLink,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Globe,
  Youtube
} from 'lucide-react';

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

const PLATFORM_ICONS = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  default: Globe
};

const PLATFORM_COLORS = {
  facebook: 'text-blue-600',
  twitter: 'text-blue-400',
  instagram: 'text-pink-500',
  linkedin: 'text-blue-700',
  youtube: 'text-red-600',
  default: 'text-gray-600'
};

export default function SocialMediaManagement() {
  const { user } = useAuth();
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialMediaLink | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<SocialMediaLink | null>(null);
  const { toast } = useToast();

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSocialLinks(data || []);
    } catch (error) {
      console.error('Error fetching social media links:', error);
      toast({
        title: "Error",
        description: "Failed to load social media links.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (link: SocialMediaLink) => {
    try {
      setSaving(true);
      
      if (link.id) {
        // Update existing link
        const { error } = await supabase
          .from('social_media_links')
          .update({
            platform: link.platform,
            url: link.url,
            icon: link.icon,
            is_active: link.is_active,
            sort_order: link.sort_order
          })
          .eq('id', link.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Social media link updated successfully.",
        });
      } else {
        // Create new link
        const { error } = await supabase
          .from('social_media_links')
          .insert({
            platform: link.platform,
            url: link.url,
            icon: link.icon,
            is_active: link.is_active,
            sort_order: link.sort_order
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Social media link created successfully.",
        });
      }

      await fetchSocialLinks();
      setIsDialogOpen(false);
      setEditingLink(null);
    } catch (error) {
      console.error('Error saving social media link:', error);
      toast({
        title: "Error",
        description: "Failed to save social media link.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (link: SocialMediaLink) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('social_media_links')
        .delete()
        .eq('id', link.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Social media link deleted successfully.",
      });

      await fetchSocialLinks();
      setIsDeleteDialogOpen(false);
      setLinkToDelete(null);
    } catch (error) {
      console.error('Error deleting social media link:', error);
      toast({
        title: "Error",
        description: "Failed to delete social media link.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (link?: SocialMediaLink) => {
    if (link) {
      setEditingLink({ ...link });
    } else {
      setEditingLink({
        id: '',
        platform: '',
        url: '',
        icon: '',
        is_active: true,
        sort_order: socialLinks.length + 1,
        created_at: null,
        updated_at: null
      });
    }
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (link: SocialMediaLink) => {
    setLinkToDelete(link);
    setIsDeleteDialogOpen(true);
  };

  const getPlatformIcon = (icon: string | null) => {
    const iconKey = (icon || 'default').toLowerCase();
    const IconComponent = PLATFORM_ICONS[iconKey as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.default;
    return <IconComponent className="h-4 w-4" />;
  };

  const getPlatformColor = (icon: string | null) => {
    const iconKey = (icon || 'default').toLowerCase();
    return PLATFORM_COLORS[iconKey as keyof typeof PLATFORM_COLORS] || PLATFORM_COLORS.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading social media links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media Management</h1>
          <p className="text-muted-foreground">Manage social media links for the website footer</p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Social Link
        </Button>
      </div>

      {/* Social Media Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            Manage the social media links that appear in the website footer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {socialLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={getPlatformColor(link.icon)}>
                          {getPlatformIcon(link.icon)}
                        </div>
                        <span className="font-medium">{link.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground truncate max-w-xs">
                          {link.url}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={link.is_active ? 'default' : 'secondary'}>
                        {link.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{link.sort_order}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(link)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteDialog(link)}
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
              {editingLink?.id ? 'Edit Social Media Link' : 'Add Social Media Link'}
            </DialogTitle>
            <DialogDescription>
              {editingLink?.id 
                ? 'Update the social media link details.' 
                : 'Add a new social media link to the website footer.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {editingLink && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Input
                  id="platform"
                  value={editingLink.platform}
                  onChange={(e) => setEditingLink({ ...editingLink, platform: e.target.value })}
                  placeholder="e.g., Facebook, Twitter, Instagram"
                />
              </div>
              
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={editingLink.icon}
                  onChange={(e) => setEditingLink({ ...editingLink, icon: e.target.value })}
                  placeholder="facebook, twitter, instagram, linkedin"
                />
              </div>
              
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={editingLink.sort_order}
                  onChange={(e) => setEditingLink({ ...editingLink, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingLink.is_active}
                  onCheckedChange={(checked) => setEditingLink({ ...editingLink, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={() => handleSave(editingLink!)} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Social Media Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{linkToDelete?.platform}" social media link? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => linkToDelete && handleDelete(linkToDelete)} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
