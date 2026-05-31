import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase, Users, AlertTriangle, FileCheck, Clock, TrendingUp,
  Plus, UserPlus, Inbox, CheckCircle, Loader2, ArrowRight, Scale,
  FileText, MessageSquare, CalendarDays,
} from "lucide-react";
import { useFirm, useIntakeRequests, useFirmMembers, useCreateFirm } from "@/hooks/useFirm";
import { useCases } from "@/hooks/useCases";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import FirmIntakeQueue from "./FirmIntakeQueue";
import FirmReviewCenter from "./FirmReviewCenter";

const FirmDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { firm, firmId, firmRole, loadingMembership, hasFirm } = useFirm();
  const { data: cases = [], isLoading: loadingCases } = useCases();
  const { data: intakeRequests = [] } = useIntakeRequests(firmId);
  const { data: members = [] } = useFirmMembers(firmId);
  const createFirm = useCreateFirm();

  // Firm setup dialog
  const [showSetup, setShowSetup] = useState(false);
  const [firmName, setFirmName] = useState("");
  const [firmAddress, setFirmAddress] = useState("");

  if (loadingMembership) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasFirm) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4 py-12">
          <Scale className="w-16 h-16 mx-auto text-primary/60" />
          <h1 className="text-3xl font-display font-bold text-foreground">Law Firm Portal</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Set up your law firm on D.O.M.E. to manage clients, review forms, and build professional case packets.
          </p>
          <Button size="lg" onClick={() => setShowSetup(true)} className="gap-2">
            <Plus className="w-5 h-5" /> Create Your Firm
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          D.O.M.E. provides digital tools and workflow support. D.O.M.E. does not provide legal advice.
        </p>

        <Dialog open={showSetup} onOpenChange={setShowSetup}>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Set Up Your Law Firm</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">Firm Name *</label>
                <Input value={firmName} onChange={e => setFirmName(e.target.value)} placeholder="e.g., Smith & Associates" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Office Address</label>
                <Input value={firmAddress} onChange={e => setFirmAddress(e.target.value)} placeholder="123 Main St, City, State" className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSetup(false)}>Cancel</Button>
              <Button
                disabled={!firmName.trim() || createFirm.isPending}
                onClick={async () => {
                  try {
                    await createFirm.mutateAsync({ name: firmName, address: firmAddress });
                    toast({ title: "Firm created!", description: "Your law firm portal is ready." });
                    setShowSetup(false);
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                  }
                }}
              >
                {createFirm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Firm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Compute metrics
  const activeCases = cases.filter(c => !["approved", "denied", "closed"].includes(c.status));
  const newIntake = intakeRequests.filter(r => r.status === "new").length;
  const awaitingReview = cases.filter(c => c.status === "ready_for_review").length;
  const exportReady = cases.filter(c => (c.readiness_score || 0) >= 80).length;
  const missingDocs = cases.filter(c => (c.evidence_completion || 0) < 50).length;

  const metrics = [
    { label: "Active Clients", value: activeCases.length, icon: Users, color: "text-primary" },
    { label: "New Intake", value: newIntake, icon: Inbox, color: "text-secondary", alert: newIntake > 0 },
    { label: "Awaiting Review", value: awaitingReview, icon: AlertTriangle, color: "text-destructive", alert: awaitingReview > 0 },
    { label: "Export Ready", value: exportReady, icon: FileCheck, color: "text-green-600" },
    { label: "Missing Docs", value: missingDocs, icon: Clock, color: "text-amber-600", alert: missingDocs > 0 },
    { label: "Staff Members", value: members.length, icon: UserPlus, color: "text-primary" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{firm?.name || "Law Firm Portal"}</h1>
          <p className="text-sm text-muted-foreground">
            {firmRole === "firm_admin" ? "Firm Administrator" : firmRole === "attorney" ? "Attorney" : firmRole}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/firm/members")} className="gap-1.5">
            <UserPlus className="w-4 h-4" /> Manage Staff
          </Button>
          <Button size="sm" onClick={() => navigate("/firm/intake")} className="gap-1.5">
            <Inbox className="w-4 h-4" /> Intake Queue {newIntake > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">{newIntake}</Badge>}
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map(m => (
          <Card key={m.label} className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <m.icon className={cn("w-4 h-4", m.color)} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
                {m.alert && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse ml-auto" />}
              </div>
              <p className={cn("text-2xl font-bold font-display mt-1", m.color)}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intake">Intake Queue {newIntake > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1">{newIntake}</Badge>}</TabsTrigger>
          <TabsTrigger value="review">Review Center</TabsTrigger>
          <TabsTrigger value="cases">All Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Intake */}
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base font-display">Recent Intake Requests</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/firm/intake")} className="text-xs gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {intakeRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No intake requests yet</p>
                ) : (
                  <div className="space-y-2">
                    {intakeRequests.slice(0, 5).map(req => (
                      <div key={req.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-muted/30">
                        <div>
                          <p className="text-sm font-medium">{req.client_name}</p>
                          <p className="text-xs text-muted-foreground">{req.case_type || "General"} · {req.preferred_language?.toUpperCase()}</p>
                        </div>
                        <Badge className={cn("text-[10px]", req.status === "new" ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground")}>
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cases Needing Review */}
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base font-display">Cases Needing Review</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {awaitingReview === 0 ? (
                  <div className="flex flex-col items-center py-4 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cases.filter(c => c.status === "ready_for_review").slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/firm/cases/${c.id}`)}>
                        <div>
                          <p className="text-sm font-medium">{c.case_number}</p>
                          <p className="text-xs text-muted-foreground">{c.case_type}</p>
                        </div>
                        <Badge className="bg-accent text-accent-foreground text-[10px]">Needs Review</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Create Case", icon: Plus, action: () => navigate("/cases"), color: "bg-primary/10 text-primary" },
              { label: "Documents", icon: FileText, action: () => navigate("/documents"), color: "bg-secondary/10 text-secondary" },
              { label: "Messages", icon: MessageSquare, action: () => navigate("/portal/messages"), color: "bg-accent" },
              { label: "Calendar", icon: CalendarDays, action: () => navigate("/calendar"), color: "bg-muted" },
            ].map(a => (
              <Card key={a.label} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={a.action}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", a.color)}>
                    <a.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">{a.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="intake">
          <FirmIntakeQueue />
        </TabsContent>

        <TabsContent value="review">
          <FirmReviewCenter />
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">All Cases ({cases.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingCases ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : cases.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No cases yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Case #</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">Type</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">Priority</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">Readiness</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/50">
                      {cases.map(c => (
                        <tr key={c.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/firm/cases/${c.id}`)}>
                          <td className="px-4 py-3 font-medium">{c.case_number}</td>
                          <td className="px-3 py-3 text-muted-foreground">{c.case_type}</td>
                          <td className="px-3 py-3"><Badge variant="outline" className="text-[10px]">{c.status.replace(/_/g, " ")}</Badge></td>
                          <td className="px-3 py-3"><Badge variant="outline" className="text-[10px]">{c.priority}</Badge></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${c.readiness_score || 0}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{c.readiness_score || 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground/60 text-center">
        D.O.M.E. provides digital tools and workflow support. D.O.M.E. does not provide legal advice.
      </p>
    </div>
  );
};

export default FirmDashboard;
