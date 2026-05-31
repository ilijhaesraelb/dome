/**
 * Professional Review Request page
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, UserCheck, Shield, Send } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";

const TaxReviewRequest = () => {
  const { toast } = useToast();
  const [reviewType, setReviewType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    toast({ title: "Review request submitted", description: "A professional will be assigned shortly." });
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
        <h1 className="text-2xl font-display font-bold">Review Request Submitted</h1>
        <p className="text-muted-foreground">We've received your request for professional review. You'll be notified when a reviewer is assigned.</p>
        <Button onClick={() => setSubmitted(false)} variant="outline">Submit Another Request</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <BackButton />
      <div>
        <Badge className="bg-primary/10 text-primary border-0 mb-2">Professional Review</Badge>
        <h1 className="text-2xl font-display font-bold">Request Expert Review</h1>
        <p className="text-sm text-muted-foreground mt-1">Have a qualified professional review your filing before submission.</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">What needs review?</label>
            <Select value={reviewType} onValueChange={setReviewType}>
              <SelectTrigger><SelectValue placeholder="Select review type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual_return">Individual Tax Return</SelectItem>
                <SelectItem value="nonprofit_990">Nonprofit 990 Filing</SelectItem>
                <SelectItem value="extension">Extension Filing</SelectItem>
                <SelectItem value="bookkeeping">Bookkeeping / Records</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Additional Notes</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe what you need help with..." rows={4} />
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> <span className="font-medium">$50 Professional Review Fee</span></div>
            <p>A qualified reviewer will examine your documents, verify accuracy, and flag any issues before filing.</p>
          </div>

          <Button onClick={handleSubmit} className="w-full gap-2" disabled={!reviewType}>
            <Send className="w-4 h-4" /> Submit Review Request
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 text-muted-foreground/40 text-[10px]">
        <Shield className="w-3 h-3" /> <span>Secure • Confidential</span>
      </div>
    </div>
  );
};

export default TaxReviewRequest;
