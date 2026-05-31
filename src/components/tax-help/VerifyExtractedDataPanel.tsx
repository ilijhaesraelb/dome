/**
 * VerifyExtractedDataPanel — "Verify what AI found" screen.
 *
 * Lists every tax_field_values row with review_status='ai_needs_review' for a
 * given tax_file_id, grouped by source document. The user can:
 *   • Confirm    → review_status='user_verified', verified=true
 *   • Edit       → updates value, review_status='user_edited', verified=true
 *   • Reject     → review_status='user_rejected', verified=false
 *   • Override   → tax staff/CPA only, review_status='professional_overridden'
 *
 * Every action is appended to tax_extraction_review_actions.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Check, Pencil, X, ShieldCheck, FileText, AlertCircle } from "lucide-react";

interface FieldRow {
  id: string;
  field_key: string;
  section_key: string | null;
  field_type: string | null;
  value: string | null;
  ai_original_value: string | null;
  confidence: number | null;
  review_status: string;
  source_document_id: string | null;
  tax_file_form_id: string | null;
}

interface DocInfo { id: string; name: string; ai_classification: string | null; }

interface Props {
  taxFileId: string;
  /** "client" | "cpa" | "accountant" | "tax_staff" */
  userRole?: string;
  onAllVerified?: () => void;
}

const CONFIDENCE_TONE = (c: number | null) => {
  if (c == null) return "secondary";
  if (c >= 85) return "default";
  if (c >= 60) return "secondary";
  return "destructive";
};

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ai_needs_review: "secondary",
  ai_auto_filled: "secondary",
  user_verified: "default",
  user_edited: "default",
  user_rejected: "destructive",
  professional_overridden: "outline",
  user_entered: "outline",
};

export default function VerifyExtractedDataPanel({ taxFileId, userRole = "client", onAllVerified }: Props) {
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [docs, setDocs] = useState<Record<string, DocInfo>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const isPro = userRole === "cpa" || userRole === "accountant" || userRole === "tax_staff";

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tax_field_values")
      .select("id, field_key, section_key, field_type, value, ai_original_value, confidence, review_status, source_document_id, tax_file_form_id")
      .eq("tax_file_id", taxFileId)
      .in("review_status", ["ai_needs_review", "ai_auto_filled", "user_edited", "user_verified", "user_rejected", "professional_overridden"]) as any;
    if (error) {
      toast({ title: "Could not load", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setRows(data || []);

    const docIds = Array.from(new Set((data || []).map((r: FieldRow) => r.source_document_id).filter(Boolean))) as string[];
    if (docIds.length) {
      const { data: docData } = await supabase
        .from("tax_file_documents")
        .select("id, name, ai_classification")
        .in("id", docIds);
      const map: Record<string, DocInfo> = {};
      (docData || []).forEach((d: any) => { map[d.id] = d; });
      setDocs(map);
    }
    setLoading(false);
  };

  useEffect(() => { if (taxFileId) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [taxFileId]);

  const grouped = useMemo(() => {
    const out: Record<string, FieldRow[]> = {};
    for (const r of rows) {
      const key = r.source_document_id || "manual";
      (out[key] ||= []).push(r);
    }
    return out;
  }, [rows]);

  const pendingCount = rows.filter(r => r.review_status === "ai_needs_review" || r.review_status === "ai_auto_filled").length;

  const recordAction = async (row: FieldRow, action: string, newValue: string | null) => {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("tax_extraction_review_actions").insert({
      tax_file_id: taxFileId,
      tax_field_value_id: row.id,
      field_key: row.field_key,
      action,
      previous_value: row.value,
      new_value: newValue,
      performed_by: u?.user?.id,
      performed_role: userRole,
    });
  };

  const update = async (row: FieldRow, patch: Partial<FieldRow>, action: string) => {
    const { error } = await supabase.from("tax_field_values").update({
      ...patch,
      verified_at: new Date().toISOString(),
    } as any).eq("id", row.id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    await recordAction(row, action, patch.value ?? row.value);
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, ...patch } : r));
  };

  const handleConfirm = (row: FieldRow) =>
    update(row, { review_status: "user_verified", verified: true } as any, "confirm");

  const handleSaveEdit = (row: FieldRow) => {
    const next = editing[row.id];
    update(row, { value: next, review_status: "user_edited", verified: true } as any, "edit").then(() => {
      setEditing(e => { const n = { ...e }; delete n[row.id]; return n; });
    });
  };

  const handleReject = (row: FieldRow) =>
    update(row, { review_status: "user_rejected", verified: false } as any, "reject");

  const handleOverride = (row: FieldRow) => {
    const next = editing[row.id] ?? row.value ?? "";
    update(row, { value: next, review_status: "professional_overridden", verified: true } as any, "override").then(() => {
      setEditing(e => { const n = { ...e }; delete n[row.id]; return n; });
    });
  };

  useEffect(() => {
    if (!loading && pendingCount === 0 && rows.length > 0) onAllVerified?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCount, loading]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No AI-extracted values yet. Upload tax documents and run analysis to populate fields here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Verify what AI found</h2>
          <p className="text-sm text-muted-foreground">
            Confirm each value before it's used on your return. You can edit or reject anything.
          </p>
        </div>
        <Badge variant={pendingCount === 0 ? "default" : "secondary"}>
          {pendingCount === 0 ? "All verified" : `${pendingCount} to review`}
        </Badge>
      </div>

      {Object.entries(grouped).map(([docId, items]) => {
        const doc = docs[docId];
        return (
          <Card key={docId}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                {doc?.name ?? "Manual entries"}
                {doc?.ai_classification && (
                  <Badge variant="outline" className="ml-2 uppercase text-xs">{doc.ai_classification}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((row) => {
                const isEditing = row.id in editing;
                return (
                  <div key={row.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{row.field_key}</span>
                          <Badge variant={STATUS_TONE[row.review_status] ?? "secondary"} className="text-xs">
                            {row.review_status.replace(/_/g, " ")}
                          </Badge>
                          {row.confidence != null && (
                            <Badge variant={CONFIDENCE_TONE(row.confidence) as any} className="text-xs">
                              {Math.round(row.confidence)}% confidence
                            </Badge>
                          )}
                        </div>
                        {row.section_key && (
                          <div className="text-xs text-muted-foreground mt-0.5">Section: {row.section_key}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Input
                          value={editing[row.id]}
                          onChange={(e) => setEditing(prev => ({ ...prev, [row.id]: e.target.value }))}
                          className="h-9 max-w-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="font-mono text-sm bg-muted/30 px-3 py-1.5 rounded">
                          {row.value || <span className="text-muted-foreground italic">empty</span>}
                        </div>
                      )}
                      {row.ai_original_value && row.value !== row.ai_original_value && (
                        <span className="text-xs text-muted-foreground">
                          AI said: <code>{row.ai_original_value}</code>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {!isEditing ? (
                        <>
                          <Button size="sm" onClick={() => handleConfirm(row)} disabled={row.review_status === "user_verified"}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditing(prev => ({ ...prev, [row.id]: row.value ?? "" }))}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReject(row)}>
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                          {isPro && (
                            <Button size="sm" variant="secondary" onClick={() => setEditing(prev => ({ ...prev, [row.id]: row.value ?? "" }))}>
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Override
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => handleSaveEdit(row)}>Save edit</Button>
                          {isPro && (
                            <Button size="sm" variant="secondary" onClick={() => handleOverride(row)}>
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Save as override
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setEditing(e => { const n = { ...e }; delete n[row.id]; return n; })}>
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
