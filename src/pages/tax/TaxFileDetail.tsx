/**
 * Tax File Detail — Full operational hub for a single tax filing.
 * 11 tabs: Overview, Documents, Extracted Data, Draft Return, Financial Statements,
 * Tasks, Messages, Internal Notes, Review & Finalization, Payments, Audit Trail.
 */
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Upload, User, MessageSquare, StickyNote, Shield,
  CheckCircle2, Clock, Send, Plus, DollarSign, AlertTriangle,
  ArrowRight, CalendarClock, UserCheck, Briefcase, Lock, Eye,
  BarChart3, XCircle, RefreshCw, Download, ChevronRight,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import PageLoader from "@/components/PageLoader";

const STATUS_ORDER = [
  "new_intake", "awaiting_documents", "documents_uploaded", "extraction_complete",
  "draft_in_progress", "awaiting_review", "awaiting_client_response",
  "ready_for_payment", "paid_ready_export", "completed",
];

const STATUS_LABELS: Record<string, string> = {
  new_intake: "New Intake", awaiting_documents: "Awaiting Documents", documents_uploaded: "Documents Received",
  extraction_complete: "Extraction Complete", draft_in_progress: "Draft In Progress",
  awaiting_review: "Awaiting Review", awaiting_client_response: "Awaiting Client",
  ready_for_payment: "Ready for Payment", paid_ready_export: "Paid / Ready", completed: "Completed", on_hold: "On Hold",
};

const STATUS_COLORS: Record<string, string> = {
  new_intake: "bg-blue-100 text-blue-700", awaiting_documents: "bg-amber-100 text-amber-700",
  documents_uploaded: "bg-cyan-100 text-cyan-700", extraction_complete: "bg-teal-100 text-teal-700",
  draft_in_progress: "bg-purple-100 text-purple-700", awaiting_review: "bg-indigo-100 text-indigo-700",
  awaiting_client_response: "bg-orange-100 text-orange-700", ready_for_payment: "bg-emerald-100 text-emerald-700",
  paid_ready_export: "bg-green-100 text-green-700", completed: "bg-green-200 text-green-800",
};

const DOC_REQUEST_TEMPLATES = [
  "W-2 (Wage Statement)", "1099-NEC (Nonemployee Compensation)", "1099-MISC", "1099-INT", "1099-DIV",
  "Prior Year 1040", "1120 / 1120-S (Corporate)", "Schedule K-1", "Balance Sheet",
  "Profit & Loss Statement", "Bank Statements (12 months)", "Officer / Board List",
  "EIN Confirmation Letter", "State Tax Return", "Charitable Contribution Receipts", "Other",
];

const NOTE_TYPES = ["intake_note", "prep_note", "review_note", "payment_note", "escalation_note", "client_communication_note", "issue_flag"];

const TaxFileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [file, setFile] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("prep_note");
  const [noteUrgent, setNoteUrgent] = useState(false);
  const [docRequest, setDocRequest] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [showReopenDialog, setShowReopenDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: tf } = await supabase.from("tax_files").select("*").eq("id", id).single();
      setFile(tf);
      if (tf) {
        const [tcRes, msgsRes, docsRes, notesRes, staffRes, auditRes] = await Promise.all([
          supabase.from("tax_clients").select("*").eq("id", tf.tax_client_id).single(),
          supabase.from("tax_messages").select("*").eq("tax_file_id", id).order("created_at", { ascending: true }),
          supabase.from("tax_file_documents").select("*").eq("tax_file_id", id).order("created_at", { ascending: false }),
          supabase.from("tax_staff_notes").select("*").eq("tax_file_id", id).order("created_at", { ascending: false }),
          supabase.from("tax_staff").select("*").eq("is_active", true),
          supabase.from("audit_events").select("*").eq("record_id", id).order("created_at", { ascending: false }).limit(50),
        ]);
        setClient(tcRes.data);
        setMessages(msgsRes.data || []);
        setDocs(docsRes.data || []);
        setNotes(notesRes.data || []);
        setStaff(staffRes.data || []);
        setAuditEvents(auditRes.data || []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  /* ─── Actions ─── */
  const sendMessage = async () => {
    if (!msgText.trim() || !id || !user) return;
    await supabase.from("tax_messages").insert({
      tax_file_id: id, sender_id: user.id,
      sender_name: user.email?.split("@")[0] || "Staff", sender_role: "staff", content: msgText.trim(),
    });
    setMsgText("");
    const { data } = await supabase.from("tax_messages").select("*").eq("tax_file_id", id).order("created_at", { ascending: true });
    setMessages(data || []);
    toast({ title: "Message sent" });
  };

  const addNote = async () => {
    if (!noteText.trim() || !id || !user) return;
    await supabase.from("tax_staff_notes").insert({
      tax_file_id: id, author_id: user.id,
      author_name: user.email?.split("@")[0] || "Staff", note_type: noteType,
      content: noteText.trim(), is_urgent: noteUrgent,
    });
    setNoteText("");
    setNoteUrgent(false);
    const { data } = await supabase.from("tax_staff_notes").select("*").eq("tax_file_id", id).order("created_at", { ascending: false });
    setNotes(data || []);
    toast({ title: "Note added" });
  };

  const sendDocRequest = async () => {
    if (!docRequest || !id || !user) return;
    await supabase.from("tax_messages").insert({
      tax_file_id: id, sender_id: user.id,
      sender_name: "CCGVS Team", sender_role: "staff",
      content: `📄 Document Request: Please upload your **${docRequest}** at your earliest convenience.`,
    });
    setDocRequest("");
    const { data } = await supabase.from("tax_messages").select("*").eq("tax_file_id", id).order("created_at", { ascending: true });
    setMessages(data || []);
    toast({ title: "Document request sent" });
  };

  const updateStatus = async (newStatus: string) => {
    if (!id) return;
    const { error } = await supabase.from("tax_files").update({ status: newStatus as any }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setFile((prev: any) => ({ ...prev, status: newStatus }));
    toast({ title: `Status → ${STATUS_LABELS[newStatus] || newStatus}` });
  };

  const updatePaymentStatus = async (ps: string) => {
    if (!id) return;
    await supabase.from("tax_files").update({ payment_status: ps } as any).eq("id", id);
    setFile((prev: any) => ({ ...prev, payment_status: ps }));
    toast({ title: `Payment → ${ps}` });
  };

  const assignStaff = async (staffUserId: string) => {
    if (!id) return;
    await supabase.from("tax_files").update({ assigned_to: staffUserId }).eq("id", id);
    setFile((prev: any) => ({ ...prev, assigned_to: staffUserId }));
    toast({ title: "Staff assigned" });
  };

  const finalizeFile = async () => {
    if (!id) return;
    await supabase.from("tax_files").update({ status: "completed" as any, lock_status: "finalized" } as any).eq("id", id);
    setFile((prev: any) => ({ ...prev, status: "completed", lock_status: "finalized" }));
    toast({ title: "Filing finalized and locked" });
  };

  const reopenFile = async () => {
    if (!reopenReason.trim() || !id || !user) return;
    await supabase.from("tax_files").update({ status: "draft_in_progress" as any, lock_status: "reopened" } as any).eq("id", id);
    await supabase.from("tax_staff_notes").insert({
      tax_file_id: id, author_id: user.id,
      author_name: user.email?.split("@")[0] || "Staff", note_type: "escalation_note",
      content: `🔓 Filing reopened. Reason: ${reopenReason.trim()}`, is_urgent: true,
    });
    setFile((prev: any) => ({ ...prev, status: "draft_in_progress", lock_status: "reopened" }));
    setShowReopenDialog(false);
    setReopenReason("");
    const { data } = await supabase.from("tax_staff_notes").select("*").eq("tax_file_id", id).order("created_at", { ascending: false });
    setNotes(data || []);
    toast({ title: "Filing reopened with audit entry" });
  };

  if (loading) return <PageLoader />;
  if (!file) return <div className="p-8 text-center text-muted-foreground">Tax file not found.</div>;

  const readiness = file.readiness_score || 0;
  const isLocked = file.lock_status === "finalized";
  const assigneeName = staff.find(s => s.user_id === file.assigned_to)?.display_name || "Unassigned";
  const reviewerName = staff.find(s => s.user_id === file.reviewer_id)?.display_name || "None";
  const clientName = client?.organization_name || `${client?.legal_first_name || ""} ${client?.legal_last_name || ""}`.trim() || "Unknown Client";
  const isUrgent = file.is_urgent || (file.deadline && new Date(file.deadline) < new Date(Date.now() + 7 * 86400000));

  /* ─── Readiness checklist items ─── */
  const checks = [
    { label: "Client profile complete", ok: !!(client?.legal_first_name && client?.email) },
    { label: "At least 1 document uploaded", ok: docs.length > 0 },
    { label: "Filing type set", ok: !!file.filing_type },
    { label: "Payment received", ok: file.payment_status === "paid" },
    { label: "No unresolved issue flags", ok: !notes.some(n => n.note_type === "issue_flag" && !n.resolved) },
    { label: "Staff assigned", ok: !!file.assigned_to },
  ];
  const checksOk = checks.filter(c => c.ok).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <BackButton />

      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className="bg-primary/10 text-primary border-0">TY{file.tax_year}</Badge>
            <Badge className="bg-secondary/10 text-secondary border-0 capitalize">{file.service_mode?.replace(/_/g, " ")}</Badge>
            {isLocked && <Badge className="bg-green-100 text-green-700 border-0"><Lock className="w-3 h-3 mr-1" /> Finalized</Badge>}
            {isUrgent && <Badge className="bg-destructive text-destructive-foreground"><AlertTriangle className="w-3 h-3 mr-1" /> Urgent</Badge>}
          </div>
          <h1 className="text-2xl font-display font-bold capitalize">{file.filing_type?.replace(/_/g, " ")} Return</h1>
          <p className="text-sm text-muted-foreground">{clientName} · Assigned: {assigneeName} · Reviewer: {reviewerName}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs ${STATUS_COLORS[file.status] || "bg-muted"}`}>{STATUS_LABELS[file.status]}</Badge>
          <Badge variant={file.payment_status === "paid" ? "default" : "secondary"} className="text-xs capitalize">
            {file.payment_status || "unpaid"}
          </Badge>
          {file.deadline && (
            <Badge variant="outline" className="text-xs"><CalendarClock className="w-3 h-3 mr-1" />{new Date(file.deadline).toLocaleDateString()}</Badge>
          )}
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="flex gap-2 flex-wrap">
        {!isLocked && (
          <>
            <Select onValueChange={v => updateStatus(v)}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Move to Stage…" /></SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={v => assignStaff(v)}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Assign Staff…" /></SelectTrigger>
              <SelectContent>
                {staff.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setDocRequest(DOC_REQUEST_TEMPLATES[0])}><Upload className="w-3.5 h-3.5 mr-1" /> Request Doc</Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus("awaiting_review")}><Shield className="w-3.5 h-3.5 mr-1" /> Send to Review</Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus("ready_for_payment")}><DollarSign className="w-3.5 h-3.5 mr-1" /> Mark Ready for Payment</Button>
            <Button size="sm" onClick={finalizeFile}><Lock className="w-3.5 h-3.5 mr-1" /> Finalize & Lock</Button>
          </>
        )}
        {isLocked && (
          <Button size="sm" variant="destructive" onClick={() => setShowReopenDialog(true)}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Reopen Filing</Button>
        )}
      </div>

      {/* Reopen Dialog */}
      {showReopenDialog && (
        <Card className="border-destructive">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-semibold text-sm">Reopen Finalized Filing</p>
            </div>
            <p className="text-xs text-muted-foreground">
              This filing was finalized and locked. Reopening will create a permanent audit log entry.
              All changes after reopen will be tracked.
            </p>
            <Textarea value={reopenReason} onChange={e => setReopenReason(e.target.value)} placeholder="Reason for reopening (required)…" rows={2} />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" disabled={!reopenReason.trim()} onClick={reopenFile}>Confirm Reopen</Button>
              <Button size="sm" variant="outline" onClick={() => setShowReopenDialog(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ TABS ═══ */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Tax Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents ({docs.length})</TabsTrigger>
          <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
          <TabsTrigger value="confirm">Filing Confirmation</TabsTrigger>
          <TabsTrigger value="draft">Draft Return</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* ═══ OVERVIEW ═══ */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Status", value: STATUS_LABELS[file.status], icon: Clock, color: "text-primary" },
              { label: "Payment", value: file.payment_status || "unpaid", icon: DollarSign, color: file.payment_status === "paid" ? "text-green-600" : "text-amber-600" },
              { label: "Readiness", value: `${checksOk}/${checks.length}`, icon: CheckCircle2, color: "text-secondary" },
              { label: "Documents", value: docs.length, icon: FileText, color: "text-cyan-600" },
              { label: "Messages", value: messages.length, icon: MessageSquare, color: "text-indigo-600" },
              { label: "Lock", value: file.lock_status || "draft", icon: Lock, color: isLocked ? "text-green-600" : "text-muted-foreground" },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                  <p className="font-bold text-sm capitalize">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Filing Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-muted-foreground">Filing Type</span><span className="font-medium capitalize">{file.filing_type?.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">Tax Year</span><span className="font-medium">{file.tax_year}</span>
                  <span className="text-muted-foreground">Service Mode</span><span className="font-medium capitalize">{file.service_mode?.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">Assigned To</span><span className="font-medium">{assigneeName}</span>
                  <span className="text-muted-foreground">Reviewer</span><span className="font-medium">{reviewerName}</span>
                  {file.deadline && <><span className="text-muted-foreground">Deadline</span><span className="font-medium">{new Date(file.deadline).toLocaleDateString()}</span></>}
                  <span className="text-muted-foreground">Created</span><span className="font-medium">{new Date(file.created_at).toLocaleDateString()}</span>
                  <span className="text-muted-foreground">Last Updated</span><span className="font-medium">{new Date(file.updated_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Client Profile</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {client ? (
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-muted-foreground">Name</span><span className="font-medium">{clientName}</span>
                    <span className="text-muted-foreground">Email</span><span className="font-medium">{client.email}</span>
                    <span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{client.tax_user_type}</span>
                    {client.filing_status && <><span className="text-muted-foreground">Filing Status</span><span className="font-medium">{client.filing_status}</span></>}
                    {client.phone && <><span className="text-muted-foreground">Phone</span><span className="font-medium">{client.phone}</span></>}
                    <span className="text-muted-foreground">Address</span><span className="font-medium">{[client.address_street, client.address_city, client.address_state, client.address_zip].filter(Boolean).join(", ") || "—"}</span>
                  </div>
                ) : <p className="text-muted-foreground">No client profile found.</p>}
              </CardContent>
            </Card>
          </div>

          {/* Readiness Checklist */}
          <Card>
            <CardHeader><CardTitle className="text-base">Readiness Checklist ({checksOk}/{checks.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Progress value={(checksOk / checks.length) * 100} className="h-2.5 mb-3" />
              {checks.map(c => (
                <div key={c.label} className="flex items-center gap-2 text-sm">
                  {c.ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                  <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Flow Navigation */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-sm">Next Steps</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/tax/documents/upload?file=${id}`)} className="gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload Documents
                </Button>
                {!file.filing_confirmed && (
                  <Button size="sm" onClick={() => navigate(`/tax/file/${id}/confirm`)} className="gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Filing Type
                  </Button>
                )}
                {file.filing_confirmed && (
                  <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Filing type confirmed: {file.filing_type?.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAX PROFILE ═══ */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Client Tax Profile</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client ? (
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-muted-foreground">Name</span><span className="font-medium">{clientName}</span>
                  <span className="text-muted-foreground">Email</span><span className="font-medium">{client.email}</span>
                  <span className="text-muted-foreground">Phone</span><span className="font-medium">{client.phone || "—"}</span>
                  <span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{client.tax_user_type}</span>
                  <span className="text-muted-foreground">Filing Status</span><span className="font-medium">{client.filing_status || "—"}</span>
                  <span className="text-muted-foreground">Dependents</span><span className="font-medium">{client.dependents_count ?? "—"}</span>
                  <span className="text-muted-foreground">Organization</span><span className="font-medium">{client.organization_name || "—"}</span>
                  <span className="text-muted-foreground">Org Type</span><span className="font-medium capitalize">{client.organization_type || "—"}</span>
                  <span className="text-muted-foreground">Officer</span><span className="font-medium">{client.officer_name || "—"}</span>
                  <span className="text-muted-foreground">Address</span><span className="font-medium">{[client.address_street, client.address_city, client.address_state, client.address_zip].filter(Boolean).join(", ") || "—"}</span>
                </div>
              ) : <p className="text-muted-foreground">No client profile found.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ FILING CONFIRMATION ═══ */}
        <TabsContent value="confirm" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              {file.filing_confirmed ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                  <p className="font-semibold">Filing Type Confirmed</p>
                  <p className="text-sm text-muted-foreground capitalize">{file.filing_type?.replace(/_/g, " ")} — Tax Year {file.tax_year}</p>
                  <p className="text-xs text-muted-foreground">Confirmed {file.filing_confirmed_at ? new Date(file.filing_confirmed_at).toLocaleString() : ""}</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="font-semibold">Filing Type Not Yet Confirmed</p>
                  <p className="text-sm text-muted-foreground">Confirm what is being prepared before proceeding to guided preparation.</p>
                  <Button onClick={() => navigate(`/tax/file/${id}/confirm`)} className="gap-2">
                    Confirm Filing Type <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ DOCUMENTS ═══ */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Request Document from Client</CardTitle></CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              <Select value={docRequest} onValueChange={setDocRequest}>
                <SelectTrigger className="w-72"><SelectValue placeholder="Select document type…" /></SelectTrigger>
                <SelectContent>
                  {DOC_REQUEST_TEMPLATES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!docRequest} onClick={sendDocRequest}><Send className="w-4 h-4 mr-1" /> Send Request</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="w-4 h-4" /> Uploaded Documents ({docs.length})</CardTitle></CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet.</p>
              ) : (
                <div className="divide-y">
                  {docs.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.category} · {new Date(d.created_at).toLocaleDateString()}{d.file_size ? ` · ${(d.file_size / 1024).toFixed(0)}KB` : ""}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{d.extraction_status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ EXTRACTED DATA ═══ */}
        <TabsContent value="extracted">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Extracted Data</p>
              <p className="text-xs mt-1">Data extracted from uploaded documents (W-2 amounts, 1099 details, EIN, etc.) will appear here as documents are processed.</p>
              {docs.length > 0 && (
                <div className="mt-4 text-left max-w-md mx-auto">
                  <p className="text-xs font-medium mb-2">Documents available for extraction:</p>
                  {docs.map(d => (
                    <div key={d.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                      <span>{d.name}</span>
                      <Badge variant={d.extraction_status === "completed" ? "default" : "secondary"} className="text-[9px]">{d.extraction_status || "pending"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ DRAFT RETURN ═══ */}
        <TabsContent value="draft">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Draft Return</p>
              <p className="text-xs mt-1">As documents are uploaded and data is extracted, the draft return data will be assembled here for review and approval.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled><Download className="w-4 h-4 mr-1" /> Export Draft (Coming Soon)</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ FINANCIAL STATEMENTS ═══ */}
        <TabsContent value="statements">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Financial Statements</p>
              <p className="text-xs mt-1">Balance sheets, income statements, and cash-flow reports will be generated here based on uploaded financial data.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TASKS ═══ */}
        <TabsContent value="tasks">
          <Card>
            <CardContent className="p-6">
              <p className="font-semibold text-sm mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4" /> Task Checklist</p>
              <div className="space-y-2">
                {[
                  { task: "Collect all source documents", done: docs.length > 0 },
                  { task: "Verify client identity and EIN/SSN", done: false },
                  { task: "Extract data from documents", done: docs.some(d => d.extraction_status === "completed") },
                  { task: "Prepare draft return", done: ["awaiting_review", "ready_for_payment", "paid_ready_export", "completed"].includes(file.status) },
                  { task: "Submit for CPA review", done: ["ready_for_payment", "paid_ready_export", "completed"].includes(file.status) },
                  { task: "Collect payment", done: file.payment_status === "paid" },
                  { task: "Finalize and deliver", done: file.status === "completed" },
                ].map(t => (
                  <div key={t.task} className="flex items-center gap-2 text-sm">
                    {t.done ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                    <span className={t.done ? "line-through text-muted-foreground" : ""}>{t.task}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ MESSAGES ═══ */}
        <TabsContent value="messages">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No messages yet. Start the conversation.</p>}
                {messages.map(m => (
                  <div key={m.id} className={`p-3 rounded-lg text-sm ${m.sender_role === "staff" ? "bg-primary/5 ml-8" : "bg-muted mr-8"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">{m.sender_name}</span>
                      <Badge variant="outline" className="text-[9px] capitalize">{m.sender_role}</Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message…" onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} />
                <Button size="sm" onClick={sendMessage} disabled={!msgText.trim()}><Send className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ INTERNAL NOTES ═══ */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><StickyNote className="w-4 h-4" /> Add Internal Note</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 items-center flex-wrap">
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={noteUrgent} onCheckedChange={c => setNoteUrgent(!!c)} />
                  <span className="text-destructive font-medium">Urgent</span>
                </label>
              </div>
              <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Internal staff note — not visible to client…" rows={3} />
              <Button size="sm" disabled={!noteText.trim()} onClick={addNote}><Send className="w-4 h-4 mr-1" /> Post Note</Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {notes.length === 0 && <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No internal notes yet.</CardContent></Card>}
            {notes.map(n => (
              <Card key={n.id} className={n.is_urgent ? "border-l-4 border-l-destructive" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] capitalize">{n.note_type?.replace(/_/g, " ")}</Badge>
                    <span className="text-xs font-medium">{n.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                    {n.is_urgent && <Badge className="bg-destructive text-destructive-foreground text-[10px]">Urgent</Badge>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ REVIEW & FINALIZATION ═══ */}
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Review & Finalization</h3>

              {/* Readiness checklist */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Readiness Checklist ({checksOk}/{checks.length})</p>
                <Progress value={(checksOk / checks.length) * 100} className="h-2.5" />
                {checks.map(c => (
                  <div key={c.label} className="flex items-center gap-2 text-sm">
                    {c.ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                    <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                  </div>
                ))}
              </div>

              {/* Summary metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="p-3 border rounded-lg text-center">
                  <p className="font-bold">{docs.length}</p><p className="text-xs text-muted-foreground">Documents</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <p className="font-bold capitalize">{file.payment_status || "unpaid"}</p><p className="text-xs text-muted-foreground">Payment</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <p className="font-bold capitalize">{file.lock_status || "draft"}</p><p className="text-xs text-muted-foreground">Lock Status</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <p className="font-bold">{notes.filter(n => n.note_type === "issue_flag").length}</p><p className="text-xs text-muted-foreground">Issue Flags</p>
                </div>
              </div>

              {/* Actions */}
              {isLocked ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 flex items-center gap-2"><Lock className="w-4 h-4" /> This filing is finalized and locked.</p>
                  <p className="text-xs text-green-700 mt-1">Any reopening will create a permanent audit trail entry.</p>
                  <Button size="sm" variant="destructive" className="mt-3" onClick={() => setShowReopenDialog(true)}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Request Reopen
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => updateStatus("awaiting_client_response")}>Return for Corrections</Button>
                  <Button variant="outline" onClick={() => updateStatus("ready_for_payment")}>Mark Ready for Payment</Button>
                  <Button variant="outline" onClick={() => updateStatus("awaiting_review")}>Request CPA Review</Button>
                  <Button onClick={finalizeFile} disabled={checksOk < checks.length} className="gap-2">
                    <Lock className="w-4 h-4" /> Finalize & Lock
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ PAYMENTS ═══ */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4" /> Payment Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold capitalize">{file.payment_status || "unpaid"}</p>
                  <p className="text-xs text-muted-foreground">Current Status</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">{file.payment_amount_cents ? `$${(file.payment_amount_cents / 100).toFixed(2)}` : "—"}</p>
                  <p className="text-xs text-muted-foreground">Amount</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold capitalize">{file.service_mode?.replace(/_/g, " ") || "—"}</p>
                  <p className="text-xs text-muted-foreground">Service Type</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select onValueChange={v => updatePaymentStatus(v)}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Update Payment…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="requested">Payment Requested</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="issue">Payment Issue</SelectItem>
                  </SelectContent>
                </Select>
                {file.payment_status !== "paid" && (
                  <Button size="sm" variant="outline" onClick={() => {
                    sendMessage();
                    updatePaymentStatus("requested");
                  }}>
                    <Send className="w-4 h-4 mr-1" /> Send Payment Request
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ AUDIT TRAIL ═══ */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><Shield className="w-4 h-4" /> Audit Trail</h3>
              {auditEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No audit events recorded for this filing yet.</p>
              ) : (
                <div className="space-y-3">
                  {auditEvents.map(e => (
                    <div key={e.id} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{e.human_label || e.action_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()} · {e.user_role || "system"} · {e.module}
                        </p>
                        {e.error_details && <p className="text-xs text-destructive mt-1">{e.error_details}</p>}
                      </div>
                      <Badge variant={e.success ? "default" : "destructive"} className="text-[9px] shrink-0">
                        {e.success ? "OK" : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxFileDetail;
