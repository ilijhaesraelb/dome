/**
 * IdentityVerification — Upload and verify government-issued ID.
 * Supports passport, driver's license, state ID.
 * Optional OCR extraction via AI for name/DOB matching.
 */
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, Shield, Check, Loader2, AlertCircle, Eye, Camera, FileCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { logAuditEvent } from "@/lib/audit-logger";

interface IdentityVerificationProps {
  onVerified?: (documentId: string) => void;
  className?: string;
  compact?: boolean;
}

const ID_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "state_id", label: "State ID" },
  { value: "government_id", label: "Other Government-Issued ID" },
] as const;

const STATUS_DISPLAY: Record<string, { label: string; color: string; icon: typeof Check }> = {
  pending: { label: "Pending Review", color: "bg-warning/10 text-warning-foreground", icon: Loader2 },
  approved: { label: "Verified", color: "bg-success/10 text-success", icon: Check },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: AlertCircle },
  expired: { label: "Expired", color: "bg-muted text-muted-foreground", icon: AlertCircle },
};

const IdentityVerification = ({ onVerified, className, compact }: IdentityVerificationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docType, setDocType] = useState<string>("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch existing ID documents
  const { data: existingDocs, refetch } = useQuery({
    queryKey: ["identity-documents", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("identity_documents")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const latestDoc = existingDocs?.[0];
  const isVerified = latestDoc?.verification_status === "approved";

  const handleFileChange = (side: "front" | "back") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload an image or PDF.", variant: "destructive" });
      return;
    }
    if (side === "front") {
      setFrontFile(file);
      setFrontPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    } else {
      setBackFile(file);
      setBackPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    }
  };

  const handleUpload = async () => {
    if (!user || !docType || !frontFile) return;
    setUploading(true);
    try {
      // Upload front
      const frontPath = `${user.id}/${docType}_front_${Date.now()}.${frontFile.name.split(".").pop()}`;
      const { error: frontErr } = await supabase.storage
        .from("identity-documents")
        .upload(frontPath, frontFile, { upsert: true });
      if (frontErr) throw frontErr;

      let backPath: string | null = null;
      if (backFile) {
        backPath = `${user.id}/${docType}_back_${Date.now()}.${backFile.name.split(".").pop()}`;
        const { error: backErr } = await supabase.storage
          .from("identity-documents")
          .upload(backPath, backFile, { upsert: true });
        if (backErr) throw backErr;
      }

      // Insert record
      const { data: doc, error: docErr } = await supabase.from("identity_documents").insert({
        user_id: user.id,
        document_type: docType as any,
        file_path: frontPath,
        file_path_back: backPath,
        verification_status: "pending" as any,
      }).select("id").single();

      if (docErr) throw docErr;

      // Log event
      await supabase.from("signature_events").insert({
        user_id: user.id,
        event_type: "id_uploaded",
        identity_document_id: doc.id,
        metadata: { document_type: docType },
      });

      // Audit trail
      await logAuditEvent(user.id, {
        module: "identity",
        action_type: "id_uploaded",
        human_label: `Identity document uploaded: ${docType}`,
        target_type: "identity_document",
        target_id: doc.id,
        after_state: { document_type: docType },
      });

      toast({
        title: "✅ ID uploaded",
        description: "Your identity document has been submitted for verification.",
      });

      onVerified?.(doc.id);
      refetch();

      // Reset
      setFrontFile(null);
      setBackFile(null);
      setFrontPreview(null);
      setBackPreview(null);
      setDocType("");
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload identity document.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // If already verified, show compact status
  if (isVerified && compact) {
    return (
      <div className={cn("flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/20", className)}>
        <FileCheck className="w-4 h-4 text-success" />
        <span className="text-xs font-medium text-success">Identity Verified</span>
        <Badge variant="outline" className="text-[10px]">{latestDoc?.document_type?.replace("_", " ")}</Badge>
      </div>
    );
  }

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Identity Verification
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Upload a government-issued ID to verify your identity. Required before signing documents.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing docs */}
        {existingDocs && existingDocs.length > 0 && (
          <div className="space-y-2">
            {existingDocs.slice(0, 3).map((doc: any) => {
              const status = STATUS_DISPLAY[doc.verification_status] || STATUS_DISPLAY.pending;
              const StatusIcon = status.icon;
              return (
                <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-background">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{doc.document_type?.replace("_", " ")}</span>
                  </div>
                  <Badge className={cn("text-[10px]", status.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload new */}
        <div className="space-y-3">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {docType && (
            <>
              {/* Front */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Front of ID *</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  {frontPreview ? (
                    <img src={frontPreview} alt="Front of ID" className="max-h-32 mx-auto rounded" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Upload front of your ID</p>
                    </>
                  )}
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileChange("front")} className="hidden" id="id-front" />
                  <label htmlFor="id-front">
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <span>{frontFile ? "Replace" : "Choose File"}</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Back (optional for passport) */}
              {docType !== "passport" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Back of ID (optional)</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {backPreview ? (
                      <img src={backPreview} alt="Back of ID" className="max-h-32 mx-auto rounded" />
                    ) : (
                      <p className="text-xs text-muted-foreground">Upload back of your ID</p>
                    )}
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileChange("back")} className="hidden" id="id-back" />
                    <label htmlFor="id-back">
                      <Button variant="outline" size="sm" className="mt-2" asChild>
                        <span>{backFile ? "Replace" : "Choose File"}</span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!frontFile || uploading}
                className="w-full gap-2 h-11"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload & Submit for Verification
              </Button>
            </>
          )}
        </div>

        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
          <Shield className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Your ID is stored securely and only accessible to you and authorized reviewers. It will never be shared with other users.</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default IdentityVerification;