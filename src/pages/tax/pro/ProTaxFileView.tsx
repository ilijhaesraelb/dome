/**
 * ProTaxFileView — Tabbed per-file Professional console.
 * Tabs: Overview · Profile · Documents · Extracted · Forms · Answers ·
 *       Issues · Financials · Payments · Exports · Audit
 * All tabs read/write the same `tax_files` data model used by the simple
 * client flow. Pro-only actions are gated by capability matrix.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTaxStaff, deriveTaxCapabilities } from "@/hooks/useTaxStaff";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, FileText, MessageSquare } from "lucide-react";
import ProOverviewTab from "@/components/tax-pro/tabs/ProOverviewTab";
import ProDocumentsTab from "@/components/tax-pro/tabs/ProDocumentsTab";
import ProSourceVsFormTab from "@/components/tax-pro/tabs/ProSourceVsFormTab";
import ProFormsTab from "@/components/tax-pro/tabs/ProFormsTab";
import ProAnswersTab from "@/components/tax-pro/tabs/ProAnswersTab";
import ProIssueConsole from "@/components/tax-pro/tabs/ProIssueConsole";
import ProFinancialsTab from "@/components/tax-pro/tabs/ProFinancialsTab";
import ProPaymentsTab from "@/components/tax-pro/tabs/ProPaymentsTab";
import ProExportsTab from "@/components/tax-pro/tabs/ProExportsTab";
import ProAuditTab from "@/components/tax-pro/tabs/ProAuditTab";
import ClientCommDialog from "@/components/tax-pro/ClientCommDialog";

const ProTaxFileView = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const staff = useTaxStaff();
  const caps = deriveTaxCapabilities(staff);
  const [file, setFile] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commOpen, setCommOpen] = useState(false);

  // Deep-link support: ?form=1040&section=income → open Forms tab.
  const deepLinkTab = useMemo(() => {
    if (searchParams.get("form") || searchParams.get("section")) return "forms";
    return "overview";
  }, [searchParams]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: f } = await supabase
        .from("tax_files")
        .select("*, tax_clients ( * )")
        .eq("id", id)
        .maybeSingle();
      setFile(f);
      setClient(Array.isArray(f?.tax_clients) ? f.tax_clients[0] : f?.tax_clients ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!file) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">Tax file not found.</p>
      <Button variant="link" onClick={() => nav("/tax/pro")}>Back to console</Button>
    </div>
  );

  const clientName = client?.legal_name || [client?.first_name, client?.last_name].filter(Boolean).join(" ") || "Unnamed";

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to="/tax/pro"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-base font-bold truncate">{clientName}</h1>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] capitalize">{client?.profile_type ?? "—"}</Badge>
              <span>·</span>
              <span>TY {file.filing_year ?? "—"}</span>
              <span>·</span>
              <Badge variant="secondary" className="text-[10px] capitalize">{String(file.status).replace(/_/g, " ")}</Badge>
              {file.readiness_score != null && (<><span>·</span><span>{file.readiness_score}% ready</span></>)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {caps.canMessageClient && (
              <Button variant="outline" size="sm" onClick={() => setCommOpen(true)}>
                <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message client
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link to={`/tax/file/${file.id}`}><FileText className="mr-1 h-3.5 w-3.5" /> Client view</Link>
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue={deepLinkTab} className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-4 overflow-x-auto">
          <TabsList className="h-10 bg-transparent">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="extracted">Source vs Form</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="answers">Answers</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto bg-muted/20 p-4">
          <TabsContent value="overview"><ProOverviewTab file={file} client={client} caps={caps} /></TabsContent>
          <TabsContent value="profile">
            <Card><CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <Row k="Legal name" v={clientName} />
                <Row k="Type" v={client?.profile_type} />
                <Row k="EIN" v={client?.ein} />
                <Row k="SSN (last 4)" v={client?.ssn_last4 ?? client?.ssn?.slice(-4)} />
                <Row k="Email" v={client?.email} />
                <Row k="Phone" v={client?.phone} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="documents"><ProDocumentsTab fileId={file.id} clientId={file.tax_client_id} /></TabsContent>
          <TabsContent value="extracted"><ProSourceVsFormTab fileId={file.id} caps={caps} /></TabsContent>
          <TabsContent value="forms"><ProFormsTab fileId={file.id} caps={caps} /></TabsContent>
          <TabsContent value="answers"><ProAnswersTab fileId={file.id} caps={caps} /></TabsContent>
          <TabsContent value="issues"><ProIssueConsole fileId={file.id} caps={caps} /></TabsContent>
          <TabsContent value="financials"><ProFinancialsTab fileId={file.id} caps={caps} /></TabsContent>
          <TabsContent value="payments"><ProPaymentsTab fileId={file.id} /></TabsContent>
          <TabsContent value="exports"><ProExportsTab fileId={file.id} caps={caps} /></TabsContent>
          <TabsContent value="audit"><ProAuditTab fileId={file.id} /></TabsContent>
        </div>
      </Tabs>

      <ClientCommDialog open={commOpen} onClose={() => setCommOpen(false)} fileId={file.id} clientName={clientName} />
    </div>
  );
};

const Row = ({ k, v }: { k: string; v?: string | null }) => (
  <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-medium">{v || "—"}</span>
  </div>
);

export default ProTaxFileView;