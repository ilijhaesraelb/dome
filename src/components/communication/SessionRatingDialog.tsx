import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface SessionRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  onRated?: () => void;
}

const RATING_FIELDS = [
  { key: "communication_clarity", label: "Communication Clarity" },
  { key: "professionalism", label: "Interpreter Professionalism" },
  { key: "usefulness", label: "Usefulness" },
  { key: "language_accuracy", label: "Language Accuracy" },
  { key: "overall_rating", label: "Overall Rating" },
];

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)} className="focus:outline-none">
        <Star className={`w-5 h-5 transition-colors ${s <= value ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
      </button>
    ))}
  </div>
);

const SessionRatingDialog = ({ open, onOpenChange, bookingId, onRated }: SessionRatingDialogProps) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({
    communication_clarity: 0,
    professionalism: 0,
    usefulness: 0,
    language_accuracy: 0,
    overall_rating: 0,
  });
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async () => {
    if (!user) return;
    if (ratings.overall_rating === 0) {
      toast({ title: "Please rate", description: "At least an overall rating is required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("interpreter_session_ratings" as any).insert({
      booking_id: bookingId,
      user_id: user.id,
      ...ratings,
      feedback: feedback || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thank you!", description: "Your feedback has been submitted." });
      onOpenChange(false);
      onRated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Session</DialogTitle>
          <DialogDescription>Help us improve language support quality.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {RATING_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center justify-between">
              <Label className="text-sm">{f.label}</Label>
              <StarRating value={ratings[f.key]} onChange={(v) => setRatings((p) => ({ ...p, [f.key]: v }))} />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label>Additional Feedback (optional)</Label>
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Any comments about your experience..." rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Submit Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionRatingDialog;
