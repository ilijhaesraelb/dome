import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Lock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { recordLifecycleEvent } from "@/lib/tax-pro/lifecycle";

interface Props { file: any; client: any; caps: any; }

const ADVANCEMENTS: Record<string, string> = {
  not_started: "documents_uploaded",
  documents_uploaded: "ai_analyzing",
  ai_analyzing: "awaiting_verification",
  awaiting_verification: "profile_confirmed",
  profile_confirmed: "forms_selected",
  forms_selected: "in_preparation",
  in_preparation: "review_required",
  review_required: "ready_for_preview",
  ready_for_preview: "ready_for_payment",
  ready_for_payment: "paid",
  paid: "ready_for_export",
  ready_for_export: "exported",
};

const ProOverviewTab = ({ file, client, caps }: Props) => {
  const [counts, setCounts] = useState({ docs: 0, forms: 0, issues: 0, blockers: 0 });

  useEffect(() => {
    (async () => {
      const [d, fr, iss] = await Promise.all([
        (supabase.from("tax_documents") as any).select("id", { count: "exact", head: true }).eq("tax_file_id", file.id),
        (supabase.from("tax_file_forms") as any).select("id", { count: "exact", head: true }).eq("tax_file_id", file.id),
        (supabase.from("tax_review_issues") as any).select("severity, status").eq("tax_file_id", file.id),
      ]);
      const open = (iss.data ?? []).filter((i: any) => i.status !== "resolved" && i.status !== "suppressed");
      setCounts({
        docs: d.count ?? 0,
        forms: fr.count ?? 0,
        issues: open.length,
        blockers: open.filter((i: any) => i.severity === "blocker").length,
      });
    })();
  }, [file.id]);

  const advance = async () => {
    const next = ADVANCEMENTS[file.status];
    if (!next) return toast.info("Already at terminal state");
    const { error } = await (supabase.from("tax_files") as any).update({ status: next }).eq("id", file.id);
    if (error) return toast.error(error.message);
    await recordLifecycleEvent(file.id, "status_advanced", { from: file.status, to: next });
    toast.success(`Moved to ${next.replace(/_/g, " ")}`);
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader className="pb-3"><CardTitle className="text-base">Lifecycle</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current step</span>
            <Badge variant="secondary" className="capitalize">{String(file.status).replace(/_/g, " ")}</Badge>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs"><span>Readiness</span><span>{file.readiness_score ?? 0}%</span></div>
            <Progress value={file.readiness_score ?? 0} />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
            <Stat label="Documents" v={counts.docs} />
            <Stat label="Forms" v={counts.forms} />
            <Stat label="Open issues" v={counts.issues} />
            <Stat label="Blockers" v={counts.blockers} tone={counts.blockers ? "destructive" : "default"} />
          </div>
          {caps.canReview && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" onClick={advance}><Send className="mr-1 h-3.5 w-3.5" /> Advance lifecycle</Button>
              {caps.canExport && file.status === "ready_for_export" && (
                <Button size="sm" variant="outline"><Lock className="mr-1 h-3.5 w-3.5" /> Lock & export</Button>
              )}
              <Button size="sm" variant="ghost"><RotateCcw className="mr-1 h-3.5 w-3.5" /> Re-run AI analysis</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <Row k="Filing type" v={file.filing_type} />
          <Row k="Filing year" v={file.filing_year} />
          <Row k="Payment" v={file.payment_status} />
          <Row k="Service mode" v={file.service_mode} />
          <Row k="Client" v={client?.legal_name || [client?.first_name, client?.last_name].filter(Boolean).join(" ")} />
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({ label, v, tone = "default" }: { label: string; v: number; tone?: "default" | "destructive" }) => (
  <div className={`rounded-md border p-2 ${tone === "destructive" ? "border-destructive/40 bg-destructive/10" : "border-border"}`}>
    <p className="text-base font-semibold tabular-nums">{v}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);
const Row = ({ k, v }: { k: string; v?: any }) => (
  <div className="flex items-center justify-between border-b border-border/50 py-1 last:border-0">
    <span className="text-muted-foreground">{k}</span><span className="font-medium capitalize">{String(v ?? "—").replace(/_/g, " ")}</span>
  </div>
);

export default ProOverviewTab;