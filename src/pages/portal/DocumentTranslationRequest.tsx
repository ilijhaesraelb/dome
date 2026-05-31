import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, AlertTriangle, Upload, CheckCircle, Paperclip } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";

const REQUEST_TYPES = [
  { value: "understanding", label: "Translation for Understanding" },
  { value: "communication", label: "Translation for Communication Support" },
  { value: "plain_language", label: "Plain-Language Explanation" },
  { value: "certified_referral", label: "Certified Translation Request (Referral)" },
];

const PRICING_MODES = [
  { value: "free", label: "Free / Sponsored" },
  { value: "paid", label: "Paid Translation" },
  { value: "subscription", label: "Included in Subscription" },
];

const DocumentTranslationRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; path: string } | null>(null);
  const [cases, setCases] = useState<any[]>([]);

  const [form, setForm] = useState({
    document_title: "",
    source_language: "en",
    target_language: "es",
    request_type: "understanding",
    pricing_mode: "free",
    deadline: "",
    notes: "",
    case_id: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("cases").select("id, case_number, case_type").eq("created_by", user.id).order("created_at", { ascending: false }).limit(20).then(({ data }) => {
      setCases((data as any[]) || []);
    });
  }, [user]);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/translations/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("case-documents").upload(filePath, file);
    setUploading(false);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      setUploadedFile({ name: file.name, path: filePath });
      toast({ title: "File uploaded", description: file.name });
    }
  };

  const handleSubmit = async () => {
    if (!user || !form.document_title) {
      toast({ title: "Missing fields", description: "Please enter a document title.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("document_translation_requests" as any).insert({
      user_id: user.id,
      document_title: form.document_title,
      source_language: form.source_language,
      target_language: form.target_language,
      request_type: form.request_type,
      pricing_mode: form.pricing_mode,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      notes: form.notes || null,
      file_path: uploadedFile?.path || null,
      case_id: form.case_id || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      toast({ title: "Request Submitted", description: "Your document translation request has been sent." });
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
        <h2 className="font-display text-2xl font-bold">Request Submitted!</h2>
        <p className="text-muted-foreground text-sm">Our team will review your request and get back to you soon.</p>
        <Button onClick={() => navigate("/portal/language-support")}>Back to Language Support Center</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <BackButton />

      <div className="bg-primary rounded-xl p-6 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" /> Document Translation Request
        </h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Submit a request for written document translation</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label>Document Title *</Label>
            <Input value={form.document_title} onChange={(e) => update("document_title", e.target.value)} placeholder="e.g., Birth Certificate, I-94 Record" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Source Language</Label>
              <Select value={form.source_language} onValueChange={(v) => update("source_language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Language</Label>
              <Select value={form.target_language} onValueChange={(v) => update("target_language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Request Type</Label>
              <Select value={form.request_type} onValueChange={(v) => update("request_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service Mode</Label>
              <Select value={form.pricing_mode} onValueChange={(v) => update("pricing_mode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRICING_MODES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.request_type === "certified_referral" && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
              <strong>Note:</strong> Certified translations require professional review. This request will be routed to an approved provider. Separate fees may apply.
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-1.5">
            <Label>Upload Document (optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Paperclip className="w-4 h-4 text-secondary" />
                  <span className="font-medium">{uploadedFile.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => setUploadedFile(null)}>Remove</Button>
                </div>
              ) : uploading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload document</p>
                  <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG, DOCX · Max 20MB</p>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.docx,.doc" onChange={handleFileUpload} />
                </label>
              )}
            </div>
          </div>

          {cases.length > 0 && (
            <div className="space-y-1.5">
              <Label>Link to Case (optional)</Label>
              <Select value={form.case_id} onValueChange={(v) => update("case_id", v)}>
                <SelectTrigger><SelectValue placeholder="No case linked" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No case linked</SelectItem>
                  {cases.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.case_number} — {c.case_type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Deadline (optional)</Label>
            <Input type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any additional details..." rows={3} />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Submit Translation Request
          </Button>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border">
            <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">
              If certified translation is required for official filing, users should confirm requirements with a qualified professional or approved provider. D.O.M.E. does not provide legal advice.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentTranslationRequest;
