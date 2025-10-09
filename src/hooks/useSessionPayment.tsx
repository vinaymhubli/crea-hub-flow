import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SessionPaymentData {
  sessionId: string;
  amount: number;
  customerId: string;
  designerId: string;
  sessionType?: string;
  duration?: number;
}

export function useSessionPayment() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const processSessionPayment = async (paymentData: SessionPaymentData) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-session-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Session payment processed successfully!');
        return {
          success: true,
          customerTransaction: result.customerTransaction,
          designerTransaction: result.designerTransaction,
          sessionId: result.sessionId
        };
      } else {
        toast.error(result.error || 'Failed to process session payment');
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Session payment error:', error);
      toast.error('Failed to process session payment. Please try again.');
      return {
        success: false,
        error: 'Failed to process session payment'
      };
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async (sessionData: {
    sessionId: string;
    amount: number;
    designerId: string;
    sessionType?: string;
    duration?: number;
  }) => {
    if (!user) {
      toast.error('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    return await processSessionPayment({
      sessionId: sessionData.sessionId,
      amount: sessionData.amount,
      customerId: user.id,
      designerId: sessionData.designerId,
      sessionType: sessionData.sessionType,
      duration: sessionData.duration
    });
  };

  return {
    processSessionPayment,
    completeSession,
    loading
  };
}


















