import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, FileText, ChevronRight,
  Loader2, Sparkles, Plus, Clock, Edit,
  FolderOpen, AlertTriangle, MessageSquare, Download,
  ArrowRight, Shield, Search, Calculator,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useEnsureCase } from "@/hooks/useEnsureCase";
import type { Tables } from "@/integrations/supabase/types";
import AffiliateReferralWidget from "@/components/referrals/AffiliateReferralWidget";
import RequestHelpDialog from "@/components/RequestHelpDialog";
import {
  buildLastVisitedFormStorageKey,
  getResumeForm,
  sortFormsForResume,
} from "@/lib/form-flow";

type FormInstance = Tables<"form_instances">;

const QUICK_FORMS = [
  { code: "I-130", name: "Family Petition", desc: "Sponsor a relative" },
  { code: "I-485", name: "Green Card", desc: "Adjust status" },
  { code: "I-765", name: "Work Permit", desc: "Employment auth" },
  { code: "I-864", name: "Financial Support", desc: "Affidavit of support" },
  { code: "N-400", name: "Citizenship", desc: "Naturalization" },
  { code: "EOIR-29", name: "Appeal", desc: "Immigration appeal" },
];

const PortalHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { caseId, loading: caseEnsureLoading } = useEnsureCase();
  const [myForms, setMyForms] = useState<FormInstance[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [docCount, setDocCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [hasExport, setHasExport] = useState(false);
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const firstName = displayName.split(" ")[0];

  useEffect(() => {
    if (!caseId) { setLoadingForms(false); return; }
    const fetchData = async () => {
      setLoadingForms(true);
      const [
        { data: formsData },
        { count: docCnt },
        { count: exportCnt },
        { count: msgCnt },
      ] = await Promise.all([
        supabase.from("form_instances").select("*").eq("case_id", caseId).order("updated_at", { ascending: false }),
        supabase.from("documents").select("*", { count: "exact", head: true }).eq("case_id", caseId),
        supabase.from("case_exports").select("*", { count: "exact", head: true }).eq("case_id", caseId).eq("status", "completed"),
        supabase.from("case_messages").select("*", { count: "exact", head: true }).eq("case_id", caseId).eq("read", false),
      ]);
      setMyForms(formsData || []);
      setDocCount(docCnt || 0);
      setHasExport((exportCnt || 0) > 0);
      setUnreadMessages(msgCnt || 0);
      setLoadingForms(false);
    };
    fetchData();
  }, [caseId]);

  const lastVisitedFormId = useMemo(() => {
    if (typeof window === "undefined" || !caseId) return null;
    return window.localStorage.getItem(buildLastVisitedFormStorageKey(caseId));
  }, [caseId]);

  const orderedForms = useMemo(
    () => sortFormsForResume(myForms, lastVisitedFormId),
    [myForms, lastVisitedFormId],
  );

  const resumeForm = useMemo(
    () => getResumeForm(myForms, lastVisitedFormId),
    [myForms, lastVisitedFormId],
  );

  const totalProgress = myForms.length > 0
    ? Math.round(myForms.reduce((sum, f) => sum + (f.progress ?? 0), 0) / myForms.length)
    : 0;

  if (caseEnsureLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine next recommended action
  const getNextAction = () => {
    if (myForms.length === 0) return { text: "Start your first application", to: "/portal/forms", icon: Sparkles };
    if (resumeForm) return { text: `Continue ${resumeForm.form_type}`, to: `/portal/forms/${resumeForm.id}`, icon: ArrowRight };
    if (docCount === 0) return { text: "Upload your documents", to: "/portal/documents", icon: FolderOpen };
    return { text: "Review & export your packet", to: "/portal/packet", icon: Download };
  };
  const nextAction = getNextAction();

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6 animate-fade-in">
      {/* ═══ Welcome Hero ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your immigration case is {totalProgress}% complete. Here's what to do next.
          </p>
        </div>
        <Button onClick={() => navigate(nextAction.to)} className="gap-2 h-11 px-5 shrink-0">
          <nextAction.icon className="w-4 h-4" />
          {nextAction.text}
        </Button>
      </div>

      {/* ═══ Continue Application Card ═══ */}
      {resumeForm && (
        <Card
          className="border-2 border-primary/20 bg-primary/[0.02] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          onClick={() => navigate(`/portal/forms/${resumeForm.id}`)}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-3">
              <Clock className="w-3.5 h-3.5" />
              {(resumeForm.progress ?? 0) > 0 ? "Continue Where You Left Off" : "Next Form In Your Queue"}
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary">
                  {resumeForm.form_type.replace(/\D/g, "").slice(0, 3) || "—"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{resumeForm.form_name}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Progress value={resumeForm.progress ?? 0} className="h-2.5 flex-1" />
                  <span className="text-sm font-bold text-primary">{resumeForm.progress ?? 0}%</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-primary shrink-0" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Quick Stats ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-sm transition-all" onClick={() => navigate("/portal/forms")}>
          <CardContent className="p-4 text-center">
            <FileText className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-bold">{myForms.length}</p>
            <p className="text-[11px] text-muted-foreground">Applications</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-sm transition-all" onClick={() => navigate("/portal/documents")}>
          <CardContent className="p-4 text-center">
            <FolderOpen className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-bold">{docCount}</p>
            <p className="text-[11px] text-muted-foreground">Documents</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-sm transition-all" onClick={() => navigate("/portal/messages")}>
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-bold">{unreadMessages}</p>
            <p className="text-[11px] text-muted-foreground">Messages</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-sm transition-all" onClick={() => navigate("/portal/packet")}>
          <CardContent className="p-4 text-center">
            <Download className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-bold">{hasExport ? "✓" : "—"}</p>
            <p className="text-[11px] text-muted-foreground">Exports</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Alerts Row ═══ */}
      {docCount === 0 && myForms.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Missing Documents</p>
              <p className="text-xs text-muted-foreground">Upload supporting documents to complete your case.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/portal/documents")} className="shrink-0 gap-1">
              Upload <ArrowRight className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══ Request Professional Help ═══ */}
      <Card className="border-primary/20 bg-primary/[0.02] hover:shadow-md transition-all">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Need Professional Help?</p>
            <p className="text-xs text-muted-foreground">Request an attorney, A&R, or nonprofit to assist with your case</p>
          </div>
          <RequestHelpDialog />
        </CardContent>
      </Card>

      {/* ═══ Tax Services Card ═══ */}
      <Card className="border-secondary/20 bg-secondary/[0.02] hover:shadow-md transition-all cursor-pointer" onClick={() => navigate("/tax")}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
            <Calculator className="w-6 h-6 text-secondary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Accounting & Tax Services</p>
            <p className="text-xs text-muted-foreground">Guided tax filing and nonprofit reporting</p>
          </div>
          <ArrowRight className="w-5 h-5 text-secondary shrink-0" />
        </CardContent>
      </Card>

      {/* ═══ Start New Application ═══ */}
      <div>
        <h2 className="font-display font-bold text-lg mb-3">Start New Application</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_FORMS.map(f => (
            <Card
              key={f.code}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
              onClick={() => navigate("/portal/forms")}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground">{f.code}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-3 gap-2 h-10" onClick={() => navigate("/portal/forms")}>
          <Plus className="w-4 h-4" /> View All 48+ Immigration Forms
        </Button>
      </div>

      {/* ═══ My Applications ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg">My Applications</h2>
          {myForms.length > 0 && (
            <Link to="/portal/forms" className="text-xs text-primary font-medium hover:underline">
              View All
            </Link>
          )}
        </div>

        {loadingForms ? (
          <Card>
            <CardContent className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading applications…</span>
            </CardContent>
          </Card>
        ) : myForms.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center space-y-4">
              <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto" />
              <div>
                <p className="font-semibold">No applications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start your immigration case by selecting a form above.
                </p>
              </div>
              <Button asChild className="gap-2">
                <Link to="/portal/petition-builder">
                  <Sparkles className="w-4 h-4" /> Start My Case
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {orderedForms.slice(0, 8).map(form => {
              const statusMap: Record<string, { label: string; color: string }> = {
                not_started: { label: "Not Started", color: "bg-muted text-muted-foreground" },
                started: { label: "In Progress", color: "bg-secondary/15 text-secondary" },
                in_progress: { label: "In Progress", color: "bg-secondary/15 text-secondary" },
                completed: { label: "Completed", color: "bg-success/15 text-success" },
                ready_for_review: { label: "Ready for Review", color: "bg-primary/15 text-primary" },
                approved: { label: "Approved", color: "bg-success/15 text-success" },
                denied: { label: "Denied", color: "bg-destructive/15 text-destructive" },
              };
              const s = statusMap[form.status] || statusMap.not_started;

              return (
                <Card
                  key={form.id}
                  className="hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/portal/forms/${form.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {form.form_type.replace(/\D/g, "").slice(0, 3) || "—"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{form.form_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0", s.color)}>
                            {s.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{form.progress ?? 0}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    {(form.progress ?? 0) > 0 && (
                      <Progress value={form.progress ?? 0} className="h-1.5 mt-3" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Affiliate Widget ═══ */}
      <AffiliateReferralWidget />

      {/* ═══ Trust Footer ═══ */}
      <div className="flex items-center justify-center gap-6 py-4">
        {[
          { icon: Shield, text: "Encrypted" },
          { icon: CheckCircle2, text: "Save Anytime" },
          { icon: Search, text: "Guided" },
        ].map(t => (
          <div key={t.text} className="flex items-center gap-1.5 text-muted-foreground/50">
            <t.icon className="w-3.5 h-3.5" />
            <span className="text-[10px]">{t.text}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/40 text-center pb-6">
        D.O.M.E. provides educational guidance and form-preparation support — not legal advice.
      </p>
    </div>
  );
};

export default PortalHome;
