/**
 * CCGVS / AREI GROUP — Internal Tax Operations Dashboard
 * Pipeline board, metrics, queues, revenue, team, notes.
 */
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Users, FileText, Clock, CheckCircle2, AlertTriangle,
  DollarSign, TrendingUp, Plus, Search, ArrowRight, Building2, Shield,
  BarChart3, UserPlus, StickyNote, Send, CalendarClock, Briefcase,
  GripVertical, Eye, RefreshCw, ChevronRight,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import PageLoader from "@/components/PageLoader";
import IrsStatusBadge from "@/components/tax-help/IrsStatusBadge";

/* ─── Pipeline Columns ─── */
const PIPELINE_COLS = [
  { key: "new_intake", label: "New Intake", color: "border-t-blue-500", icon: Plus },
  { key: "awaiting_documents", label: "Awaiting Docs", color: "border-t-amber-500", icon: Clock },
  { key: "documents_uploaded", label: "Docs Received", color: "border-t-cyan-500", icon: FileText },
  { key: "extraction_complete", label: "In Preparation", color: "border-t-purple-500", icon: RefreshCw },
  { key: "draft_in_progress", label: "In Preparation", color: "border-t-purple-500", icon: RefreshCw },
  { key: "awaiting_review", label: "Awaiting Review", color: "border-t-indigo-500", icon: Shield },
  { key: "awaiting_client_response", label: "Client Response", color: "border-t-orange-500", icon: AlertTriangle },
  { key: "ready_for_payment", label: "Ready for Payment", color: "border-t-emerald-500", icon: DollarSign },
  { key: "paid_ready_export", label: "Paid / Finalize", color: "border-t-green-500", icon: CheckCircle2 },
  { key: "completed", label: "Completed", color: "border-t-green-700", icon: CheckCircle2 },
];

/* Deduplicate merged columns (extraction + draft = "In Preparation") */
const PIPELINE_DISPLAY = [
  { keys: ["new_intake"], label: "New Intake", color: "border-t-blue-500", icon: Plus },
  { keys: ["awaiting_documents"], label: "Awaiting Docs", color: "border-t-amber-500", icon: Clock },
  { keys: ["documents_uploaded"], label: "Docs Received", color: "border-t-cyan-500", icon: FileText },
  { keys: ["extraction_complete", "draft_in_progress"], label: "In Preparation", color: "border-t-purple-500", icon: RefreshCw },
  { keys: ["awaiting_review"], label: "Awaiting Review", color: "border-t-indigo-500", icon: Shield },
  { keys: ["awaiting_client_response"], label: "Client Response", color: "border-t-orange-500", icon: AlertTriangle },
  { keys: ["ready_for_payment"], label: "Ready for Payment", color: "border-t-emerald-500", icon: DollarSign },
  { keys: ["paid_ready_export"], label: "Paid / Finalize", color: "border-t-green-500", icon: CheckCircle2 },
  { keys: ["completed"], label: "Completed", color: "border-t-green-700", icon: CheckCircle2 },
];

const STATUS_ORDER = [
  "new_intake", "awaiting_documents", "documents_uploaded", "extraction_complete",
  "draft_in_progress", "awaiting_review", "awaiting_client_response",
  "ready_for_payment", "paid_ready_export", "completed",
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new_intake: { label: "New Intake", color: "bg-blue-100 text-blue-700" },
  awaiting_documents: { label: "Awaiting Docs", color: "bg-amber-100 text-amber-700" },
  documents_uploaded: { label: "Docs Received", color: "bg-cyan-100 text-cyan-700" },
  extraction_complete: { label: "Extracted", color: "bg-teal-100 text-teal-700" },
  draft_in_progress: { label: "In Prep", color: "bg-purple-100 text-purple-700" },
  awaiting_review: { label: "Review", color: "bg-indigo-100 text-indigo-700" },
  awaiting_client_response: { label: "Client", color: "bg-orange-100 text-orange-700" },
  ready_for_payment: { label: "Payment", color: "bg-emerald-100 text-emerald-700" },
  paid_ready_export: { label: "Paid", color: "bg-green-100 text-green-700" },
  completed: { label: "Done", color: "bg-green-200 text-green-800" },
  on_hold: { label: "Hold", color: "bg-muted text-muted-foreground" },
};

const NOTE_TYPES = ["intake_note", "prep_note", "review_note", "payment_note", "escalation_note", "client_communication_note"];

const CCGVSPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("intake_note");

  const reload = async () => {
    const [filesRes, clientsRes, staffRes, notesRes] = await Promise.all([
      supabase.from("tax_files").select("*").order("updated_at", { ascending: false }),
      supabase.from("tax_clients").select("*").order("created_at", { ascending: false }),
      supabase.from("tax_staff").select("*").eq("is_active", true),
      supabase.from("tax_staff_notes").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setFiles(filesRes.data || []);
    setClients(clientsRes.data || []);
    setStaff(staffRes.data || []);
    setNotes(notesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const clientMap = useMemo(() => {
    const m = new Map<string, any>();
    clients.forEach(c => m.set(c.id, c));
    return m;
  }, [clients]);

  const getClientName = (clientId: string) => {
    const c = clientMap.get(clientId);
    return c?.organization_name || `${c?.legal_first_name || ""} ${c?.legal_last_name || ""}`.trim() || "Unknown";
  };

  const getStaffName = (userId: string) => staff.find(s => s.user_id === userId)?.display_name || "";

  if (loading) return <PageLoader />;

  /* ─── Computed Metrics ─── */
  const sc = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = files.filter(f => f.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const totalRevenue = files.filter(f => f.payment_status === "paid").reduce((sum, f) => sum + (f.payment_amount_cents || 0), 0);
  const unpaidActive = files.filter(f => f.payment_status !== "paid" && f.status !== "completed").length;
  const activeFiles = files.filter(f => f.status !== "completed").length;
  const urgentFiles = files.filter(f => f.deadline && new Date(f.deadline) < new Date(Date.now() + 7 * 86400000)).length;

  const revenueByType: Record<string, number> = {};
  files.filter(f => f.payment_status === "paid").forEach(f => {
    const t = f.filing_type || "other";
    revenueByType[t] = (revenueByType[t] || 0) + (f.payment_amount_cents || 0);
  });

  const staffWorkload: Record<string, number> = {};
  files.filter(f => f.assigned_to && f.status !== "completed").forEach(f => {
    const name = getStaffName(f.assigned_to) || "Unassigned";
    staffWorkload[name] = (staffWorkload[name] || 0) + 1;
  });

  const filteredFiles = files.filter(f => {
    if (filter !== "all" && f.status !== filter) return false;
    if (search) {
      const name = getClientName(f.tax_client_id).toLowerCase();
      if (!name.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  /* ─── Actions ─── */
  const updateFileStatus = async (fileId: string, newStatus: string) => {
    const { error } = await supabase.from("tax_files").update({ status: newStatus as any }).eq("id", fileId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: newStatus } : f));
    toast({ title: `Status → ${STATUS_LABELS[newStatus]?.label || newStatus}` });
  };

  const assignStaff = async (fileId: string, staffUserId: string) => {
    const { error } = await supabase.from("tax_files").update({ assigned_to: staffUserId }).eq("id", fileId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, assigned_to: staffUserId } : f));
    toast({ title: "Staff assigned" });
  };

  const addPortalNote = async () => {
    if (!noteText.trim() || !user) return;
    await supabase.from("tax_staff_notes").insert({
      author_id: user.id, author_name: user.email?.split("@")[0] || "Staff",
      note_type: noteType, content: noteText.trim(),
    });
    setNoteText("");
    const { data } = await supabase.from("tax_staff_notes").select("*").order("created_at", { ascending: false }).limit(100);
    setNotes(data || []);
    toast({ title: "Note added" });
  };

  /* ─── File Card (shared) ─── */
  const FileCard = ({ f, compact }: { f: any; compact?: boolean }) => {
    const name = getClientName(f.tax_client_id);
    const assignee = getStaffName(f.assigned_to);
    const isUrgent = f.is_urgent || (f.deadline && new Date(f.deadline) < new Date(Date.now() + 7 * 86400000));
    const lastActivity = f.updated_at ? new Date(f.updated_at).toLocaleDateString() : "—";

    return (
      <Link to={`/tax/file/${f.id}`}>
        <Card className={`hover:shadow-md transition cursor-pointer group ${isUrgent ? "border-l-4 border-l-destructive" : ""}`}>
          <CardContent className={compact ? "p-3 space-y-1.5" : "p-4 space-y-2"}>
            <div className="flex items-start justify-between gap-2">
              <p className={`font-medium truncate ${compact ? "text-xs" : "text-sm"}`}>{name}</p>
              {isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge className={`text-[9px] ${STATUS_LABELS[f.status]?.color || "bg-muted"}`}>
                {STATUS_LABELS[f.status]?.label || f.status}
              </Badge>
              <Badge variant="outline" className="text-[9px]">{f.filing_type}</Badge>
              {f.service_mode && <Badge variant="outline" className="text-[9px] capitalize">{f.service_mode.replace(/_/g, " ")}</Badge>}
            </div>
            {!compact && (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>TY{f.tax_year} · {assignee || "Unassigned"}</span>
                <span>{lastActivity}</span>
              </div>
            )}
            {compact && assignee && <p className="text-[10px] text-muted-foreground truncate">{assignee}</p>}
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <BackButton />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/10 text-primary border-0 text-xs">Internal Portal</Badge>
            <Badge className="bg-secondary/10 text-secondary border-0 text-xs">CCGVS / AREI GROUP</Badge>
          </div>
          <h1 className="text-2xl font-display font-bold">Tax & Accounting Operations</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-muted-foreground">Private service dashboard · {files.length} files · {clients.length} clients</p>
            <IrsStatusBadge compact />
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/tax/ccgvs/intake"><Button className="gap-2" size="sm"><UserPlus className="w-4 h-4" /> New Client</Button></Link>
          <Link to="/tax/accountant"><Button variant="outline" className="gap-2" size="sm"><Shield className="w-4 h-4" /> CPA View</Button></Link>
          <Button variant="outline" size="sm" onClick={reload}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* ═══ TOP METRICS ═══ */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {[
          { label: "Clients", value: clients.length, icon: Users, color: "text-primary" },
          { label: "Active", value: activeFiles, icon: FileText, color: "text-secondary" },
          { label: "New Intake", value: sc.new_intake || 0, icon: Plus, color: "text-blue-600" },
          { label: "Awaiting Docs", value: sc.awaiting_documents || 0, icon: Clock, color: "text-amber-600" },
          { label: "In Prep", value: (sc.extraction_complete || 0) + (sc.draft_in_progress || 0), icon: RefreshCw, color: "text-purple-600" },
          { label: "Review", value: sc.awaiting_review || 0, icon: Shield, color: "text-indigo-600" },
          { label: "Unpaid", value: unpaidActive, icon: DollarSign, color: "text-destructive" },
          { label: "Completed", value: sc.completed || 0, icon: CheckCircle2, color: "text-green-600" },
          { label: "Urgent", value: urgentFiles, icon: CalendarClock, color: "text-destructive" },
          { label: "Revenue", value: `$${(totalRevenue / 100).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-2 text-center">
              <s.icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${s.color}`} />
              <p className="text-base font-bold leading-tight">{s.value}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ TABS ═══ */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pipeline">Pipeline Board</TabsTrigger>
          <TabsTrigger value="queue">Work Queue</TabsTrigger>
          <TabsTrigger value="intake">Intake ({sc.new_intake || 0})</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* ═══ PIPELINE BOARD ═══ */}
        <TabsContent value="pipeline">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {PIPELINE_DISPLAY.map(col => {
                const colFiles = files.filter(f => col.keys.includes(f.status));
                return (
                  <div key={col.label} className={`w-56 shrink-0 bg-muted/30 rounded-xl border-t-4 ${col.color}`}>
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <col.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold">{col.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] h-5">{colFiles.length}</Badge>
                    </div>
                    <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px]">
                      <div className="px-2 pb-3 space-y-2">
                        {colFiles.length === 0 && (
                          <p className="text-[10px] text-muted-foreground text-center py-6">Empty</p>
                        )}
                        {colFiles.map(f => <FileCard key={f.id} f={f} compact />)}
                      </div>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ═══ WORK QUEUE (table view) ═══ */}
        <TabsContent value="queue" className="space-y-4">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by client name…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_ORDER.map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]?.label} ({sc[s] || 0})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredFiles.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No filings match your criteria.</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_100px_100px_120px_100px_80px_40px] gap-2 px-4 py-2 bg-muted/50 text-[10px] font-semibold text-muted-foreground uppercase">
                <span>Client / Entity</span><span>Filing</span><span>Service</span><span>Status</span><span>Assigned</span><span>Activity</span><span />
              </div>
              <div className="divide-y">
                {filteredFiles.map(f => {
                  const name = getClientName(f.tax_client_id);
                  const assignee = getStaffName(f.assigned_to);
                  const isUrgent = f.is_urgent || (f.deadline && new Date(f.deadline) < new Date(Date.now() + 7 * 86400000));
                  return (
                    <div key={f.id} className={`grid grid-cols-[1fr_100px_100px_120px_100px_80px_40px] gap-2 px-4 py-2.5 items-center hover:bg-muted/30 transition text-sm ${isUrgent ? "bg-destructive/5" : ""}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                        <Link to={`/tax/file/${f.id}`} className="font-medium truncate hover:underline text-sm">{name}</Link>
                      </div>
                      <span className="text-xs text-muted-foreground">{f.filing_type}</span>
                      <span className="text-xs text-muted-foreground capitalize">{f.service_mode?.replace(/_/g, " ") || "—"}</span>
                      <Select value={f.status} onValueChange={v => updateFileStatus(f.id, v)}>
                        <SelectTrigger className="h-6 text-[10px] px-2">
                          <Badge className={`text-[9px] ${STATUS_LABELS[f.status]?.color || "bg-muted"}`}>
                            {STATUS_LABELS[f.status]?.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]?.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select onValueChange={v => assignStaff(f.id, v)}>
                        <SelectTrigger className="h-6 text-[10px] px-2"><SelectValue placeholder={assignee || "Assign"} /></SelectTrigger>
                        <SelectContent>
                          {staff.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.display_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <span className="text-[10px] text-muted-foreground">{new Date(f.updated_at).toLocaleDateString()}</span>
                      <Link to={`/tax/file/${f.id}`}><ChevronRight className="w-4 h-4 text-muted-foreground" /></Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ INTAKE QUEUE ═══ */}
        <TabsContent value="intake" className="space-y-3">
          {files.filter(f => f.status === "new_intake").length === 0 ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No pending intakes</p>
              <p className="text-xs mt-1">New client intakes will appear here when submitted.</p>
            </CardContent></Card>
          ) : files.filter(f => f.status === "new_intake").map(f => {
            const name = getClientName(f.tax_client_id);
            const cl = clientMap.get(f.tax_client_id);
            const isUrgent = f.is_urgent || (f.deadline && new Date(f.deadline) < new Date(Date.now() + 7 * 86400000));
            return (
              <Card key={f.id} className={`border-l-4 ${isUrgent ? "border-l-destructive" : "border-l-blue-500"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{name}</p>
                        {isUrgent && <Badge className="bg-destructive text-destructive-foreground text-[10px]">Urgent</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {f.filing_type} · TY{f.tax_year} · <span className="capitalize">{cl?.tax_user_type || "—"}</span> · <span className="capitalize">{f.service_mode?.replace(/_/g, " ")}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Intake: {new Date(f.created_at).toLocaleDateString()} {f.deadline && `· Deadline: ${new Date(f.deadline).toLocaleDateString()}`}
                      </p>
                      {cl?.email && <p className="text-xs text-muted-foreground">{cl.email}</p>}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Select onValueChange={v => assignStaff(f.id, v)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Assign Staff" /></SelectTrigger>
                        <SelectContent>
                          {staff.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.display_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" onClick={() => updateFileStatus(f.id, "awaiting_documents")}>Accept</Button>
                      <Link to={`/tax/file/${f.id}`}><Button size="sm">Open File <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ═══ CLIENTS ═══ */}
        <TabsContent value="clients" className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search clients…" />
          </div>
          {clients.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No clients yet.</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_140px_100px_80px_60px] gap-2 px-4 py-2 bg-muted/50 text-[10px] font-semibold text-muted-foreground uppercase">
                <span>Name</span><span>Email</span><span>Type</span><span>Files</span><span />
              </div>
              <div className="divide-y">
                {clients.map(c => (
                  <div key={c.id} className="grid grid-cols-[1fr_140px_100px_80px_60px] gap-2 px-4 py-2.5 items-center hover:bg-muted/30 text-sm">
                    <div className="flex items-center gap-2">
                      {c.organization_name ? <Building2 className="w-4 h-4 text-secondary shrink-0" /> : <Users className="w-4 h-4 text-primary shrink-0" />}
                      <span className="font-medium truncate">{c.organization_name || `${c.legal_first_name || ""} ${c.legal_last_name || ""}`.trim()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                    <Badge variant="outline" className="text-[10px] capitalize w-fit">{c.tax_user_type}</Badge>
                    <Badge variant="secondary" className="text-[10px] w-fit">{files.filter(f => f.tax_client_id === c.id).length}</Badge>
                    <span />
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ TEAM ═══ */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Staff Workload</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(staffWorkload).length === 0 ? (
                <p className="text-sm text-muted-foreground">No active assignments.</p>
              ) : Object.entries(staffWorkload).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-36 truncate">{name}</span>
                  <Progress value={Math.min((count / Math.max(activeFiles, 1)) * 100, 100)} className="flex-1 h-2.5" />
                  <span className="text-sm font-bold w-8 text-right">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staff.map(s => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{s.display_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{s.role.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {files.filter(f => f.assigned_to === s.user_id && f.status !== "completed").length} active
                    </Badge>
                    <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ REVENUE ═══ */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Revenue", value: `$${(totalRevenue / 100).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600" },
              { label: "Paid Files", value: files.filter(f => f.payment_status === "paid").length, icon: CheckCircle2, color: "text-green-600" },
              { label: "Unpaid Active", value: unpaidActive, icon: AlertTriangle, color: "text-amber-600" },
              { label: "Completed", value: sc.completed || 0, icon: BarChart3, color: "text-primary" },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 text-center">
                  <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue by Filing Type</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(revenueByType).length === 0 ? (
                <p className="text-sm text-muted-foreground">No paid filings yet.</p>
              ) : Object.entries(revenueByType).sort((a, b) => b[1] - a[1]).map(([type, cents]) => (
                <div key={type} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <span className="capitalize">{type.replace(/_/g, " ")}</span>
                  <span className="font-bold">${(cents / 100).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue by Staff</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const byStaff: Record<string, number> = {};
                files.filter(f => f.payment_status === "paid" && f.assigned_to).forEach(f => {
                  const name = getStaffName(f.assigned_to) || "Unassigned";
                  byStaff[name] = (byStaff[name] || 0) + (f.payment_amount_cents || 0);
                });
                return Object.entries(byStaff).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff revenue data yet.</p>
                ) : Object.entries(byStaff).sort((a, b) => b[1] - a[1]).map(([name, cents]) => (
                  <div key={name} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <span>{name}</span>
                    <span className="font-bold">${(cents / 100).toLocaleString()}</span>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ INTERNAL NOTES ═══ */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><StickyNote className="w-4 h-4" /> Add Internal Note</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write an internal note (staff-only)…" rows={3} />
              <Button size="sm" disabled={!noteText.trim()} onClick={addPortalNote}>
                <Send className="w-4 h-4 mr-1" /> Post Note
              </Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {notes.length === 0 && (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No internal notes yet.</CardContent></Card>
            )}
            {notes.map(n => (
              <Card key={n.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] capitalize">{n.note_type?.replace(/_/g, " ")}</Badge>
                    <span className="text-xs font-medium">{n.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                    {n.is_urgent && <Badge className="bg-destructive text-destructive-foreground text-[10px]">Urgent</Badge>}
                    {n.tax_file_id && <Badge variant="secondary" className="text-[9px]">File linked</Badge>}
                  </div>
                  <p className="text-sm">{n.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CCGVSPortal;
