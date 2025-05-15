
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveUserFeedback } from "@/lib/utils/supabase-utils";

interface FeedbackFormProps {
  uniqueCode: string;
  userId?: string; // Add this optional prop to support backward compatibility
  onSubmit?: () => void;
  onComplete?: () => void; // Add this optional prop
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ uniqueCode, userId, onSubmit, onComplete }) => {
  const [rating, setRating] = useState<number>(0);
  const [comments, setComments] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use uniqueCode if provided, otherwise fall back to userId (for backward compatibility)
      const userIdentifier = uniqueCode || userId || "";
      const success = await saveUserFeedback(userIdentifier, rating, comments);
      
      if (success) {
        setSubmitted(true);
        if (onSubmit) onSubmit();
        if (onComplete) onComplete(); // Call onComplete if provided
      } else {
        alert("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("An error occurred while submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
            onClick={() => setRating(star)}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (submitted) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-xl font-bold mb-4">Thank You!</h3>
        <p>Your feedback has been submitted successfully.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Share Your Feedback</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="rating">How would you rate your experience?</Label>
          <div className="mt-2">
            <StarRating />
          </div>
        </div>
        
        <div>
          <Label htmlFor="comments">Comments (Optional)</Label>
          <Textarea
            id="comments"
            placeholder="Share your thoughts..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            className="mt-1"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || rating === 0}
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </form>
    </Card>
  );
};

export default FeedbackForm;
