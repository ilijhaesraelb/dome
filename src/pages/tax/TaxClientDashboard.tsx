/**
 * Tax Client Dashboard — dedicated dashboard for tax-only users.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Upload, CheckCircle2, Clock, DollarSign,
  MessageSquare, ArrowRight, Calculator, FolderOpen, Settings, Plus,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import PageLoader from "@/components/PageLoader";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new_intake: { label: "New", color: "bg-blue-100 text-blue-700" },
  awaiting_documents: { label: "Awaiting Docs", color: "bg-amber-100 text-amber-700" },
  documents_uploaded: { label: "Docs Uploaded", color: "bg-cyan-100 text-cyan-700" },
  draft_in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-700" },
  awaiting_review: { label: "Under Review", color: "bg-indigo-100 text-indigo-700" },
  awaiting_client_response: { label: "Action Needed", color: "bg-orange-100 text-orange-700" },
  ready_for_payment: { label: "Ready to Pay", color: "bg-emerald-100 text-emerald-700" },
  paid_ready_export: { label: "Paid", color: "bg-green-100 text-green-700" },
  completed: { label: "Completed", color: "bg-green-200 text-green-800" },
  on_hold: { label: "On Hold", color: "bg-gray-100 text-gray-600" },
};

const TaxClientDashboard = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data: tc } = await supabase.from("tax_clients").select("*").eq("user_id", user.id).maybeSingle();
      setClient(tc);
      if (tc) {
        const { data: tf } = await supabase.from("tax_files").select("*").eq("tax_client_id", tc.id).order("updated_at", { ascending: false });
        setFiles(tf || []);
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  if (loading) return <PageLoader />;

  const activeFile = files.find(f => f.status !== "completed");
  const completedFiles = files.filter(f => f.status === "completed");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <Badge className="bg-primary/10 text-primary border-0 mb-1">Tax Dashboard</Badge>
          <h1 className="text-2xl font-display font-bold">
            Welcome{client?.legal_first_name ? `, ${client.legal_first_name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">Manage your tax filings and documents</p>
        </div>
        <Link to="/tax/start">
          <Button className="gap-2"><Plus className="w-4 h-4" /> New Tax Return</Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Returns", value: files.filter(f => f.status !== "completed").length, icon: FileText, color: "text-primary" },
          { label: "Documents", value: "—", icon: FolderOpen, color: "text-secondary" },
          { label: "Pending Payment", value: files.filter(f => f.payment_status === "unpaid").length, icon: DollarSign, color: "text-amber-600" },
          { label: "Completed", value: completedFiles.length, icon: CheckCircle2, color: "text-green-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Return */}
      {activeFile ? (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tax Year {activeFile.tax_year}</CardTitle>
              <Badge className={STATUS_LABELS[activeFile.status]?.color || "bg-muted"}>
                {STATUS_LABELS[activeFile.status]?.label || activeFile.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{activeFile.filing_type}</span></div>
              <div><span className="text-muted-foreground">Mode:</span> <span className="font-medium capitalize">{activeFile.service_mode?.replace(/_/g, " ")}</span></div>
              <div><span className="text-muted-foreground">Payment:</span> <span className="font-medium capitalize">{activeFile.payment_status}</span></div>
            </div>
            <div className="flex gap-2">
              <Link to={`/tax/file/${activeFile.id}`}>
                <Button size="sm" className="gap-1">Continue <ArrowRight className="w-3 h-3" /></Button>
              </Link>
              <Link to="/tax/documents">
                <Button size="sm" variant="outline" className="gap-1"><Upload className="w-3 h-3" /> Upload Docs</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No active tax return</p>
            <p className="text-xs mt-1">Start a new filing to get started.</p>
            <Link to="/tax/start"><Button className="mt-4 gap-2"><Plus className="w-4 h-4" /> Start New Return</Button></Link>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="returns">
        <TabsList>
          <TabsTrigger value="returns">My Returns</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="returns" className="space-y-3">
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No tax filings yet.</p>
          ) : files.map(f => (
            <Link key={f.id} to={`/tax/file/${f.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Tax Year {f.tax_year} — {f.filing_type}</p>
                      <p className="text-xs text-muted-foreground capitalize">{f.service_mode?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <Badge className={STATUS_LABELS[f.status]?.color || "bg-muted"}>
                    {STATUS_LABELS[f.status]?.label || f.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </TabsContent>
        <TabsContent value="messages" className="py-6 text-center text-sm text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
          Messages with your tax preparer will appear here.
        </TabsContent>
        <TabsContent value="payments" className="py-6 text-center text-sm text-muted-foreground">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-20" />
          Payment history will appear here.
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxClientDashboard;
