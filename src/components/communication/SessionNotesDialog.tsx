import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SessionNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  interpreterId: string;
  languagePair?: string;
  supportType?: string;
  onSaved?: () => void;
}

const SessionNotesDialog = ({ open, onOpenChange, bookingId, interpreterId, languagePair, supportType, onSaved }: SessionNotesDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [durationActual, setDurationActual] = useState("");
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("interpreter_session_notes" as any).insert({
      booking_id: bookingId,
      interpreter_id: interpreterId,
      duration_actual: durationActual ? parseInt(durationActual) : null,
      language_pair: languagePair || null,
      support_type: supportType || null,
      note: note || null,
      follow_up_recommended: followUp,
    } as any);

    // Also mark booking as completed
    await supabase.from("interpreter_bookings" as any).update({ status: "completed" } as any).eq("id", bookingId);

    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Session Logged", description: "Session notes have been saved." });
      onOpenChange(false);
      onSaved?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Session Notes</DialogTitle>
          <DialogDescription>Record administrative details for this completed session.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Actual Duration (minutes)</Label>
            <Input type="number" value={durationActual} onChange={(e) => setDurationActual(e.target.value)} placeholder="e.g., 30" />
          </div>
          <div className="space-y-1.5">
            <Label>Administrative Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Brief session note (no legal details)..." rows={3} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Follow-up Recommended?</Label>
            <Switch checked={followUp} onCheckedChange={setFollowUp} />
          </div>
          <p className="text-[10px] text-muted-foreground">Keep notes administrative. Do not include sensitive legal summaries.</p>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Session Notes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionNotesDialog;
