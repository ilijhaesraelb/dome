/**
 * Tax Services Home — Screen 1: Clean entry point for all tax workflows.
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator, UserCheck, Building2, Upload, ArrowRight, Shield,
  Lock, ShieldCheck, Heart, FileText, Briefcase, Clock,
  MessageSquare, FolderOpen, Bot, ChevronRight,
} from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";

const ENTRY_PATHS = [
  { id: "file_taxes", label: "File My Taxes", desc: "Start a new individual or business tax return with guided preparation.", icon: Calculator, color: "bg-primary", to: "/tax/start" },
  { id: "upload_first", label: "Upload Documents First", desc: "Upload W-2s, 1099s, prior returns — AI will analyze them.", icon: Upload, color: "bg-emerald-600", to: "/tax/documents" },
  { id: "nonprofit", label: "Start Nonprofit Filing", desc: "990-N, 990-EZ, extensions, and nonprofit tax compliance.", icon: Building2, color: "bg-indigo-600", to: "/tax/nonprofit/landing" },
  { id: "ccgvs", label: "Work With CCGVS / AREI GROUP", desc: "Our experienced team prepares and reviews your return.", icon: UserCheck, color: "bg-secondary", to: "/tax/ccgvs" },
  { id: "cpa_review", label: "Accountant / CPA Review", desc: "Have a professional review your prepared return.", icon: Shield, color: "bg-amber-600", to: "/tax/review" },
  { id: "continue", label: "Continue Existing Tax File", desc: "Resume where you left off on an in-progress return.", icon: FolderOpen, color: "bg-purple-600", to: "/tax/dashboard" },
];

const TaxServicesHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: tc } = await supabase.from("tax_clients").select("id").eq("user_id", user.id).maybeSingle();
      if (tc) {
        const { data: files } = await supabase
          .from("tax_files").select("id, tax_year, filing_type, status, service_mode, updated_at")
          .eq("tax_client_id", tc.id).order("updated_at", { ascending: false }).limit(5);
        setExistingFiles(files || []);
      }
    })();
  }, [user]);

  return (
    <TaxFlowLayout
      currentStep={0}
      title="Tax Services"
      hideStepNav
      hideBottomBar
    >
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center text-primary-foreground">
          <Badge className="bg-white/10 text-white border-0 mb-4">Accounting & Tax Services</Badge>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            Intelligent Tax Preparation<br className="hidden sm:block" /> for Everyone
          </h1>
          <p className="mt-4 text-base text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Upload your documents, and our AI analyzes them to recommend the right filing path.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            {[
              { icon: Bot, text: "AI Document Analysis" },
              { icon: ShieldCheck, text: "No Immigration Signup Required" },
              { icon: Lock, text: "Save & Resume Anytime" },
              { icon: Heart, text: "Flat-Fee Pricing" },
            ].map(i => (
              <div key={i.text} className="flex items-center gap-2 text-sm text-primary-foreground/60">
                <i.icon className="w-4 h-4 text-secondary shrink-0" />
                <span className="font-medium">{i.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Entry Cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="font-display text-2xl font-bold text-center mb-2">What Would You Like To Do?</h2>
        <p className="text-center text-muted-foreground mb-8 text-sm">
          Choose a path below — no immigration registration required.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ENTRY_PATHS.map(p => (
            <Link key={p.id} to={p.to}>
              <Card className="h-full hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer border-2 hover:border-primary/30 group">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg ${p.color} flex items-center justify-center`}>
                      <p.icon className="w-5 h-5 text-white" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-sm">{p.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Continue Existing Files */}
      {existingFiles.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
          <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Your Recent Tax Files
          </h3>
          <div className="space-y-2">
            {existingFiles.map(f => (
              <Card key={f.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/tax/file/${f.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium capitalize">{f.filing_type?.replace(/_/g, " ")} — TY{f.tax_year}</p>
                      <p className="text-xs text-muted-foreground capitalize">{f.service_mode?.replace(/_/g, " ")} · {f.status?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="bg-muted/30 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-center mb-3">Flat-Fee Filing Options</h2>
          <p className="text-center text-muted-foreground mb-8">No hidden costs.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Individual Return", price: "$49", desc: "Guided individual tax preparation" },
              { label: "Nonprofit 990-EZ", price: "$75", desc: "Receipts < $200K, assets < $500K", popular: true },
              { label: "Full Service Prep", price: "$149+", desc: "We handle everything" },
            ].map(p => (
              <Card key={p.label} className={p.popular ? "border-2 border-secondary shadow-lg" : ""}>
                <CardContent className="p-6 text-center space-y-3">
                  {p.popular && <Badge className="bg-secondary text-secondary-foreground">Most Popular</Badge>}
                  <p className="text-3xl font-bold">{p.price}</p>
                  <p className="font-semibold text-sm">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          D.O.M.E. provides tax preparation tools and document organization services.
          Tax filings and recommendations should be reviewed for accuracy.
        </p>
      </section>
    </TaxFlowLayout>
  );
};

export default TaxServicesHome;
