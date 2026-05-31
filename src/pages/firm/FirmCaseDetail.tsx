import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, FileText, User, Shield, MessageSquare, StickyNote,
  Clock, Send, Pin, Upload, AlertTriangle, BarChart3, CheckSquare,
  Globe, DollarSign, Loader2, FileDown, Eye, Pencil, Users,
  ArrowUpRight, Bell, CalendarDays, Search, Plus, ExternalLink,
} from "lucide-react";
import ExportPacketDialog from "@/components/ExportPacketDialog";
import {
  useCase, useCaseFormInstances, useCaseDocuments, useCaseTimeline,
  useCaseMessages, useCasePayments, useCaseNotes, useCaseConsistencyIssues,
  useCasePersons, useSendMessage,
} from "@/hooks/useCases";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

/* ── Status Maps ── */
const statusLabels: Record<string, string> = {
  draft: "New Intake", in_progress: "In Progress", waiting_client: "Awaiting Client Info",
  ready_for_review: "Needs Review", submitted: "Submitted", approved: "Approved",
  denied: "Denied", closed: "Closed", rfe_issued: "RFE Issued", rfe_response_sent: "RFE Sent",
};
const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", in_progress: "bg-primary/10 text-primary",
  waiting_client: "bg-warning/10 text-warning", ready_for_review: "bg-accent text-accent-foreground",
  submitted: "bg-primary/10 text-primary", approved: "bg-emerald-100 text-emerald-700",
  denied: "bg-destructive/10 text-destructive", closed: "bg-muted text-muted-foreground",
};
const formStatusLabels: Record<string, string> = {
  not_started: "Not Started", started: "Started", in_progress: "In Progress",
  completed: "Ready for Review", ready_for_review: "Needs Review",
  submitted: "Exported", approved: "Approved", denied: "Denied",
};
const formStatusColors: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground", started: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning", completed: "bg-emerald-100 text-emerald-700",
  ready_for_review: "bg-accent text-accent-foreground", submitted: "bg-primary/10 text-primary",
  approved: "bg-emerald-100 text-emerald-700", denied: "bg-destructive/10 text-destructive",
};
const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground", medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning", urgent: "bg-destructive/10 text-destructive",
};

const FirmCaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [showExport, setShowExport] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [noteType, setNoteType] = useState("attorney");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: caseData, isLoading } = useCase(id);
  const { data: formInstances } = useCaseFormInstances(id);
  const { data: documents } = useCaseDocuments(id);
  const { data: timeline } = useCaseTimeline(id);
  const { data: messages } = useCaseMessages(id);
  const { data: payments } = useCasePayments(id);
  const { data: notes } = useCaseNotes(id);
  const { data: issues } = useCaseConsistencyIssues(id);
  const { data: persons } = useCasePersons(id);
  const sendMessage = useSendMessage(id || "");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!caseData) return <div className="p-8 text-muted-foreground">Case not found.</div>;

  const beneficiary = (persons || []).find(p => p.role === "beneficiary");
  const petitioner = (persons || []).find(p => p.role === "petitioner");
  const formsCount = formInstances?.length || 0;
  const docsCount = documents?.length || 0;
  const missingDocs = (documents || []).filter(d => d.status === "pending" || !d.status).length;
  const completedForms = (formInstances || []).filter(f => f.status === "completed" || f.status === "approved").length;
  const pendingReviews = (formInstances || []).filter(f => f.status === "ready_for_review" || f.status === "completed").length;
  const unresolvedIssues = (issues || []).filter(i => !i.resolved).length;
  const totalPaid = (payments || []).filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    const senderName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Staff";
    await sendMessage.mutateAsync({ content: messageInput, senderName });
    setMessageInput("");
  };

  const handleAddNote = async () => {
    if (!noteInput.trim() || !user) return;
    const authorName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Staff";
    const { error } = await supabase.from("case_notes").insert({
      case_id: id!, content: `[${noteType.toUpperCase()}] ${noteInput}`,
      author_id: user.id, author_name: authorName,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNoteInput("");
    queryClient.invalidateQueries({ queryKey: ["case-notes", id] });
    toast({ title: "Note added" });
  };

  /* ── Readiness calc ── */
  const readiness = caseData.readiness_score || 0;
  const readinessColor = readiness >= 90 ? "text-emerald-600" : readiness >= 70 ? "text-blue-600" : readiness >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className="flex flex-col h-full">
      {/* ═══ CASE HEADER ═══ */}
      <div className="sticky top-0 z-20 bg-card border-b">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/firm"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-base sm:text-xl font-bold truncate">{caseData.case_number}</h1>
                <Badge className={statusColors[caseData.status] || "bg-muted"}>{statusLabels[caseData.status] || caseData.status}</Badge>
                <Badge className={priorityColors[caseData.priority] || ""} variant="outline">{caseData.priority}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
                <span>{caseData.case_type}</span>
                {caseData.visa_type && <><span>·</span><span>{caseData.visa_type}</span></>}
                {beneficiary && <><span>·</span><span className="font-medium text-foreground">{beneficiary.first_name} {beneficiary.last_name}</span></>}
                {caseData.representative && <><span>·</span><span>Atty: {caseData.representative}</span></>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" onClick={() => setShowExport(true)}>
                <FileDown className="w-3.5 h-3.5" />Export
              </Button>
            </div>
          </div>
        </div>

        {/* Quick stat bar */}
        <div className="px-4 sm:px-6 pb-2 flex items-center gap-3 sm:gap-5 text-xs overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className={cn("w-2.5 h-2.5 rounded-full", readiness >= 70 ? "bg-emerald-500" : readiness >= 40 ? "bg-yellow-500" : "bg-destructive")} />
            <span className="text-muted-foreground">Readiness</span>
            <span className={cn("font-bold", readinessColor)}>{readiness}%</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap"><FileText className="w-3 h-3 text-muted-foreground" /><span>{formsCount} Forms</span></div>
          <div className="flex items-center gap-1.5 whitespace-nowrap"><Shield className="w-3 h-3 text-muted-foreground" /><span>{docsCount} Docs</span></div>
          {pendingReviews > 0 && <div className="flex items-center gap-1.5 whitespace-nowrap text-warning"><Bell className="w-3 h-3" /><span>{pendingReviews} need review</span></div>}
          {unresolvedIssues > 0 && <div className="flex items-center gap-1.5 whitespace-nowrap text-destructive"><AlertTriangle className="w-3 h-3" /><span>{unresolvedIssues} issues</span></div>}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 overflow-auto">
        <div className={cn("flex", isMobile ? "flex-col" : "")}>
          {/* Main panel */}
          <div className="flex-1 min-w-0 p-4 sm:p-6">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="overview" className="gap-1 text-xs sm:text-sm"><BarChart3 className="w-3.5 h-3.5" />Overview</TabsTrigger>
                <TabsTrigger value="client" className="gap-1 text-xs sm:text-sm"><User className="w-3.5 h-3.5" />Client</TabsTrigger>
                <TabsTrigger value="forms" className="gap-1 text-xs sm:text-sm"><FileText className="w-3.5 h-3.5" />Forms</TabsTrigger>
                <TabsTrigger value="documents" className="gap-1 text-xs sm:text-sm"><Shield className="w-3.5 h-3.5" />Documents</TabsTrigger>
                <TabsTrigger value="tasks" className="gap-1 text-xs sm:text-sm"><CheckSquare className="w-3.5 h-3.5" />Tasks</TabsTrigger>
                <TabsTrigger value="messages" className="gap-1 text-xs sm:text-sm"><MessageSquare className="w-3.5 h-3.5" />Messages</TabsTrigger>
                <TabsTrigger value="notes" className="gap-1 text-xs sm:text-sm"><StickyNote className="w-3.5 h-3.5" />Notes</TabsTrigger>
                <TabsTrigger value="timeline" className="gap-1 text-xs sm:text-sm"><Clock className="w-3.5 h-3.5" />Timeline</TabsTrigger>
                <TabsTrigger value="review" className="gap-1 text-xs sm:text-sm"><Eye className="w-3.5 h-3.5" />Review & Export</TabsTrigger>
                <TabsTrigger value="assignment" className="gap-1 text-xs sm:text-sm"><Users className="w-3.5 h-3.5" />Assignment</TabsTrigger>
                <TabsTrigger value="billing" className="gap-1 text-xs sm:text-sm"><DollarSign className="w-3.5 h-3.5" />Billing</TabsTrigger>
                <TabsTrigger value="language" className="gap-1 text-xs sm:text-sm"><Globe className="w-3.5 h-3.5" />Language</TabsTrigger>
              </TabsList>

              {/* ════ OVERVIEW ════ */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Readiness</p><p className={cn("text-2xl font-bold", readinessColor)}>{readiness}%</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Forms</p><p className="text-2xl font-bold">{completedForms}/{formsCount}</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Documents</p><p className="text-2xl font-bold">{docsCount}</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Issues</p><p className={cn("text-2xl font-bold", unresolvedIssues > 0 ? "text-destructive" : "text-emerald-600")}>{unresolvedIssues}</p></CardContent></Card>
                </div>

                {/* Readiness bars */}
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Case Progress</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div><div className="flex justify-between text-sm mb-1"><span>Forms</span><span>{caseData.forms_completion || 0}%</span></div><Progress value={caseData.forms_completion || 0} className="h-2" /></div>
                    <div><div className="flex justify-between text-sm mb-1"><span>Evidence</span><span>{caseData.evidence_completion || 0}%</span></div><Progress value={caseData.evidence_completion || 0} className="h-2" /></div>
                    <div><div className="flex justify-between text-sm mb-1"><span>Consistency</span><span>{caseData.consistency_score || 0}%</span></div><Progress value={caseData.consistency_score || 0} className="h-2" /></div>
                  </CardContent>
                </Card>

                {/* Consistency Issues */}
                {unresolvedIssues > 0 && (
                  <Card className="border-destructive/30">
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />Consistency Issues ({unresolvedIssues})</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {(issues || []).filter(i => !i.resolved).map(issue => (
                        <div key={issue.id} className={cn("p-2.5 rounded-lg text-sm", issue.severity === "high" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
                          <p className="font-medium">{issue.field}: {issue.description}</p>
                          {issue.affected_forms?.length ? <p className="text-xs mt-0.5 opacity-80">Affects: {issue.affected_forms.join(", ")}</p> : null}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Persons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Beneficiary</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {beneficiary ? (<>
                        <p><span className="text-muted-foreground">Name:</span> {beneficiary.first_name} {beneficiary.middle_name || ""} {beneficiary.last_name}</p>
                        <p><span className="text-muted-foreground">DOB:</span> {beneficiary.date_of_birth || "—"}</p>
                        <p><span className="text-muted-foreground">Country:</span> {beneficiary.country_of_birth || "—"}</p>
                        <p><span className="text-muted-foreground">A-Number:</span> {beneficiary.alien_number || "—"}</p>
                      </>) : <p className="text-muted-foreground">Not added yet</p>}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Petitioner</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {petitioner ? (<>
                        <p><span className="text-muted-foreground">Name:</span> {petitioner.first_name} {petitioner.middle_name || ""} {petitioner.last_name}</p>
                        <p><span className="text-muted-foreground">DOB:</span> {petitioner.date_of_birth || "—"}</p>
                        <p><span className="text-muted-foreground">Country:</span> {petitioner.country_of_birth || "—"}</p>
                      </>) : <p className="text-muted-foreground">Not added yet</p>}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ════ CLIENT PROFILE ════ */}
              <TabsContent value="client" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Client Profile</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {(persons || []).map(person => (
                      <div key={person.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold capitalize">{person.role}</h3>
                          <Badge variant="outline">{person.role}</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Full Name:</span> {person.first_name} {person.middle_name || ""} {person.last_name}</div>
                          <div><span className="text-muted-foreground">DOB:</span> {person.date_of_birth || "—"}</div>
                          <div><span className="text-muted-foreground">Country of Birth:</span> {person.country_of_birth || "—"}</div>
                          <div><span className="text-muted-foreground">Nationality:</span> {person.nationality || "—"}</div>
                          <div><span className="text-muted-foreground">A-Number:</span> {person.alien_number || "—"}</div>
                          <div><span className="text-muted-foreground">Gender:</span> {person.gender || "—"}</div>
                          <div><span className="text-muted-foreground">Marital Status:</span> {person.marital_status || "—"}</div>
                          <div><span className="text-muted-foreground">Email:</span> {person.email || "—"}</div>
                          <div><span className="text-muted-foreground">Phone:</span> {person.phone || "—"}</div>
                        </div>
                      </div>
                    ))}
                    {(!persons || persons.length === 0) && <p className="text-center text-muted-foreground py-6">No client profiles linked to this case.</p>}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm"><Pencil className="w-3.5 h-3.5 mr-1.5" />Edit Profile</Button>
                      <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1.5" />View Passport</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ FORMS ════ */}
              <TabsContent value="forms" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">Forms ({formsCount})</h2>
                  <div className="flex gap-2">
                    <div className="relative hidden sm:block">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input placeholder="Search forms..." className="pl-8 h-9 w-48" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {(!formInstances || formInstances.length === 0) ? (
                    <Card><CardContent className="p-6 text-center text-muted-foreground">No forms added to this case yet.</CardContent></Card>
                  ) : formInstances.filter(f => !searchQuery || f.form_type.toLowerCase().includes(searchQuery.toLowerCase()) || f.form_name.toLowerCase().includes(searchQuery.toLowerCase())).map(fi => (
                    <Card key={fi.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{fi.form_type}</span>
                              <span className="text-sm text-muted-foreground truncate">– {fi.form_name}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <Progress value={fi.progress || 0} className="h-1.5 flex-1 max-w-[200px]" />
                              <span className="text-xs text-muted-foreground">{fi.progress || 0}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={formStatusColors[fi.status] || "bg-muted"}>{formStatusLabels[fi.status] || fi.status}</Badge>
                            <Button variant="outline" size="sm" className="gap-1"><Eye className="w-3 h-3" />View</Button>
                            <Button variant="outline" size="sm" className="gap-1"><Pencil className="w-3 h-3" />Review</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ════ DOCUMENTS ════ */}
              <TabsContent value="documents" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">Documents ({docsCount})</h2>
                  <Button size="sm"><Upload className="w-3.5 h-3.5 mr-1.5" />Upload</Button>
                </div>
                {(!documents || documents.length === 0) ? (
                  <Card><CardContent className="p-6 text-center text-muted-foreground">No documents uploaded yet.</CardContent></Card>
                ) : (
                  <div className="grid gap-2">
                    {documents.map(doc => (
                      <Card key={doc.id}>
                        <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.category} · {doc.file_type || "File"} · {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={
                              doc.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                              doc.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                            }>{doc.status || "pending"}</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-3.5 h-3.5" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ════ TASKS ════ */}
              <TabsContent value="tasks" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">Case Tasks</h2>
                  <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" />Create Task</Button>
                </div>
                {/* Auto-generated tasks from missing items */}
                <div className="space-y-2">
                  {(formInstances || []).filter(f => f.status === "not_started" || f.status === "started").map(fi => (
                    <Card key={`task-form-${fi.id}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <CheckSquare className="w-4 h-4 text-warning shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Complete {fi.form_type}</p>
                          <p className="text-xs text-muted-foreground">{fi.form_name} · {fi.progress || 0}% done</p>
                        </div>
                        <Badge variant="outline" className="bg-warning/10 text-warning">Pending</Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {(documents || []).filter(d => d.status === "pending" || !d.status).map(doc => (
                    <Card key={`task-doc-${doc.id}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Upload className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Review document: {doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.category}</p>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary">Review</Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {(!formInstances?.length && !documents?.length) && <Card><CardContent className="p-6 text-center text-muted-foreground">No pending tasks.</CardContent></Card>}
                </div>
              </TabsContent>

              {/* ════ MESSAGES ════ */}
              <TabsContent value="messages">
                <Card>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {(!messages || messages.length === 0) ? (
                        <p className="text-center text-muted-foreground py-4">No messages yet.</p>
                      ) : messages.map(msg => (
                        <div key={msg.id} className={cn("flex", msg.sender_role === "client" ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[80%] p-3 rounded-xl text-sm",
                            msg.sender_role === "client" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                          )}>
                            <p className="font-medium text-xs mb-1 opacity-80">{msg.sender_name} · {msg.sender_role}</p>
                            <p>{msg.content}</p>
                            <p className="text-xs mt-1.5 opacity-60">{new Date(msg.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Input placeholder="Type a message..." value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMessage()} className="flex-1" />
                      <Button size="sm" onClick={handleSendMessage} disabled={sendMessage.isPending}><Send className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ NOTES ════ */}
              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Add Internal Note</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Select value={noteType} onValueChange={setNoteType}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attorney">Attorney Note</SelectItem>
                          <SelectItem value="staff">Staff Note</SelectItem>
                          <SelectItem value="intake">Intake Note</SelectItem>
                          <SelectItem value="escalation">Escalation Note</SelectItem>
                          <SelectItem value="review">Review Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea placeholder="Write an internal note..." value={noteInput} onChange={e => setNoteInput(e.target.value)} rows={3} />
                    <Button size="sm" onClick={handleAddNote} disabled={!noteInput.trim()}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Note</Button>
                  </CardContent>
                </Card>
                {(!notes || notes.length === 0) ? (
                  <Card><CardContent className="p-6 text-center text-muted-foreground">No notes yet.</CardContent></Card>
                ) : notes.map(note => (
                  <Card key={note.id} className={note.pinned ? "border-primary/30" : ""}>
                    <CardContent className="p-4">
                      {note.pinned && <Badge variant="outline" className="text-xs mb-2 gap-1"><Pin className="w-3 h-3" />Pinned</Badge>}
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{note.author_name} · {new Date(note.created_at).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* ════ TIMELINE ════ */}
              <TabsContent value="timeline">
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    {(!timeline || timeline.length === 0) ? (
                      <p className="text-center text-muted-foreground">No activity yet.</p>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                        <div className="space-y-4">
                          {timeline.map(entry => (
                            <div key={entry.id} className="relative pl-10">
                              <div className={cn("absolute left-2.5 w-3 h-3 rounded-full border-2 border-card",
                                entry.event_type === "milestone" ? "bg-emerald-500" : entry.event_type === "uscis" ? "bg-primary" : "bg-muted-foreground"
                              )} />
                              <div className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}{entry.actor_name && ` · ${entry.actor_name}`}</div>
                              <p className="text-sm font-medium mt-0.5">{entry.title}</p>
                              {entry.description && <p className="text-xs text-muted-foreground">{entry.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ REVIEW & EXPORT ════ */}
              <TabsContent value="review" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Export Readiness</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-muted-foreground text-xs">Ready Forms</p><p className="text-lg font-bold">{completedForms}</p></div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-muted-foreground text-xs">Blocked</p><p className="text-lg font-bold text-destructive">{formsCount - completedForms}</p></div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-muted-foreground text-xs">Documents</p><p className="text-lg font-bold">{docsCount}</p></div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-muted-foreground text-xs">Issues</p><p className={cn("text-lg font-bold", unresolvedIssues > 0 ? "text-destructive" : "text-emerald-600")}>{unresolvedIssues}</p></div>
                    </div>
                    {unresolvedIssues > 0 && (
                      <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
                        <AlertTriangle className="w-4 h-4 inline mr-1.5" />
                        Export blocked: {unresolvedIssues} unresolved consistency issues
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setShowExport(true)}><FileDown className="w-4 h-4 mr-2" />Export Full Packet</Button>
                  <Button variant="outline"><Eye className="w-4 h-4 mr-2" />Preview Packet</Button>
                  <Button variant="outline"><Send className="w-4 h-4 mr-2" />Send for Final Review</Button>
                </div>

                {/* Forms review list */}
                <h3 className="font-semibold text-sm mt-4">Forms Review Status</h3>
                <div className="grid gap-2">
                  {(formInstances || []).map(fi => (
                    <div key={fi.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{fi.form_type} – {fi.form_name}</p>
                        <Progress value={fi.progress || 0} className="h-1 mt-1 max-w-[200px]" />
                      </div>
                      <Badge className={formStatusColors[fi.status] || "bg-muted"} variant="outline">{formStatusLabels[fi.status] || fi.status}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ════ ASSIGNMENT ════ */}
              <TabsContent value="assignment" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Case Assignment</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="p-4 border rounded-lg space-y-2">
                        <p className="text-muted-foreground text-xs font-medium uppercase">Assigned Attorney</p>
                        <p className="font-semibold">{caseData.representative || "Not assigned"}</p>
                      </div>
                      <div className="p-4 border rounded-lg space-y-2">
                        <p className="text-muted-foreground text-xs font-medium uppercase">Assigned Staff</p>
                        <p className="font-semibold">{caseData.assigned_to || "Not assigned"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm"><Users className="w-3.5 h-3.5 mr-1.5" />Assign Attorney</Button>
                      <Button variant="outline" size="sm"><Users className="w-3.5 h-3.5 mr-1.5" />Assign Staff</Button>
                      <Button variant="outline" size="sm"><ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />Reassign Case</Button>
                      <Button variant="outline" size="sm" className="text-warning border-warning/30"><ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />Escalate to Attorney</Button>
                      <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1.5" />Transfer to Provider</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ BILLING (PLACEHOLDER) ════ */}
              <TabsContent value="billing" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-warning">${(payments || []).filter(p => p.status === "pending").reduce((s,p)=>s+Number(p.amount),0).toLocaleString()}</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-destructive">${(payments || []).filter(p => p.status === "overdue").reduce((s,p)=>s+Number(p.amount),0).toLocaleString()}</p></CardContent></Card>
                </div>
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Billing & Engagement</p>
                    <p className="text-sm mt-1">Full billing integration coming soon. Track consultation fees, service plans, invoices, and payment status.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ LANGUAGE ════ */}
              <TabsContent value="language" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Language Support</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="p-4 border rounded-lg">
                        <p className="text-muted-foreground text-xs font-medium uppercase mb-1">Client Preferred Language</p>
                        <p className="font-semibold">English</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-muted-foreground text-xs font-medium uppercase mb-1">Translation Status</p>
                        <p className="font-semibold">Available</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm"><Globe className="w-3.5 h-3.5 mr-1.5" />Request Interpreter</Button>
                      <Button variant="outline" size="sm"><MessageSquare className="w-3.5 h-3.5 mr-1.5" />Send Translated Message</Button>
                      <Button variant="outline" size="sm"><Pencil className="w-3.5 h-3.5 mr-1.5" />Change Language</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* ═══ RIGHT SIDEBAR — Quick Actions & Alerts ═══ */}
          {!isMobile && (
            <div className="w-72 border-l bg-card/50 p-4 space-y-4 shrink-0 overflow-y-auto">
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Quick Actions</h3>
                <div className="space-y-1.5">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs"><MessageSquare className="w-3.5 h-3.5" />Message Client</Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs"><Upload className="w-3.5 h-3.5" />Request Document</Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs"><FileText className="w-3.5 h-3.5" />Open Current Form</Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs"><Eye className="w-3.5 h-3.5" />Review Missing Fields</Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs"><CalendarDays className="w-3.5 h-3.5" />Schedule Consultation</Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs"><ArrowUpRight className="w-3.5 h-3.5" />Escalate Case</Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs"><StickyNote className="w-3.5 h-3.5" />Add Internal Note</Button>
                  <Button size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => setShowExport(true)}><FileDown className="w-3.5 h-3.5" />Export Packet</Button>
                </div>
              </div>

              {/* Readiness panel */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Readiness & Alerts</h3>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex justify-between text-xs mb-1"><span>Readiness</span><span className={cn("font-bold", readinessColor)}>{readiness}%</span></div>
                    <Progress value={readiness} className="h-1.5" />
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">Missing fields</span><span className="font-medium">{formsCount - completedForms > 0 ? "Yes" : "None"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pending docs</span><span className="font-medium">{missingDocs}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pending reviews</span><span className="font-medium">{pendingReviews}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Issues</span><span className={cn("font-medium", unresolvedIssues > 0 && "text-destructive")}>{unresolvedIssues}</span></div>
                  </div>
                  {caseData.deadline && (
                    <div className="p-2.5 rounded-lg bg-warning/10 text-xs">
                      <CalendarDays className="w-3 h-3 inline mr-1 text-warning" />
                      <span className="text-warning font-medium">Deadline: {new Date(caseData.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                <p className="font-medium mb-1">D.O.M.E. Notice</p>
                <p>This platform provides workflow tools and form-preparation support. D.O.M.E. does not provide legal advice.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ExportPacketDialog open={showExport} onOpenChange={setShowExport} caseNumber={caseData.case_number} caseType={caseData.case_type} formsCount={formsCount} docsCount={docsCount} />
    </div>
  );
};

export default FirmCaseDetail;
