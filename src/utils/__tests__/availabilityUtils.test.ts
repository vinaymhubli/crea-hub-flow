import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDesignerBookingAvailability, checkDesignerAvailabilityForDateTime } from '../availabilityUtils';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

describe('availabilityUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDesignerBookingAvailability', () => {
    it('should return available when designer is in schedule and online', async () => {
      // Mock current time as Monday 10:00 AM
      const mockDate = new Date('2024-01-15T10:00:00Z'); // Monday
      vi.setSystemTime(mockDate);

      // Mock supabase responses
      const mockSupabase = await import('@/integrations/supabase/client');
      const mockFrom = vi.mocked(mockSupabase.supabase.from);
      
      // Mock designer data (online)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_online: true, user_id: 'user123' },
              error: null
            })
          })
        })
      } as any);

      // Mock no special days
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows found
            })
          })
        })
      } as any);

      // Mock weekly schedule (available Monday 9:00-17:00)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_available: true, start_time: '09:00', end_time: '17:00' },
              error: null
            })
          })
        })
      } as any);

      const result = await checkDesignerBookingAvailability('designer123');
      
      expect(result.isAvailable).toBe(true);
      expect(result.isInSchedule).toBe(true);
      expect(result.isOnline).toBe(true);
    });

    it('should return unavailable when outside scheduled hours', async () => {
      // Mock current time as Monday 8:00 AM (before schedule)
      const mockDate = new Date('2024-01-15T08:00:00Z'); // Monday
      vi.setSystemTime(mockDate);

      const mockSupabase = await import('@/integrations/supabase/client');
      const mockFrom = vi.mocked(mockSupabase.supabase.from);
      
      // Mock designer data
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_online: true, user_id: 'user123' },
              error: null
            })
          })
        })
      } as any);

      // Mock no special days
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      } as any);

      // Mock weekly schedule (available Monday 9:00-17:00)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_available: true, start_time: '09:00', end_time: '17:00' },
              error: null
            })
          })
        })
      } as any);

      const result = await checkDesignerBookingAvailability('designer123');
      
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toBe('Current time is outside scheduled hours');
      expect(result.isInSchedule).toBe(false);
    });
  });

  describe('checkDesignerAvailabilityForDateTime', () => {
    it('should return available for scheduled time within hours', async () => {
      const scheduledDateTime = '2024-01-15T14:00:00Z'; // Monday 2:00 PM

      const mockSupabase = await import('@/integrations/supabase/client');
      const mockFrom = vi.mocked(mockSupabase.supabase.from);
      
      // Mock no special days
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      } as any);

      // Mock weekly schedule (available Monday 9:00-17:00)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_available: true, start_time: '09:00', end_time: '17:00' },
              error: null
            })
          })
        })
      } as any);

      const result = await checkDesignerAvailabilityForDateTime('designer123', scheduledDateTime);
      
      expect(result.isAvailable).toBe(true);
      expect(result.isInSchedule).toBe(true);
    });
  });
});
