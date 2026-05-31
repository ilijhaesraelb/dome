/**
 * ProSourceVsFormTab — Side-by-side source ↔ extracted ↔ internal answer view.
 * The reviewer's bread-and-butter screen.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Edit3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { recordExtractionAction } from "@/lib/tax-pro/lifecycle";

const ProSourceVsFormTab = ({ fileId, caps }: { fileId: string; caps: any }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tax_field_values")
      .select("*, tax_documents ( source_filename, document_type )")
      .eq("tax_file_id", fileId)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [fileId]);

  const act = async (row: any, action: "confirmed" | "rejected" | "edited" | "overridden", newValue?: string) => {
    const patch: any = {
      review_status: action === "confirmed" ? "confirmed" : action === "rejected" ? "rejected" : action === "overridden" ? "overridden" : "edited",
    };
    if (newValue != null) patch.value = newValue;
    const { error } = await supabase.from("tax_field_values").update(patch).eq("id", row.id);
    if (error) return toast.error(error.message);
    await recordExtractionAction(row.id, action, { previous_value: row.value, new_value: newValue ?? row.value });
    toast.success(`Field ${action}`);
    setEditing((e) => { const { [row.id]: _, ...rest } = e; return rest; });
    load();
  };

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;
  if (!rows.length) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No extracted values yet. Upload documents to start.</CardContent></Card>;

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-card text-xs font-medium text-muted-foreground">
        <div className="grid grid-cols-12 gap-2 border-b border-border p-2">
          <div className="col-span-3">Source document</div>
          <div className="col-span-3">Field</div>
          <div className="col-span-3">Extracted value</div>
          <div className="col-span-1 text-center">Conf.</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {rows.map((r) => {
          const doc = Array.isArray(r.tax_documents) ? r.tax_documents[0] : r.tax_documents;
          const status = r.review_status ?? "ai_needs_review";
          const tone = status === "confirmed" || status === "overridden" ? "default" : status === "rejected" ? "destructive" : "secondary";
          const isEditing = editing[r.id] !== undefined;
          return (
            <div key={r.id} className="grid grid-cols-12 items-center gap-2 border-b border-border/60 p-2 text-xs last:border-0">
              <div className="col-span-3 truncate">
                <p className="truncate font-medium text-foreground">{doc?.source_filename ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">{doc?.document_type ?? "—"}</p>
              </div>
              <div className="col-span-3">
                <p className="font-mono text-[11px] text-foreground truncate">{r.field_key}</p>
                <Badge variant={tone as any} className="mt-0.5 text-[9px] capitalize">{status.replace(/_/g, " ")}</Badge>
              </div>
              <div className="col-span-3">
                {isEditing ? (
                  <Input value={editing[r.id]} onChange={(e) => setEditing((s) => ({ ...s, [r.id]: e.target.value }))} className="h-7 text-xs" />
                ) : (
                  <p className="font-mono text-foreground truncate">{r.value ?? "—"}</p>
                )}
                {r.original_ai_value && r.original_ai_value !== r.value && (
                  <p className="text-[10px] text-muted-foreground line-through truncate">AI: {r.original_ai_value}</p>
                )}
              </div>
              <div className="col-span-1 text-center">
                {typeof r.confidence_score === "number" ? `${Math.round(r.confidence_score * 100)}%` : "—"}
              </div>
              <div className="col-span-2 flex justify-end gap-1">
                {isEditing ? (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => act(r, caps.canOverride ? "overridden" : "edited", editing[r.id])}><Check className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing((e) => { const { [r.id]: _, ...rest } = e; return rest; })}><X className="h-3.5 w-3.5" /></Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Confirm" onClick={() => act(r, "confirmed")}><Check className="h-3.5 w-3.5 text-emerald-600" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit" onClick={() => setEditing((s) => ({ ...s, [r.id]: r.value ?? "" }))}><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Reject" onClick={() => act(r, "rejected")}><X className="h-3.5 w-3.5 text-destructive" /></Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ProSourceVsFormTab;