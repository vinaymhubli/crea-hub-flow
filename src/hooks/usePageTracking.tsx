import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getDeviceInfo } from '@/utils/deviceTracking';

/**
 * Hook to track page views with browser and device information
 */
export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        const deviceInfo = getDeviceInfo();
        const referrer = document.referrer || null;

        // Insert page view into database
        const { error } = await supabase
          .from('page_views')
          .insert({
            user_id: user?.id || null,
            page_path: location.pathname + location.search,
            browser_name: deviceInfo.browserName,
            browser_version: deviceInfo.browserVersion,
            device_type: deviceInfo.deviceType,
            os_name: deviceInfo.osName,
            os_version: deviceInfo.osVersion,
            user_agent: deviceInfo.userAgent,
            referrer: referrer
          });

        if (error) {
          console.error('Error tracking page view:', error);
        }
      } catch (error) {
        console.error('Error in page tracking:', error);
      }
    };

    // Small delay to ensure page is fully loaded
    const timeoutId = setTimeout(trackPageView, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search, user?.id]);
}

