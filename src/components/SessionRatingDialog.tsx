import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SessionRatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRatingComplete: () => void;
  designerName: string;
  sessionId: string;
  customerId: string;
}

export default function SessionRatingDialog({
  isOpen,
  onClose,
  onRatingComplete,
  designerName,
  sessionId,
  customerId
}: SessionRatingDialogProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRatingSubmit = async () => {
    console.log('🌟 Starting rating submission:', {
      sessionId,
      customerId,
      designerName,
      rating,
      reviewText: review.trim()
    });

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Resolve authoritative designer name from DB to avoid saving placeholder like "Designer"
      let resolvedDesignerName = designerName;
      try {
        const { data: sessionRow } = await supabase
          .from('active_sessions')
          .select('designer_id')
          .eq('session_id', sessionId)
          .single();
        if (sessionRow?.designer_id) {
          const { data: designerUser } = await supabase
            .from('designers')
            .select('user_id')
            .eq('id', sessionRow.designer_id)
            .single();
          if (designerUser?.user_id) {
            const { data: profileRow } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', designerUser.user_id)
              .single();
            if (profileRow) {
              const full = `${profileRow.first_name || ''} ${profileRow.last_name || ''}`.trim();
              if (full) resolvedDesignerName = full;
            }
          }
        }
      } catch (_e) {
        // non-fatal; fallback to provided designerName
      }

      // Create session review record
      console.log('📝 Inserting review into session_reviews table...');
      const { data: insertedReview, error: reviewError } = await supabase
        .from('session_reviews')
        .insert({
          session_id: sessionId,
          customer_id: customerId,
          designer_name: resolvedDesignerName,
          rating: rating,
          review_text: review.trim() || null,
          review_date: new Date().toISOString()
        })
        .select()
        .single();

      if (reviewError) {
        console.error('❌ Error inserting review:', reviewError);
        throw reviewError;
      }

      console.log('✅ Review inserted successfully:', insertedReview);

      // Get designer ID from session to update their rating
      const { data: sessionData } = await supabase
        .from('active_sessions')
        .select('designer_id')
        .eq('session_id', sessionId)
        .single();

      if (sessionData?.designer_id) {
        // Get all reviews for this designer to calculate new average
        const { data: existingReviews, error: fetchError } = await supabase
          .from('session_reviews')
          .select('rating')
          .eq('designer_name', designerName);

        if (!fetchError && existingReviews) {
          const totalRating = existingReviews.reduce((sum, r) => sum + r.rating, 0);
          const averageRating = Number((totalRating / existingReviews.length).toFixed(2));

          // Update designer profile with new average rating
          const { error: updateError } = await supabase
            .from('designers')
            .update({ 
              average_rating: averageRating,
              total_reviews: existingReviews.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionData.designer_id);

          if (updateError) {
            console.error('Error updating designer rating:', updateError);
          } else {
            console.log(`✅ Updated designer rating: ${averageRating} (${existingReviews.length} reviews)`);
          }
        }
      }

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback! Your review has been submitted successfully.",
      });

      onRatingComplete();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRating(0);
    setReview('');
    setHoveredRating(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Rate Your Experience
          </CardTitle>
          <p className="text-gray-600 mt-2">
            How was your design session with {designerName}?
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <div className="flex justify-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {rating === 0 && "Tap a star to rate"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Write a Review (Optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this designer..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {review.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRatingSubmit}
              disabled={isSubmitting || rating === 0}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 text-lg font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit Rating'
              )}
            </Button>
            
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your feedback helps improve our design services and helps other customers make informed decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
