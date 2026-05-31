/**
 * Accountant / CPA Professional Dashboard
 * Review queue, assigned files, approval/rejection workflow, finalization controls.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, CheckCircle2, AlertTriangle, Clock, ArrowRight,
  DollarSign, Shield, Eye, Lock, XCircle, ChevronRight, RefreshCw,
  Users, BarChart3,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import PageLoader from "@/components/PageLoader";

const STATUS_LABELS: Record<string, string> = {
  new_intake: "New Intake", awaiting_documents: "Awaiting Docs", documents_uploaded: "Docs Received",
  extraction_complete: "Extracted", draft_in_progress: "In Prep", awaiting_review: "Awaiting Review",
  awaiting_client_response: "Client Response", ready_for_payment: "Ready for Payment",
  paid_ready_export: "Paid", completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  awaiting_review: "bg-indigo-100 text-indigo-700", draft_in_progress: "bg-purple-100 text-purple-700",
  ready_for_payment: "bg-emerald-100 text-emerald-700", completed: "bg-green-200 text-green-800",
  awaiting_client_response: "bg-orange-100 text-orange-700",
};

const AccountantDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const [fRes, cRes, sRes] = await Promise.all([
      supabase.from("tax_files").select("*").order("updated_at", { ascending: false }),
      supabase.from("tax_clients").select("*"),
      supabase.from("tax_staff").select("*").eq("is_active", true),
    ]);
    setFiles(fRes.data || []);
    setClients(cRes.data || []);
    setStaff(sRes.data || []);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  if (loading) return <PageLoader />;

  const getClientName = (clientId: string) => {
    const c = clients.find(cl => cl.id === clientId);
    return c?.organization_name || `${c?.legal_first_name || ""} ${c?.legal_last_name || ""}`.trim() || "Unknown";
  };

  const myAssigned = files.filter(f => f.assigned_to === user?.id || f.reviewer_id === user?.id);
  const awaitingReview = files.filter(f => f.status === "awaiting_review");
  const inPrep = files.filter(f => ["draft_in_progress", "extraction_complete"].includes(f.status));
  const readyForPayment = files.filter(f => f.status === "ready_for_payment");
  const completed = files.filter(f => f.status === "completed");

  const updateStatus = async (fileId: string, newStatus: string) => {
    const { error } = await supabase.from("tax_files").update({ status: newStatus as any }).eq("id", fileId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: newStatus } : f));
    toast({ title: `Status → ${STATUS_LABELS[newStatus]}` });
  };

  const FileRow = ({ f, showActions }: { f: any; showActions?: boolean }) => {
    const isUrgent = f.is_urgent || (f.deadline && new Date(f.deadline) < new Date(Date.now() + 7 * 86400000));
    const assignee = staff.find(s => s.user_id === f.assigned_to)?.display_name || "";
    return (
      <Card className={`hover:shadow-md transition ${isUrgent ? "border-l-4 border-l-destructive" : ""}`}>
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <Link to={`/tax/file/${f.id}`} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{getClientName(f.tax_client_id)}</p>
              <p className="text-xs text-muted-foreground">TY{f.tax_year} · {f.filing_type} · {assignee || "Unassigned"}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-[10px] ${STATUS_COLORS[f.status] || "bg-muted text-muted-foreground"}`}>
              {STATUS_LABELS[f.status] || f.status}
            </Badge>
            {isUrgent && <Badge className="bg-destructive text-destructive-foreground text-[10px]">Urgent</Badge>}
            {f.payment_status === "paid" && <Badge variant="default" className="text-[10px]">Paid</Badge>}
            {showActions && f.status === "awaiting_review" && (
              <>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(f.id, "awaiting_client_response")}>
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Return
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={() => updateStatus(f.id, "ready_for_payment")}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
              </>
            )}
            <Link to={`/tax/file/${f.id}`}><ChevronRight className="w-4 h-4 text-muted-foreground" /></Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <BackButton />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Badge className="bg-secondary/10 text-secondary border-0 mb-1 text-xs">Professional View</Badge>
          <h1 className="text-2xl font-display font-bold">Accountant / CPA Dashboard</h1>
          <p className="text-sm text-muted-foreground">Review, approve, and finalize tax returns.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/tax/ccgvs/portal"><Button variant="outline" size="sm" className="gap-2"><ArrowRight className="w-4 h-4" /> Operations Portal</Button></Link>
          <Button variant="outline" size="sm" onClick={reload}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "My Assigned", value: myAssigned.length, icon: FileText, color: "text-primary" },
          { label: "Awaiting Review", value: awaitingReview.length, icon: AlertTriangle, color: "text-amber-600" },
          { label: "In Preparation", value: inPrep.length, icon: Clock, color: "text-purple-600" },
          { label: "Ready for Payment", value: readyForPayment.length, icon: DollarSign, color: "text-emerald-600" },
          { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-green-600" },
          { label: "Total Files", value: files.length, icon: BarChart3, color: "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="review" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="review">Review Queue ({awaitingReview.length})</TabsTrigger>
          <TabsTrigger value="assigned">My Assigned ({myAssigned.length})</TabsTrigger>
          <TabsTrigger value="payment">Ready for Payment ({readyForPayment.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="all">All Files</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-2">
          {awaitingReview.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No returns awaiting review</p>
              <p className="text-xs mt-1">Files sent for CPA review will appear here.</p>
            </CardContent></Card>
          ) : awaitingReview.map(f => <FileRow key={f.id} f={f} showActions />)}
        </TabsContent>

        <TabsContent value="assigned" className="space-y-2">
          {myAssigned.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No files assigned to you</p>
            </CardContent></Card>
          ) : myAssigned.map(f => <FileRow key={f.id} f={f} showActions />)}
        </TabsContent>

        <TabsContent value="payment" className="space-y-2">
          {readyForPayment.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No files ready for payment</p>
            </CardContent></Card>
          ) : readyForPayment.map(f => <FileRow key={f.id} f={f} />)}
        </TabsContent>

        <TabsContent value="completed" className="space-y-2">
          {completed.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No completed filings yet</p>
            </CardContent></Card>
          ) : completed.slice(0, 50).map(f => <FileRow key={f.id} f={f} />)}
        </TabsContent>

        <TabsContent value="all" className="space-y-2">
          {files.slice(0, 50).map(f => <FileRow key={f.id} f={f} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountantDashboard;
