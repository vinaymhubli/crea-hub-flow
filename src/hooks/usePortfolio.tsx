
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDesignerProfile } from './useDesignerProfile';
import { toast } from '@/hooks/use-toast';

const MAX_PORTFOLIO_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

interface PortfolioItem {
  id: string;
  designer_id: string;
  title: string;
  description: string | null;
  category: string | null;
  year: number | null;
  client: string | null;
  project_link: string | null;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePortfolioData {
  title: string;
  description?: string;
  category?: string;
  year?: number;
  client?: string;
  project_link?: string;
  image: File;
}

interface UpdatePortfolioData {
  title?: string;
  description?: string;
  category?: string;
  year?: number;
  client?: string;
  project_link?: string;
  image?: File;
  is_active?: boolean;
}

export const usePortfolio = () => {
  const { user } = useAuth();
  const { designerProfile, ensureDesignerRow } = useDesignerProfile();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPortfolioItems = async () => {
    if (!designerProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('designer_id', designerProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching portfolio items:', error);
        setError(error.message);
        return;
      }

      setPortfolioItems(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch portfolio items');
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicPortfolioItems = async (designerId: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('designer_id', designerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching public portfolio:', err);
      return [];
    }
  };

  const uploadPortfolioImage = async (file: File) => {
    if (!user?.id) return null;
    if (file.size > MAX_PORTFOLIO_IMAGE_SIZE) {
      toast({
        title: "File too large",
        description: "Portfolio images must be 3MB or less.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('designer-portfolio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('designer-portfolio')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading portfolio image:', err);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
      return null;
    }
  };

  const createPortfolioItem = async (itemData: CreatePortfolioData) => {
    if (!user?.id) return false;

    try {
      // Ensure designer row exists
      let designerId = designerProfile?.id;
      if (!designerId) {
        designerId = await ensureDesignerRow();
        if (!designerId) return false;
      }

      // Upload image first
      const imageUrl = await uploadPortfolioImage(itemData.image);
      if (!imageUrl) return false;

      const { error } = await supabase
        .from('portfolio_items')
        .insert({
          designer_id: designerId,
          title: itemData.title,
          description: itemData.description,
          category: itemData.category,
          year: itemData.year,
          client: itemData.client,
          project_link: itemData.project_link,
          image_url: imageUrl
        });

      if (error) throw error;

      await fetchMyPortfolioItems(); // Refresh data
      toast({
        title: "Success",
        description: "Portfolio item created successfully"
      });
      return true;
    } catch (err) {
      console.error('Error creating portfolio item:', err);
      toast({
        title: "Error",
        description: "Failed to create portfolio item",
        variant: "destructive"
      });
      return false;
    }
  };

  const updatePortfolioItem = async (id: string, updates: UpdatePortfolioData) => {
    if (!designerProfile?.id) return false;

    try {
      let updateData: any = { ...updates };
      delete updateData.image; // Remove image from update data

      // Handle image upload if new image provided
      if (updates.image) {
        const imageUrl = await uploadPortfolioImage(updates.image);
        if (!imageUrl) return false;
        updateData.image_url = imageUrl;
      }

      const { error } = await supabase
        .from('portfolio_items')
        .update(updateData)
        .eq('id', id)
        .eq('designer_id', designerProfile.id);

      if (error) throw error;

      await fetchMyPortfolioItems(); // Refresh data
      toast({
        title: "Success",
        description: "Portfolio item updated successfully"
      });
      return true;
    } catch (err) {
      console.error('Error updating portfolio item:', err);
      toast({
        title: "Error",
        description: "Failed to update portfolio item",
        variant: "destructive"
      });
      return false;
    }
  };

  const togglePortfolioItemActive = async (id: string, isActive: boolean) => {
    return updatePortfolioItem(id, { is_active: isActive });
  };

  const deletePortfolioItem = async (id: string) => {
    if (!designerProfile?.id) return false;

    try {
      // Get the item to find the image URL for cleanup
      const { data: item } = await supabase
        .from('portfolio_items')
        .select('image_url')
        .eq('id', id)
        .single();

      // Delete from database
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id)
        .eq('designer_id', designerProfile.id);

      if (error) throw error;

      // Clean up storage file
      if (item?.image_url && user?.id) {
        const urlParts = item.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user.id}/${fileName}`;

        await supabase.storage
          .from('designer-portfolio')
          .remove([filePath]);
      }

      await fetchMyPortfolioItems(); // Refresh data
      toast({
        title: "Success",
        description: "Portfolio item deleted successfully"
      });
      return true;
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      toast({
        title: "Error",
        description: "Failed to delete portfolio item",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (designerProfile?.id) {
      fetchMyPortfolioItems();
    } else if (designerProfile !== undefined) {
      // Profile has loaded but no designer row exists - set loading to false
      setLoading(false);
    }
  }, [designerProfile]);

  return {
    portfolioItems,
    loading,
    error,
    refetch: fetchMyPortfolioItems,
    fetchPublicPortfolioItems,
    createPortfolioItem,
    updatePortfolioItem,
    togglePortfolioItemActive,
    deletePortfolioItem
  };
};
