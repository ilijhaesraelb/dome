/**
 * RequestHelpDialog — Allows clients to submit a help request
 * that attorneys/providers can see and accept via FirmIntakeQueue.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Building2, Users, Loader2, Send } from "lucide-react";
import { useSubmitIntakeRequest } from "@/hooks/useSubmitIntakeRequest";
import { useEnsureCase } from "@/hooks/useEnsureCase";

interface RequestHelpDialogProps {
  trigger?: React.ReactNode;
}

const RequestHelpDialog = ({ trigger }: RequestHelpDialogProps) => {
  const [open, setOpen] = useState(false);
  const [caseType, setCaseType] = useState("family");
  const [urgency, setUrgency] = useState("normal");
  const [notes, setNotes] = useState("");
  const { caseId } = useEnsureCase();
  const submitRequest = useSubmitIntakeRequest();

  const handleSubmit = async () => {
    await submitRequest.mutateAsync({
      caseId: caseId || undefined,
      caseType,
      urgency,
      notes: notes.trim() || undefined,
    });
    setOpen(false);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Scale className="w-4 h-4" /> Request Professional Help
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Professional Help</DialogTitle>
          <DialogDescription>
            Submit a request for an attorney, accredited representative, or organization to assist with your case.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Case Type</Label>
            <Select value={caseType} onValueChange={setCaseType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family-Based Immigration</SelectItem>
                <SelectItem value="employment">Employment-Based</SelectItem>
                <SelectItem value="asylum">Asylum / Refugee</SelectItem>
                <SelectItem value="naturalization">Naturalization</SelectItem>
                <SelectItem value="removal">Removal Defense</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Urgency</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — No deadline</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High — Upcoming deadline</SelectItem>
                <SelectItem value="urgent">Urgent — Immediate need</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Briefly describe what help you need…"
              rows={3}
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={submitRequest.isPending}
          >
            {submitRequest.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestHelpDialog;
