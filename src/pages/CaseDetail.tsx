import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, FileText, CheckSquare, User, Shield, MessageSquare,
  DollarSign, StickyNote, BarChart3, AlertTriangle, Clock, Send, Pin,
  Upload, Eye, Package, Loader2, Lightbulb, FileDown,
} from "lucide-react";
import ExportPacketDialog from "@/components/ExportPacketDialog";
import {
  useCase, useCaseFormInstances, useCaseDocuments, useCaseTimeline,
  useCaseMessages, useCasePayments, useCaseNotes, useCaseConsistencyIssues,
  useCasePersons, useSendMessage,
} from "@/hooks/useCases";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import ExplainPanel from "@/components/ExplainPanel";
import { cn } from "@/lib/utils";
import CaseTimeline from "@/components/audit/CaseTimeline";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground", medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning", urgent: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  draft: "Draft", in_progress: "In Progress", waiting_client: "Waiting Client",
  ready_for_review: "Review", submitted: "Submitted", approved: "Approved",
  denied: "Denied", closed: "Closed", rfe_issued: "RFE", rfe_response_sent: "RFE Sent",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", in_progress: "bg-primary/10 text-primary",
  waiting_client: "bg-warning/10 text-warning", ready_for_review: "bg-accent text-accent-foreground",
  submitted: "bg-primary/10 text-primary", approved: "bg-success/10 text-success",
  denied: "bg-destructive/10 text-destructive", closed: "bg-muted text-muted-foreground",
  rfe_issued: "bg-warning/10 text-warning", rfe_response_sent: "bg-primary/10 text-primary",
};

const appStatusLabels: Record<string, string> = {
  not_started: "Not Started", started: "Started", in_progress: "In Progress",
  completed: "Completed", ready_for_review: "Review", submitted: "Submitted",
  approved: "Approved", denied: "Denied",
};

const appStatusColors: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground", started: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning", completed: "bg-success/10 text-success",
  ready_for_review: "bg-accent text-accent-foreground", submitted: "bg-primary/10 text-primary",
  approved: "bg-success/10 text-success", denied: "bg-destructive/10 text-destructive",
};

const CaseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showHelper, setShowHelper] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [messageInput, setMessageInput] = useState("");

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!caseData) return <div className="p-8 text-muted-foreground">Case not found.</div>;

  const totalPaid = (payments || []).filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = (payments || []).filter(p => p.status !== "paid").reduce((s, p) => s + Number(p.amount), 0);
  const beneficiary = (persons || []).find(p => p.role === "beneficiary");

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    const senderName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Unknown";
    await sendMessage.mutateAsync({ content: messageInput, senderName });
    setMessageInput("");
  };

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className={cn("flex-1 min-w-0 space-y-0", showHelper && !isMobile && "mr-0")}>
        {/* ═══ Persistent Case Header ═══ */}
        <div className="sticky top-0 z-20 bg-card border-b px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/cases"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-base sm:text-xl font-bold truncate">{caseData.case_number}</h1>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs sm:text-sm text-muted-foreground">
                <span className="truncate">{caseData.case_type}</span>
                {caseData.visa_type && <><span>·</span><span>{caseData.visa_type}</span></>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button
                variant="outline" size="sm"
                className="gap-1.5 hidden sm:flex"
                onClick={() => setShowExport(true)}
              >
                <FileDown className="w-3.5 h-3.5" />
                Export
              </Button>
              <Button
                variant="outline" size="sm"
                className={cn("gap-1.5 hidden sm:flex", showHelper && "bg-secondary/10")}
                onClick={() => setShowHelper(!showHelper)}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {showHelper ? "Hide" : "Helper"}
              </Button>
              <Badge className={statusColors[caseData.status] || ""}>{statusLabels[caseData.status] || caseData.status}</Badge>
              <Badge className={cn(priorityColors[caseData.priority], "hidden sm:inline-flex")}>{caseData.priority}</Badge>
            </div>
          </div>
        </div>

        {/* ═══ Tabbed Content ═══ */}
        <div className="p-4 sm:p-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 sm:p-1.5 rounded-xl overflow-x-auto">
              <TabsTrigger value="overview" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Overview</TabsTrigger>
              <TabsTrigger value="applications" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Forms</TabsTrigger>
              <TabsTrigger value="evidence" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Evidence</TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Timeline</TabsTrigger>
              <TabsTrigger value="messages" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Messages</TabsTrigger>
              <TabsTrigger value="payments" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Payments</TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><StickyNote className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Notes</TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-display">Case Readiness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center shrink-0">
                      <span className="text-2xl font-bold text-primary">{caseData.readiness_score || 0}%</span>
                    </div>
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <div className="flex justify-between text-sm mb-1"><span>Forms</span><span className="font-medium">{caseData.forms_completion || 0}%</span></div>
                        <Progress value={caseData.forms_completion || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1"><span>Evidence</span><span className="font-medium">{caseData.evidence_completion || 0}%</span></div>
                        <Progress value={caseData.evidence_completion || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1"><span>Consistency</span><span className="font-medium">{caseData.consistency_score || 0}%</span></div>
                        <Progress value={caseData.consistency_score || 0} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Beneficiary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-display flex items-center gap-2"><User className="w-4 h-4" />Beneficiary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {beneficiary ? (
                      <>
                        <div><span className="text-muted-foreground">Name:</span> {beneficiary.first_name} {beneficiary.middle_name || ""} {beneficiary.last_name}</div>
                        <div><span className="text-muted-foreground">DOB:</span> {beneficiary.date_of_birth || "—"}</div>
                        <div><span className="text-muted-foreground">Nationality:</span> {beneficiary.nationality || "—"}</div>
                        <div><span className="text-muted-foreground">A-Number:</span> {beneficiary.alien_number || "—"}</div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No beneficiary added yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Consistency */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-display flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Consistency</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {!issues || issues.length === 0 ? (
                      <p className="text-sm text-success">✓ No issues found</p>
                    ) : issues.map(issue => (
                      <div key={issue.id} className={`p-2.5 rounded-lg text-sm ${
                        issue.severity === "high" ? "bg-destructive/10 text-destructive" :
                        issue.severity === "medium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                      }`}>
                        <p className="font-medium">{issue.field}: {issue.description}</p>
                        {issue.affected_forms && issue.affected_forms.length > 0 && (
                          <p className="text-xs mt-0.5 opacity-80">Affects: {issue.affected_forms.join(", ")}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-display">Quick Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Forms</span><span className="font-medium">{formInstances?.length || 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Documents</span><span className="font-medium">{documents?.length || 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Persons</span><span className="font-medium">{persons?.length || 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Messages</span><span className="font-medium">{messages?.length || 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Balance Due</span><span className="font-medium">${totalPending.toLocaleString()}</span></div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Forms Tab ── */}
            <TabsContent value="applications" className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Forms ({formInstances?.length || 0})</h2>
              <div className="grid gap-3">
                {(!formInstances || formInstances.length === 0) ? (
                  <Card><CardContent className="p-6 text-center text-muted-foreground">No forms added to this case yet.</CardContent></Card>
                ) : formInstances.map(fi => (
                  <Card key={fi.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-semibold">{fi.form_type}</span>
                          <span className="text-sm text-muted-foreground truncate">– {fi.form_name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Progress value={fi.progress || 0} className="h-1.5 flex-1 max-w-[200px]" />
                          <span className="text-xs text-muted-foreground">{fi.progress || 0}%</span>
                        </div>
                      </div>
                      <Badge className={appStatusColors[fi.status] || ""}>{appStatusLabels[fi.status] || fi.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ── Evidence Tab ── */}
            <TabsContent value="evidence" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Evidence ({documents?.length || 0})</h2>
                <Button size="sm"><Upload className="w-3.5 h-3.5 mr-1.5" />Upload</Button>
              </div>
              {(!documents || documents.length === 0) ? (
                <Card><CardContent className="p-6 text-center text-muted-foreground">No documents uploaded yet.</CardContent></Card>
              ) : (
                <div className="grid gap-2">
                  {documents.map(doc => (
                    <Card key={doc.id}>
                      <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.category} · {doc.file_type || "Unknown"}</p>
                        </div>
                        <Badge variant="outline" className={
                          doc.status === "approved" ? "bg-success/10 text-success" :
                          doc.status === "rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }>{doc.status || "pending"}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Timeline Tab ── */}
            <TabsContent value="timeline" className="space-y-4">
              {/* Audit Trail Timeline */}
              {caseData?.id && <CaseTimeline caseId={caseData.id} />}

              {/* Legacy Timeline */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {(!timeline || timeline.length === 0) ? (
                    <p className="text-center text-muted-foreground">No timeline events yet.</p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                      <div className="space-y-6">
                        {timeline.map(entry => (
                          <div key={entry.id} className="relative pl-10">
                            <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-card ${
                              entry.event_type === "milestone" ? "bg-success" :
                              entry.event_type === "uscis" ? "bg-primary" :
                              entry.event_type === "user" ? "bg-secondary" : "bg-muted-foreground"
                            }`} />
                            <div className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}{entry.actor_name && ` · ${entry.actor_name}`}</div>
                            <p className="text-sm font-medium mt-0.5">{entry.title}</p>
                            {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Messages Tab ── */}
            <TabsContent value="messages">
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {(!messages || messages.length === 0) ? (
                    <p className="text-center text-muted-foreground py-4">No messages yet. Start the conversation.</p>
                  ) : messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_role === "client" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-xl text-sm ${
                        msg.sender_role === "client"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}>
                        <p className="font-medium text-xs mb-1 opacity-80">{msg.sender_name}</p>
                        <p>{msg.content}</p>
                        <p className="text-xs mt-1.5 opacity-60">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2 border-t">
                    <input
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button size="sm" onClick={handleSendMessage} disabled={sendMessage.isPending}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Payments Tab ── */}
            <TabsContent value="payments" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Total Paid</p><p className="text-2xl font-bold text-success">${totalPaid.toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-warning">${(payments || []).filter(p => p.status === "pending").reduce((s,p)=>s+Number(p.amount),0).toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-destructive">${(payments || []).filter(p => p.status === "overdue").reduce((s,p)=>s+Number(p.amount),0).toLocaleString()}</p></CardContent></Card>
              </div>
              {(!payments || payments.length === 0) ? (
                <Card><CardContent className="p-6 text-center text-muted-foreground">No payments recorded.</CardContent></Card>
              ) : (
                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left"><th className="p-3 font-medium text-muted-foreground">Description</th><th className="p-3 font-medium text-muted-foreground">Amount</th><th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">Due Date</th><th className="p-3 font-medium text-muted-foreground">Status</th></tr></thead>
                      <tbody>{payments.map(p => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3">{p.description}</td>
                          <td className="p-3 font-medium">${Number(p.amount).toLocaleString()}</td>
                          <td className="p-3 text-muted-foreground hidden sm:table-cell">{p.due_date || "—"}</td>
                          <td className="p-3"><Badge className={p.status === "paid" ? "bg-success/10 text-success" : p.status === "overdue" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}>{p.status}</Badge></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Notes Tab ── */}
            <TabsContent value="notes" className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Case Notes</h2>
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
          </Tabs>
        </div>
      </div>

      {/* ═══ Helper Panel (docked right on desktop, bottom sheet on mobile) ═══ */}
      {showHelper && !isMobile && (
        <div className="w-80 border-l bg-card shrink-0 overflow-hidden">
          <ExplainPanel
            question={selectedQuestion || "Select a form question to get help"}
            formType={formInstances?.[0]?.form_type}
            fieldKey={formInstances?.[0]?.form_type}
            onClose={() => setShowHelper(false)}
          />
        </div>
      )}

      {/* Mobile helper button */}
      {isMobile && (
        <Button
          className="fixed bottom-20 right-4 z-30 rounded-full w-12 h-12 shadow-lg"
          onClick={() => setShowHelper(!showHelper)}
        >
          <Lightbulb className="w-5 h-5" />
        </Button>
      )}

      {/* Mobile bottom sheet */}
      {showHelper && isMobile && (
        <ExplainPanel
          question={selectedQuestion || "Select a form question to get help"}
          formType={formInstances?.[0]?.form_type}
          fieldKey={formInstances?.[0]?.form_type}
          mode="sheet"
          onClose={() => setShowHelper(false)}
        />
      )}
      {/* Export Packet Paywall Dialog */}
      <ExportPacketDialog
        open={showExport}
        onOpenChange={setShowExport}
        caseNumber={caseData.case_number}
        caseType={caseData.case_type}
        formsCount={formInstances?.length || 0}
        docsCount={documents?.length || 0}
      />
    </div>
  );
};

export default CaseDetail;
