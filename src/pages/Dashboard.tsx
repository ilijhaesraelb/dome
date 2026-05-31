import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefcase, FileText, Calendar, CheckSquare, AlertTriangle,
  Loader2, Users, ChevronRight, Search, Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCases, useCreateCase } from "@/hooks/useCases";
import { useAuth } from "@/contexts/AuthContext";
import domeLogo from "@/assets/dome-logo.png";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useT } from "@/hooks/useT";
import { useToast } from "@/hooks/use-toast";
import AffiliateReferralWidget from "@/components/referrals/AffiliateReferralWidget";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", in_progress: "bg-primary/10 text-primary",
  waiting_client: "bg-secondary/10 text-secondary", ready_for_review: "bg-accent text-accent-foreground",
  submitted: "bg-primary/10 text-primary", approved: "bg-success/15 text-success",
  denied: "bg-destructive/10 text-destructive", closed: "bg-muted text-muted-foreground",
  rfe_issued: "bg-warning/15 text-warning-foreground", rfe_response_sent: "bg-primary/10 text-primary",
};

const Dashboard = () => {
  const t = useT();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { data: cases, isLoading, error } = useCases();
  const createCase = useCreateCase();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Admin";
  
  // Create case dialog state
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [newCaseType, setNewCaseType] = useState("Adjustment of Status");
  const [newCaseClientName, setNewCaseClientName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateCase = async () => {
    if (!newCaseClientName.trim()) {
      toast({ title: "Client name required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await createCase.mutateAsync({
        case_type: newCaseType,
        notes: `Client: ${newCaseClientName}`,
      });
      toast({ title: "Case created", description: `New ${newCaseType} case for ${newCaseClientName}.` });
      setShowCreateCase(false);
      setNewCaseClientName("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  const statusLabel = (s: string) => t(`status.${s === "in_progress" ? "inProgress" : s === "ready_for_review" ? "readyForReview" : s === "waiting_client" ? "waitingClient" : s === "rfe_issued" ? "rfeIssued" : s === "rfe_response_sent" ? "rfeResponseSent" : s}`);

  const { activeCases, pendingReview, statCards } = useMemo(() => {
    const active = cases?.filter(c => !["approved", "denied", "closed"].includes(c.status)) || [];
    const pending = cases?.filter(c => c.status === "ready_for_review").length || 0;
    return {
      activeCases: active,
      pendingReview: pending,
      statCards: [
        { label: t("dashboard.activeCases"), value: active.length, icon: Briefcase, color: "text-primary" },
        { label: t("dashboard.pendingReviews"), value: pending, icon: AlertTriangle, color: "text-destructive", alert: pending > 0 },
        { label: t("dashboard.totalCases"), value: cases?.length || 0, icon: Users, color: "text-primary" },
      ],
    };
  }, [cases, t]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-60 flex-col bg-primary text-primary-foreground shrink-0">
        <div className="p-4 flex justify-center border-b border-primary-foreground/10">
          <img src={domeLogo} alt="D.O.M.E." className="w-28 h-auto brightness-0 invert" loading="lazy" />
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {[
            { icon: Briefcase, label: t("dashboard.caseList"), to: "/cases" },
            { icon: Search, label: t("dashboard.uscisStatus"), to: "/portal/case-status" },
            { icon: FileText, label: t("dashboard.documents"), to: "/documents" },
            { icon: Calendar, label: t("dashboard.calendar"), to: "/calendar" },
            { icon: CheckSquare, label: t("dashboard.tasks"), to: "/tasks" },
          ].map((item) => (
            <Link key={item.label} to={item.to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors">
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-foreground/10 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9"><AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">{displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold truncate">{displayName}</p><p className="text-[11px] text-primary-foreground/60 truncate">{user?.email || ""}</p></div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { signOut(); navigate("/login"); }} className="w-full text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs">{t("common.signOut")}</Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card shrink-0">
          <h1 className="font-display text-xl font-bold text-foreground">{t("dashboard.title")}</h1>
          <div className="flex items-center gap-2 ml-2">
            <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback></Avatar>
            <div className="hidden sm:block"><p className="text-xs font-bold text-foreground">{displayName}</p><p className="text-[10px] text-muted-foreground">{user?.email || ""}</p></div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="space-y-5 max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {statCards.map((stat) => (
                <Card key={stat.label} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><stat.icon className={cn("w-5 h-5", stat.color)} /></div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-2xl font-bold font-display", stat.color)}>{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value}</span>
                          {stat.alert && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="font-display text-lg font-bold">{t("dashboard.caseManagement")}</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs h-7 gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" onClick={() => setShowCreateCase(true)}>
                    <Plus className="w-3 h-3" /> New Case
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 font-semibold" onClick={() => navigate("/cases")}>{t("dashboard.viewAllCases")}</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : error ? (
                  <div className="text-center py-12 text-muted-foreground"><AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">{t("dashboard.failedLoad")}</p></div>
                ) : cases && cases.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left">
                        <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">{t("dashboard.caseNumber")}</th>
                        <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">{t("dashboard.type")}</th>
                        <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">{t("dashboard.status")}</th>
                        <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">{t("dashboard.priority")}</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border/50">
                        {cases.slice(0, 10).map((c) => (
                          <tr key={c.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/cases/${c.id}`)}>
                            <td className="px-4 py-3 font-medium text-foreground">{c.case_number}</td>
                            <td className="px-3 py-3 text-muted-foreground">{c.case_type}</td>
                            <td className="px-3 py-3"><Badge className={cn("text-[10px] font-semibold", statusColors[c.status] || "bg-muted text-muted-foreground")}>{statusLabel(c.status)}</Badge></td>
                            <td className="px-3 py-3"><Badge variant="outline" className="text-[10px]">{c.priority}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t("dashboard.noCases")}</p>
                    <Button size="sm" className="mt-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={() => navigate("/cases")}>{t("dashboard.goToCases")}</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: t("dashboard.cases"), icon: Briefcase, to: "/cases" },
                { label: t("dashboard.clients"), icon: Users, to: "/clients" },
                { label: t("dashboard.calendar"), icon: Calendar, to: "/calendar" },
                { label: t("dashboard.tasks"), icon: CheckSquare, to: "/tasks" },
              ].map((action) => (
                <Card key={action.label} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(action.to)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><action.icon className="w-5 h-5 text-primary" /></div>
                    <span className="text-sm font-semibold text-foreground">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <AffiliateReferralWidget />

            <p className="text-xs text-muted-foreground/60 text-center">{t("common.disclaimerLong")}</p>
          </div>
        </div>
      </div>

      {/* Create Case Dialog */}
      <Dialog open={showCreateCase} onOpenChange={setShowCreateCase}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Create New Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Client Name</label>
              <Input
                value={newCaseClientName}
                onChange={e => setNewCaseClientName(e.target.value)}
                placeholder="Enter client's full name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Case Type</label>
              <Select value={newCaseType} onValueChange={setNewCaseType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adjustment of Status">Adjustment of Status</SelectItem>
                  <SelectItem value="Family-Based Petition">Family-Based Petition</SelectItem>
                  <SelectItem value="Employment Authorization">Employment Authorization</SelectItem>
                  <SelectItem value="Naturalization">Naturalization</SelectItem>
                  <SelectItem value="Removal of Conditions">Removal of Conditions</SelectItem>
                  <SelectItem value="Fee Waiver">Fee Waiver</SelectItem>
                  <SelectItem value="Asylum">Asylum</SelectItem>
                  <SelectItem value="Consular Processing">Consular Processing</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCase(false)}>Cancel</Button>
            <Button onClick={handleCreateCase} disabled={creating} className="gap-1.5">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
