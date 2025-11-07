import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DesignerVerificationStatus {
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
  verificationStatus: string | null;
  loading: boolean;
}

export const useDesignerVerification = () => {
  const { user, profile } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<DesignerVerificationStatus>({
    isVerified: false,
    isPending: false,
    isRejected: false,
    verificationStatus: null,
    loading: true
  });

  const checkVerificationStatus = async () => {
    if (!user?.id || profile?.user_type !== 'designer') {
      setVerificationStatus({
        isVerified: false,
        isPending: false,
        isRejected: false,
        verificationStatus: null,
        loading: false
      });
      return;
    }

    try {
      const { data: designer, error } = await supabase
        .from('designers')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking verification status:', error);
        
        // If no designer record exists, create one as pending
        if (error.details?.includes('0 rows') || error.code === 'PGRST116') {
          console.log('No designer record found, creating pending designer...');
          await createPendingDesignerRecord();
          return;
        }
        
        setVerificationStatus({
          isVerified: false,
          isPending: false,
          isRejected: false,
          verificationStatus: null,
          loading: false
        });
        return;
      }

      const status = designer?.verification_status || 'draft';
      
      setVerificationStatus({
        isVerified: status === 'approved',
        isPending: status === 'pending',
        isRejected: status === 'rejected',
        verificationStatus: status,
        loading: false
      });

    } catch (error) {
      console.error('Error checking verification status:', error);
      setVerificationStatus({
        isVerified: false,
        isPending: false,
        isRejected: false,
        verificationStatus: null,
        loading: false
      });
    }
  };

  const createPendingDesignerRecord = async () => {
    if (!user?.id) return;

    try {
      // Create designer row with draft status (not pending - they need to fill profile first)
      const { data: newDesigner, error } = await supabase
        .from('designers')
        .insert({
          user_id: user.id,
          specialty: 'General Design',
          hourly_rate: 50,
          bio: '',
          location: '',
          skills: [],
          portfolio_images: [],
          verification_status: 'draft' // Start as draft, not pending
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // Don't notify admins yet - wait until they submit profile
      
      // Set status to draft
      setVerificationStatus({
        isVerified: false,
        isPending: false,
        isRejected: false,
        verificationStatus: 'draft',
        loading: false
      });

      console.log('✅ Created draft designer record:', newDesigner.id);
    } catch (error) {
      console.error('❌ Error creating draft designer record:', error);
      setVerificationStatus({
        isVerified: false,
        isPending: false,
        isRejected: false,
        verificationStatus: 'draft',
        loading: false
      });
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, [user?.id, profile?.user_type]);

  return {
    ...verificationStatus,
    refetch: checkVerificationStatus
  };
};

// Helper function to notify admins about new designer signup
const notifyAdminsNewDesigner = async (designerUserId: string) => {
  try {
    // Get designer profile info
    const { data: designerProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('user_id', designerUserId)
      .single();

    if (!designerProfile) return;

    // Get all admin users
    const { data: admins } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('is_admin', true);

    if (!admins || admins.length === 0) return;

    // Send notification to each admin
    for (const admin of admins) {
      await supabase.rpc('send_notification', {
        p_user_id: admin.user_id,
        p_type: 'new_designer_signup',
        p_title: 'New Designer Signup',
        p_message: `New designer ${designerProfile.first_name} ${designerProfile.last_name} (${designerProfile.email}) has signed up and is pending verification.`,
        p_action_url: '/admin/designer-verification',
        p_metadata: { 
          designer_user_id: designerUserId,
          designer_name: `${designerProfile.first_name} ${designerProfile.last_name}`,
          designer_email: designerProfile.email
        }
      });
    }

    console.log('✅ Admin notifications sent for new designer signup');
  } catch (error) {
    console.error('❌ Error notifying admins about new designer:', error);
  }
};
