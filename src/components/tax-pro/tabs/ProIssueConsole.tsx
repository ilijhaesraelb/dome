/**
 * ProIssueConsole — central blockers/warnings/info panel with filter,
 * resolve, suppress (with note), and override actions.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertOctagon, AlertTriangle, Info, CheckCircle2, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { recordLifecycleEvent } from "@/lib/tax-pro/lifecycle";

type Severity = "blocker" | "warning" | "info";
const SEV_ICON: Record<Severity, any> = { blocker: AlertOctagon, warning: AlertTriangle, info: Info };
const SEV_TONE: Record<Severity, string> = {
  blocker: "border-destructive/40 bg-destructive/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  info: "border-border",
};

const ProIssueConsole = ({ fileId, caps }: { fileId: string; caps: any }) => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [search, setSearch] = useState("");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tax_review_issues").select("*").eq("tax_file_id", fileId).order("severity").order("created_at", { ascending: false });
    setIssues(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [fileId]);

  const act = async (issue: any, status: "resolved" | "suppressed", resolution_note?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("tax_review_issues").update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id ?? null,
      ...(resolution_note ? { resolution_note } : {}),
    }).eq("id", issue.id);
    if (error) return toast.error(error.message);
    await recordLifecycleEvent(fileId, `issue_${status}`, { issue_id: issue.id, severity: issue.severity, note: resolution_note });
    toast.success(`Issue ${status}`);
    setNoteFor(null); setNote("");
    load();
  };

  const filtered = useMemo(() => issues.filter((i) =>
    (filter === "all" || i.severity === filter) &&
    (!search || (i.title ?? "").toLowerCase().includes(search.toLowerCase()))
  ), [issues, filter, search]);

  const counts = useMemo(() => {
    const open = issues.filter((i) => i.status !== "resolved" && i.status !== "suppressed");
    return {
      blocker: open.filter((i) => i.severity === "blocker").length,
      warning: open.filter((i) => i.severity === "warning").length,
      info: open.filter((i) => i.severity === "info").length,
    };
  }, [issues]);

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "blocker", "warning", "info"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
            {f} {f !== "all" && <Badge variant="secondary" className="ml-1.5 text-[10px]">{counts[f as Severity]}</Badge>}
          </Button>
        ))}
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-48" />
      </div>

      {filtered.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No issues match filter.</CardContent></Card>}

      {filtered.map((i) => {
        const Icon = SEV_ICON[i.severity as Severity] ?? Info;
        const isResolved = i.status === "resolved" || i.status === "suppressed";
        return (
          <Card key={i.id} className={`border ${SEV_TONE[i.severity as Severity] ?? ""} ${isResolved ? "opacity-60" : ""}`}>
            <CardContent className="flex items-start gap-3 p-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{i.title ?? i.issue_type}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">{i.severity}</Badge>
                  {isResolved && <Badge variant="secondary" className="text-[10px] capitalize">{i.status}</Badge>}
                </div>
                {i.description && <p className="mt-1 text-xs text-muted-foreground">{i.description}</p>}
                {(i.related_field_key || i.related_document_id) && (
                  <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                    {i.related_field_key && <Badge variant="outline" className="font-mono">{i.related_field_key}</Badge>}
                    {i.related_document_id && <Badge variant="outline">doc:{String(i.related_document_id).slice(0, 8)}</Badge>}
                  </div>
                )}
                {noteFor === i.id && (
                  <div className="mt-2 flex gap-2">
                    <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for suppressing…" className="h-8 text-xs" />
                    <Button size="sm" onClick={() => act(i, "suppressed", note)}>Confirm</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setNoteFor(null); setNote(""); }}>Cancel</Button>
                  </div>
                )}
              </div>
              {!isResolved && caps.canReview && (
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" onClick={() => act(i, "resolved")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resolve</Button>
                  {caps.canOverride && (
                    <Button size="sm" variant="ghost" onClick={() => setNoteFor(i.id)}><EyeOff className="mr-1 h-3.5 w-3.5" /> Suppress</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
export default ProIssueConsole;