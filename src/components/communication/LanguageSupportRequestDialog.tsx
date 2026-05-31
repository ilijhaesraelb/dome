import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguagePreferences } from "@/hooks/useLanguagePreferences";
import { SUPPORTED_LANGUAGES } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";

interface Props {
  caseId?: string;
  trigger?: React.ReactNode;
}

const LanguageSupportRequestDialog = ({ caseId, trigger }: Props) => {
  const { user } = useAuth();
  const { prefs } = useLanguagePreferences();
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState("translator");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("language_support_requests" as any).insert({
      user_id: user.id,
      case_id: caseId || null,
      support_type: requestType === "translator" ? "written_translation" : requestType === "interpreter" ? "live_interpreter" : "case_communication",
      preferred_language: prefs.preferred_language,
      description: description || null,
      urgency: "within_3_days",
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request submitted", description: "Your language support request has been sent to the team." });
      setOpen(false);
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Headphones className="w-4 h-4" /> Request Language Support
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-secondary" />
            Request Language Support
          </DialogTitle>
          <DialogDescription>
            Request human assistance when AI translation isn't enough.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Type of Support</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="translator">Request Translator</SelectItem>
                <SelectItem value="interpreter">Request Interpreter</SelectItem>
                <SelectItem value="staff_support">Request Staff Support in My Language</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Your Language</Label>
            <Select value={prefs.preferred_language} disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Additional Details (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need help with..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Request
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            D.O.M.E. does not provide legal advice. Language support is for communication only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageSupportRequestDialog;
