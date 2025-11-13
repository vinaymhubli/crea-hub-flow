
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  created_at: string;
  is_admin: boolean;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      // Find the user to get their user_id
      const user = users.find(u => u.id === profileId);
      if (!user) {
        throw new Error('User not found');
      }

      // Profiles table has both 'id' (primary key) and 'user_id' (references auth.users.id)
      // We need to update using 'id' (the profile's primary key) since that's what we're passing
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', profileId); // Use profile id (primary key) to update

      if (error) {
        console.error('Update error details:', error);
        throw error;
      }

      // Update local state immediately for better UX
      setUsers(prev => 
        prev.map(u => 
          u.id === profileId ? { ...u, is_admin: !currentStatus } : u
        )
      );
      
      // Refetch to ensure data is in sync with database
      await fetchUsers();
      
      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'promoted to' : 'removed from'} admin successfully`,
      });
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: "Error",
        description: "Failed to update admin status. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    toggleAdminStatus,
    refetch: fetchUsers,
  };
};
