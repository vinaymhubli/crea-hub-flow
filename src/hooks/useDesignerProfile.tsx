import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface DesignerProfile {
  id: string;
  user_id: string;
  specialty: string;
  hourly_rate: number;
  portfolio_images: string[];
  response_time: string;
  location: string;
  skills: string[];
  bio: string;
  is_online: boolean;
  completion_rate: number;
  reviews_count: number;
  rating: number;
  experience_years: number;
  display_hourly_rate: boolean;
  available_for_urgent: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileData {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  display_name?: string;
  phone?: string;
  avatar_url?: string;
}

export const useDesignerProfile = () => {
  const { user } = useAuth();
  const [designerProfile, setDesignerProfile] = useState<DesignerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDesignerProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching designer profile:', error);
        setError(error.message);
        return;
      }

      if (!data && user?.id) {
        // No designer profile found, create one automatically
        const designerId = await ensureDesignerRow();
        if (designerId) {
          // Refetch after creating
          return await fetchDesignerProfile();
        }
      }
      
      setDesignerProfile(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch designer profile');
    } finally {
      setLoading(false);
    }
  };

  const ensureDesignerRow = async () => {
    if (!user?.id) return null;

    try {
      // Check if designer row exists
      const { data: existingDesigner } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingDesigner) {
        return existingDesigner.id;
      }

      // Create designer row with minimal data
      const { data: newDesigner, error } = await supabase
        .from('designers')
        .insert({
          user_id: user.id,
          specialty: 'General Design',
          hourly_rate: 50,
          bio: '',
          location: '',
          skills: [],
          portfolio_images: []
        })
        .select('id')
        .single();

      if (error) throw error;
      
      await fetchDesignerProfile(); // Refresh data
      return newDesigner.id;
    } catch (err) {
      console.error('Error ensuring designer row:', err);
      toast({
        title: "Error",
        description: "Failed to initialize designer profile",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateDesignerProfile = async (updates: Partial<DesignerProfile>) => {
    if (!user?.id) return false;

    try {
      const designerId = await ensureDesignerRow();
      if (!designerId) return false;

      const { error } = await supabase
        .from('designers')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchDesignerProfile(); // Refresh data
      toast({
        title: "Success",
        description: "Designer profile updated successfully"
      });
      return true;
    } catch (err) {
      console.error('Error updating designer profile:', err);
      toast({
        title: "Error",
        description: "Failed to update designer profile",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success", 
        description: "Profile updated successfully"
      });
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const success = await updateProfile({ avatar_url: data.publicUrl });
      return success ? data.publicUrl : null;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
      return null;
    }
  };

  const uploadPortfolioImage = async (file: File) => {
    if (!user?.id) return null;

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
        description: "Failed to upload portfolio image",
        variant: "destructive"
      });
      return null;
    }
  };

  const deletePortfolioImage = async (imageUrl: string) => {
    if (!user?.id) return false;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('designer-portfolio')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting portfolio image:', err);
      return false;
    }
  };

  const calculateTotalEarnings = async () => {
    if (!user?.id) return 0;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount')
        .eq('designer_id', designerProfile?.id)
        .eq('status', 'completed');

      if (error) {
        console.error('Error calculating earnings:', error);
        return 0;
      }

      return data?.reduce((total, booking) => total + Number(booking.total_amount), 0) || 0;
    } catch (err) {
      console.error('Error calculating earnings:', err);
      return 0;
    }
  };

  useEffect(() => {
    fetchDesignerProfile();
  }, [user?.id]);

  return {
    designerProfile,
    loading,
    error,
    refetch: fetchDesignerProfile,
    calculateTotalEarnings,
    updateDesignerProfile,
    updateProfile,
    uploadAvatar,
    uploadPortfolioImage,
    deletePortfolioImage,
    ensureDesignerRow
  };
};