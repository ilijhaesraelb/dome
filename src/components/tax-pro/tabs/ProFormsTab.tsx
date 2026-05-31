import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import FormSectionDeepLinks from "@/components/tax-pro/FormSectionDeepLinks";
import { recordLifecycleEvent } from "@/lib/tax-pro/lifecycle";

const ProFormsTab = ({ fileId, caps }: { fileId: string; caps: any }) => {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tax_file_forms").select("*").eq("tax_file_id", fileId).order("form_code");
    setForms(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [fileId]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tax_file_forms").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    await recordLifecycleEvent(fileId, "form_status_changed", { form_id: id, status });
    toast.success("Updated");
    load();
  };

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;
  if (!forms.length) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No forms selected yet.</CardContent></Card>;

  return (
    <Card><CardContent className="p-3 space-y-2">
      {forms.map((f) => {
        const open = !!expanded[f.id];
        return (
          <div key={f.id} className="rounded-md border border-border bg-background">
            <div className="flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => setExpanded((p) => ({ ...p, [f.id]: !open }))}
                className="text-muted-foreground hover:text-foreground"
                aria-label={open ? "Collapse sections" : "Expand sections"}
              >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase">{f.form_code}</p>
                <p className="text-[11px] text-muted-foreground">TY {f.form_year ?? "—"} · {f.required_or_optional ?? "—"}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] capitalize">{String(f.status).replace(/_/g, " ")}</Badge>
              {caps.canReview && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setStatus(f.id, "ready_for_preview")}>Mark ready</Button>
                  {caps.canOverride && <Button size="sm" variant="ghost" onClick={() => setStatus(f.id, "blocked")}>Block</Button>}
                </div>
              )}
            </div>
            {open && (
              <div className="border-t border-border bg-muted/30 px-3 pb-3 pt-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Jump to section</p>
                <FormSectionDeepLinks fileId={fileId} formCode={f.form_code} />
              </div>
            )}
          </div>
        );
      })}
    </CardContent></Card>
  );
};
export default ProFormsTab;