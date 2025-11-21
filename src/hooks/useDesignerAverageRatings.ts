import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DesignerInfo {
  id: string;
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

export const useDesignerAverageRatings = (designers: DesignerInfo[]) => {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedDesigners = useMemo(
    () =>
      (designers || []).map((designer) => ({
        id: designer.id,
        name: `${designer.profiles?.first_name || ''} ${designer.profiles?.last_name || ''}`
          .trim(),
      })),
    [designers]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchRatings = async () => {
      if (!normalizedDesigners.length) {
        setRatings({});
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const designerIds = normalizedDesigners.map((designer) => designer.id);

        const { data: sessionRows, error: sessionsError } = await supabase
          .from('active_sessions')
          .select('designer_id, session_id')
          .in('designer_id', designerIds);

        if (sessionsError) {
          throw sessionsError;
        }

        const sessionsByDesigner: Record<string, string[]> = {};
        const allSessionIds: string[] = [];

        (sessionRows || []).forEach((row) => {
          if (!row?.designer_id || !row?.session_id) return;
          if (!sessionsByDesigner[row.designer_id]) {
            sessionsByDesigner[row.designer_id] = [];
          }
          sessionsByDesigner[row.designer_id].push(row.session_id);
          allSessionIds.push(row.session_id);
        });

        let ratingBySession = new Map<string, number>();
        if (allSessionIds.length) {
          const { data: sessionReviews, error: reviewsError } = await supabase
            .from('session_reviews')
            .select('session_id, rating')
            .in('session_id', allSessionIds);

          if (reviewsError) {
            throw reviewsError;
          }

          sessionReviews?.forEach((review) => {
            if (!review?.session_id) return;
            const ratingValue = Number((review as any).rating) || 0;
            if (ratingValue > 0) {
              ratingBySession.set(review.session_id, ratingValue);
            }
          });
        }

        const results: Record<string, number> = {};
        const designersNeedingNameLookup = new Set<string>();

        normalizedDesigners.forEach(({ id }) => {
          const sessionIds = sessionsByDesigner[id] || [];
          if (!sessionIds.length) {
            designersNeedingNameLookup.add(id);
            return;
          }

          const sessionRatings = sessionIds
            .map((sessionId) => ratingBySession.get(sessionId) || 0)
            .filter((rating) => rating > 0);

          if (!sessionRatings.length) {
            designersNeedingNameLookup.add(id);
            return;
          }

          const avg =
            Math.round(
              (sessionRatings.reduce((acc, rating) => acc + rating, 0) /
                sessionRatings.length) *
                10
            ) / 10;
          results[id] = avg;
        });

        const nameToDesignerIds: Record<string, string[]> = {};
        normalizedDesigners.forEach(({ id, name }) => {
          if (!designersNeedingNameLookup.has(id)) return;
          if (!name) return;
          if (!nameToDesignerIds[name]) {
            nameToDesignerIds[name] = [];
          }
          nameToDesignerIds[name].push(id);
        });

        const fallbackNames = Object.keys(nameToDesignerIds);

        if (fallbackNames.length) {
          const { data: nameReviews, error: nameError } = await supabase
            .from('session_reviews')
            .select('designer_name, rating')
            .in('designer_name', fallbackNames);

          if (nameError) {
            throw nameError;
          }

          const ratingsByName: Record<string, number[]> = {};

          nameReviews?.forEach((review) => {
            const designerName = (review as any).designer_name;
            const ratingValue = Number((review as any).rating) || 0;
            if (!designerName || ratingValue <= 0) return;
            if (!ratingsByName[designerName]) {
              ratingsByName[designerName] = [];
            }
            ratingsByName[designerName].push(ratingValue);
          });

          Object.entries(nameToDesignerIds).forEach(([name, ids]) => {
            const ratingValues = ratingsByName[name] || [];
            if (!ratingValues.length) {
              ids.forEach((id) => {
                if (results[id] === undefined) {
                  results[id] = 0;
                }
              });
              return;
            }

            const avg =
              Math.round(
                (ratingValues.reduce((acc, rating) => acc + rating, 0) /
                  ratingValues.length) *
                  10
              ) / 10;

            ids.forEach((id) => {
              results[id] = avg;
            });
          });
        }

        normalizedDesigners.forEach(({ id }) => {
          if (results[id] === undefined) {
            results[id] = 0;
          }
        });

        if (isMounted) {
          setRatings(results);
        }
      } catch (err) {
        console.error('Error fetching designer ratings:', err);
        if (isMounted) {
          setError('Failed to load designer ratings');
          setRatings({});
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRatings();

    return () => {
      isMounted = false;
    };
  }, [normalizedDesigners]);

  return { ratings, loading, error };
};


