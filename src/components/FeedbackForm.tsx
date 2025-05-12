
import React, { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveUserFeedback } from "@/lib/utils/supabase-utils";
import { useToast } from "@/hooks/use-toast";

interface FeedbackFormProps {
  userId: string;
  onComplete: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ userId, onComplete }) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await saveUserFeedback(userId, rating, comments);
      
      toast({
        title: "Thank You for Your Feedback!",
        description: "Your feedback helps us improve our system."
      });
      
      onComplete();
      
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast({
        title: "Error Saving Feedback",
        description: "Please try again later.",
        variant: "destructive"
      });
      
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: "Feedback Skipped",
      description: "You can always provide feedback later."
    });
    onComplete();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">How was your experience?</h2>
      
      <div className="flex justify-center my-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="mx-1 focus:outline-none"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            <Star
              size={36}
              fill={(hoveredRating || rating) >= star ? "#FFD700" : "none"}
              color={(hoveredRating || rating) >= star ? "#FFD700" : "#CBD5E1"}
            />
          </button>
        ))}
      </div>
      
      <div className="mb-6">
        <label className="flex items-center text-sm text-gray-600 mb-2">
          <MessageSquare size={16} className="mr-2" />
          Additional comments (optional)
        </label>
        <Textarea
          placeholder="Tell us what you liked or how we can improve..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
        />
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleSkip}
          disabled={isSubmitting}
        >
          Skip
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
};

export default FeedbackForm;
