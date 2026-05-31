/**
 * ProTaxDashboard — Drake-style professional tax workspace.
 * Multi-column queue board grouped by lifecycle bucket. Sits on top of
 * the same `tax_files` data the simple guided client flow writes to.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProTaxFiles } from "@/hooks/useProTaxFiles";
import { useTaxStaff, deriveTaxCapabilities } from "@/hooks/useTaxStaff";
import ProQueueColumn from "@/components/tax-pro/ProQueueColumn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCcw, Search, Briefcase, Users, AlertOctagon, CheckCircle2 } from "lucide-react";

const ProTaxDashboard = () => {
  const staff = useTaxStaff();
  const caps = deriveTaxCapabilities(staff);
  const { files, buckets, loading, error, reload } = useProTaxFiles();
  const [q, setQ] = useState("");

  const filteredBuckets = useMemo(() => {
    if (!q.trim()) return buckets;
    const needle = q.toLowerCase();
    const out = { ...buckets };
    (Object.keys(out) as (keyof typeof out)[]).forEach((k) => {
      out[k] = out[k].filter((f) =>
        (f.client_name ?? "").toLowerCase().includes(needle) ||
        (f.filing_type ?? "").toLowerCase().includes(needle) ||
        f.forms.some((fc) => fc.toLowerCase().includes(needle))
      );
    });
    return out;
  }, [buckets, q]);

  const totals = useMemo(() => {
    const open = files.filter((f) => !["exported", "portal_filed", "archived"].includes(f.status)).length;
    const blockers = files.reduce((s, f) => s + (f.blockers ?? 0), 0);
    const ready = (buckets.export?.length ?? 0);
    const clients = new Set(files.map((f) => f.tax_client_id)).size;
    return { open, blockers, ready, clients };
  }, [files, buckets]);

  if (staff.loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">Professional Tax Console</h1>
            <p className="text-xs text-muted-foreground">
              {staff.staffRole && <Badge variant="outline" className="mr-2 text-[10px] capitalize">{staff.staffRole.replace(/_/g, " ")}</Badge>}
              Drake-style workspace · same data as the guided client flow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, form, year…" className="h-9 w-64 pl-7" />
            </div>
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
              <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            {caps.canManageFirm && (
              <Button asChild size="sm" variant="outline"><Link to="/tax/pro/firm">Firm</Link></Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={<Briefcase className="h-3.5 w-3.5" />} label="Open files" value={totals.open} />
          <Stat icon={<Users className="h-3.5 w-3.5" />} label="Clients" value={totals.clients} />
          <Stat icon={<AlertOctagon className="h-3.5 w-3.5 text-destructive" />} label="Blockers" value={totals.blockers} />
          <Stat icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} label="Ready to export" value={totals.ready} />
        </div>
      </header>

      {error && <div className="mx-6 mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex-1 overflow-auto p-4">
        <div className="grid h-full min-h-[60vh] gap-3 lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2">
          <ProQueueColumn title="Intake" description="New uploads & AI analysis" files={filteredBuckets.intake} />
          <ProQueueColumn title="Active" description="In preparation" files={filteredBuckets.active} />
          <ProQueueColumn title="Awaiting Review" description="Client/CPA verification" files={filteredBuckets.review} tone="warn" />
          <ProQueueColumn title="Payment" description="Awaiting payment" files={filteredBuckets.payment} tone="warn" />
          <ProQueueColumn title="Export" description="Ready to export / file" files={filteredBuckets.export} tone="ok" />
          <ProQueueColumn title="Completed" description="Filed & archived" files={filteredBuckets.done} tone="ok" />
        </div>
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-md border border-border bg-background px-3 py-2">
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{icon}{label}</div>
    <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
  </div>
);

export default ProTaxDashboard;