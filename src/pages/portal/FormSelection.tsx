import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Sparkles, FileText, ChevronRight, CheckCircle2,
  Filter, Star, Clock, ArrowLeft, Mic, Plus, Loader2, FileDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { TEMPLATE_REGISTRY } from "@/lib/pdf-template-engine";
import { useEnsureCase } from "@/hooks/useEnsureCase";

type FormCategory = "all" | "family" | "work" | "humanitarian" | "citizenship" | "travel" | "study" | "investment" | "support" | "adoption" | "other";

interface ImmigrationForm {
  code: string;
  name: string;
  description: string;
  category: FormCategory;
  aiRecommended: boolean;
  estimatedTime: string;
  popular: boolean;
  editionDate?: string;
  totalPages?: number;
  filingFee?: string;
}

const immigrationForms: ImmigrationForm[] = [
  // ── Family-Based ──
  { code: "I-130", name: "Petition for Alien Relative", description: "Sponsor a family member for a green card", category: "family", aiRecommended: true, estimatedTime: "12-24 mo", popular: true, totalPages: 12, filingFee: "$535" },
  { code: "I-485", name: "Adjustment of Status", description: "Apply for permanent residence while in the U.S.", category: "family", aiRecommended: true, estimatedTime: "8-14 mo", popular: true, totalPages: 20, filingFee: "$1,140" },
  { code: "I-864", name: "Affidavit of Support", description: "Financial sponsorship for family-based immigration", category: "family", aiRecommended: true, estimatedTime: "N/A", popular: true, totalPages: 12, filingFee: "$0" },
  { code: "I-864A", name: "Contract Between Sponsor and Household Member", description: "Joint sponsor or household member support agreement", category: "family", aiRecommended: false, estimatedTime: "N/A", popular: false, totalPages: 6, filingFee: "$0" },
  { code: "I-751", name: "Remove Conditions on Residence", description: "Remove conditions on a 2-year green card", category: "family", aiRecommended: false, estimatedTime: "12-24 mo", popular: false, totalPages: 10, filingFee: "$750" },
  { code: "I-129F", name: "Petition for Alien Fiancé(e)", description: "Petition to bring a fiancé(e) to the U.S. for marriage", category: "family", aiRecommended: false, estimatedTime: "6-15 mo", popular: true, editionDate: "01/20/25", totalPages: 11, filingFee: "$535" },
  { code: "I-693", name: "Report of Medical Examination", description: "Immigration medical exam and vaccination record", category: "family", aiRecommended: true, estimatedTime: "N/A", popular: false, editionDate: "01/20/25", totalPages: 7, filingFee: "$0" },
  { code: "I-698", name: "Adjust from Temporary to Permanent Resident", description: "Adjust status under Section 245A of the INA", category: "family", aiRecommended: false, estimatedTime: "6-12 mo", popular: false, editionDate: "01/20/25", totalPages: 6, filingFee: "$1,670" },

  // ── Work-Based ──
  { code: "I-765", name: "Application for Employment Authorization", description: "Apply for a work permit (EAD)", category: "work", aiRecommended: true, estimatedTime: "3-6 mo", popular: true, editionDate: "08/21/25", totalPages: 7, filingFee: "$410" },
  { code: "I-129", name: "Petition for Nonimmigrant Worker", description: "Employer-sponsored work visa (H-1B, L-1, O-1, etc.)", category: "work", aiRecommended: false, estimatedTime: "3-8 mo", popular: true, editionDate: "02/27/26", totalPages: 36, filingFee: "$460" },
  { code: "I-140", name: "Immigrant Petition for Alien Workers", description: "Employer-sponsored green card petition", category: "work", aiRecommended: false, estimatedTime: "6-18 mo", popular: false, totalPages: 10, filingFee: "$700" },
  { code: "I-140G", name: "Immigrant Petition for Gold Card Program", description: "Petition under the Gold Card Program", category: "work", aiRecommended: false, estimatedTime: "6-12 mo", popular: false, editionDate: "11/19/25", totalPages: 14, filingFee: "$5,000,000" },
  { code: "I-9", name: "Employment Eligibility Verification", description: "Verify identity and employment authorization of workers", category: "work", aiRecommended: false, estimatedTime: "N/A", popular: true, editionDate: "01/20/25", totalPages: 3, filingFee: "$0" },

  // ── Humanitarian ──
  { code: "I-589", name: "Application for Asylum", description: "Apply for protection from persecution", category: "humanitarian", aiRecommended: false, estimatedTime: "6-48 mo", popular: false, editionDate: "01/20/25", totalPages: 14, filingFee: "$0" },
  { code: "I-918", name: "U Visa Petition", description: "Victims of certain crimes who assist law enforcement", category: "humanitarian", aiRecommended: false, estimatedTime: "24-60 mo", popular: false, totalPages: 17, filingFee: "$0" },
  { code: "I-929", name: "Petition for Qualifying Family Member of U-1", description: "Family petition for U visa derivative beneficiaries", category: "humanitarian", aiRecommended: false, estimatedTime: "12-24 mo", popular: false, editionDate: "01/20/25", totalPages: 6, filingFee: "$230" },
  { code: "I-360", name: "Petition for Amerasian, Widow(er), or Special Immigrant", description: "VAWA self-petition and special immigrant categories", category: "humanitarian", aiRecommended: false, estimatedTime: "12-24 mo", popular: false, editionDate: "01/20/25", totalPages: 12, filingFee: "$435" },
  { code: "I-821", name: "Application for Temporary Protected Status", description: "TPS application for designated countries", category: "humanitarian", aiRecommended: false, estimatedTime: "6-18 mo", popular: false, editionDate: "01/20/25", totalPages: 7, filingFee: "$50" },
  { code: "I-821D", name: "Consideration of Deferred Action (DACA)", description: "Deferred Action for Childhood Arrivals", category: "humanitarian", aiRecommended: false, estimatedTime: "3-12 mo", popular: true, editionDate: "01/20/25", totalPages: 7, filingFee: "$410" },
  { code: "I-881", name: "Suspension of Deportation / NACARA", description: "Special rule cancellation of removal under NACARA", category: "humanitarian", aiRecommended: false, estimatedTime: "12-36 mo", popular: false, editionDate: "01/20/25", totalPages: 10, filingFee: "$285" },
  { code: "I-602", name: "Application by Refugee for Waiver", description: "Refugee waiver of inadmissibility grounds", category: "humanitarian", aiRecommended: false, estimatedTime: "6-18 mo", popular: false, editionDate: "01/20/25", totalPages: 4, filingFee: "$0" },

  // ── Citizenship ──
  { code: "N-400", name: "Application for Naturalization", description: "Apply for U.S. citizenship", category: "citizenship", aiRecommended: false, estimatedTime: "8-14 mo", popular: true, totalPages: 20, filingFee: "$710" },
  { code: "N-600", name: "Application for Certificate of Citizenship", description: "Obtain proof of U.S. citizenship acquired at birth", category: "citizenship", aiRecommended: false, estimatedTime: "6-18 mo", popular: false, editionDate: "01/20/25", totalPages: 11, filingFee: "$1,170" },
  { code: "N-600K", name: "Citizenship Certificate Under Section 322", description: "Citizenship for child residing outside the U.S.", category: "citizenship", aiRecommended: false, estimatedTime: "6-12 mo", popular: false, editionDate: "01/20/25", totalPages: 8, filingFee: "$1,170" },
  { code: "N-565", name: "Replacement Naturalization/Citizenship Document", description: "Replace lost or damaged citizenship certificate", category: "citizenship", aiRecommended: false, estimatedTime: "6-12 mo", popular: false, editionDate: "02/27/25", totalPages: 4, filingFee: "$555" },

  // ── Travel ──
  { code: "I-131", name: "Application for Travel Document", description: "Apply for advance parole or refugee travel document", category: "travel", aiRecommended: false, estimatedTime: "3-5 mo", popular: false, totalPages: 7, filingFee: "$575" },
  { code: "I-131A", name: "Application for Carrier Documentation", description: "Travel document for lawful permanent residents abroad", category: "travel", aiRecommended: false, estimatedTime: "2-4 mo", popular: false, editionDate: "01/20/25", totalPages: 4, filingFee: "$575" },
  { code: "I-539", name: "Change/Extend Nonimmigrant Status", description: "Extend your visa stay or change visa category", category: "travel", aiRecommended: false, estimatedTime: "3-8 mo", popular: false, totalPages: 11, filingFee: "$370" },
  { code: "DS-160", name: "Nonimmigrant Visa Application", description: "Apply for a temporary U.S. visa at a consulate", category: "travel", aiRecommended: false, estimatedTime: "2-6 mo", popular: false, totalPages: 10, filingFee: "$185" },
  { code: "I-90", name: "Replace Permanent Resident Card", description: "Replace or renew a green card", category: "travel", aiRecommended: false, estimatedTime: "6-12 mo", popular: true, editionDate: "01/20/25", totalPages: 6, filingFee: "$455" },
  { code: "I-212", name: "Permission to Reapply After Deportation", description: "Request permission to reapply for admission after removal", category: "travel", aiRecommended: false, estimatedTime: "6-24 mo", popular: false, editionDate: "01/20/25", totalPages: 5, filingFee: "$930" },

  // ── Study ──
  { code: "I-20", name: "Student Visa (F-1)", description: "Certificate of eligibility for student status", category: "study", aiRecommended: false, estimatedTime: "1-3 mo", popular: false, totalPages: 3, filingFee: "$0" },

  // ── Investment ──
  { code: "I-526", name: "Immigrant Petition by Standalone Investor", description: "EB-5 petition for direct investment", category: "investment", aiRecommended: false, estimatedTime: "24-52 mo", popular: false, editionDate: "01/20/25", totalPages: 11, filingFee: "$3,675" },
  { code: "I-526E", name: "Immigrant Petition by Regional Center Investor", description: "EB-5 petition through a USCIS-designated regional center", category: "investment", aiRecommended: false, estimatedTime: "24-52 mo", popular: false, editionDate: "01/20/25", totalPages: 11, filingFee: "$3,675" },
  { code: "I-829", name: "Remove Conditions on Investor Status", description: "Petition to remove conditions on EB-5 permanent residence", category: "investment", aiRecommended: false, estimatedTime: "12-36 mo", popular: false, editionDate: "01/20/25", totalPages: 8, filingFee: "$3,750" },

  // ── Adoption ──
  { code: "I-800A", name: "Suitability to Adopt (Convention Country)", description: "Application to adopt a child from a Hague Convention country", category: "adoption", aiRecommended: false, estimatedTime: "2-6 mo", popular: false, editionDate: "01/20/25", totalPages: 10, filingFee: "$775" },
  { code: "I-800", name: "Classify Convention Adoptee as Immediate Relative", description: "Petition for a child adopted from a Hague Convention country", category: "adoption", aiRecommended: false, estimatedTime: "2-6 mo", popular: false, editionDate: "01/20/25", totalPages: 6, filingFee: "$775" },

  // ── Waivers & Support Forms ──
  { code: "I-912", name: "Request for Fee Waiver", description: "Request a fee waiver for USCIS forms based on financial hardship", category: "support", aiRecommended: true, estimatedTime: "N/A", popular: true, editionDate: "07/22/25", totalPages: 10, filingFee: "$0" },
  { code: "I-601", name: "Waiver of Grounds of Inadmissibility", description: "Waive certain grounds of inadmissibility", category: "support", aiRecommended: false, estimatedTime: "6-18 mo", popular: false, editionDate: "01/20/25", totalPages: 7, filingFee: "$930" },
  { code: "I-601A", name: "Provisional Unlawful Presence Waiver", description: "Waiver for certain immediate relatives of U.S. citizens", category: "support", aiRecommended: false, estimatedTime: "6-24 mo", popular: false, editionDate: "01/20/25", totalPages: 7, filingFee: "$630" },
  { code: "G-1055", name: "Fee Schedule", description: "Current USCIS fee schedule for all applications and petitions", category: "support", aiRecommended: false, estimatedTime: "N/A", popular: false, editionDate: "03/01/26", totalPages: 6, filingFee: "$0" },
  { code: "G-1450", name: "Authorization for Credit Card Transactions", description: "Authorize USCIS to charge filing fees to a credit card", category: "support", aiRecommended: false, estimatedTime: "N/A", popular: false, editionDate: "02/06/26", totalPages: 1, filingFee: "$0" },
  { code: "G-1650", name: "Authorization for ACH Transactions", description: "Authorize payment via Automated Clearing House", category: "support", aiRecommended: false, estimatedTime: "N/A", popular: false, editionDate: "06/03/25", totalPages: 1, filingFee: "$0" },
  { code: "G-1651", name: "Exemption for Paper Fee Payment", description: "Request exemption from electronic fee payment requirement", category: "support", aiRecommended: false, estimatedTime: "N/A", popular: false, editionDate: "06/03/25", totalPages: 1, filingFee: "$0" },

  // ── Other Government / Verification ──
  { code: "G-845", name: "Verification Request", description: "Used by government agencies to verify immigration status", category: "other", aiRecommended: false, estimatedTime: "N/A", popular: false, editionDate: "08/12/25", totalPages: 2, filingFee: "$0" },
  { code: "G-845 Supplement", name: "Verification Request Supplement", description: "Supplement to immigration status verification request", category: "other", aiRecommended: false, estimatedTime: "N/A", popular: false, editionDate: "08/12/25", totalPages: 2, filingFee: "$0" },
  { code: "EOIR-29", name: "Notice of Appeal to the BIA", description: "Appeal a DHS officer decision to the Board of Immigration Appeals", category: "other", aiRecommended: false, estimatedTime: "6-24 mo", popular: false, editionDate: "07/01/25", totalPages: 3, filingFee: "$110" },
];

const categories: { value: FormCategory; label: string }[] = [
  { value: "all", label: "All Forms" },
  { value: "family", label: "Family" },
  { value: "work", label: "Work" },
  { value: "humanitarian", label: "Humanitarian" },
  { value: "citizenship", label: "Citizenship" },
  { value: "travel", label: "Travel" },
  { value: "study", label: "Study" },
  { value: "investment", label: "Investment (EB-5)" },
  { value: "adoption", label: "Adoption" },
  { value: "support", label: "Waivers & Fees" },
  { value: "other", label: "Other" },
];

const FormSelection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { caseId: ensuredCaseId, loading: ensuringCase } = useEnsureCase();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FormCategory>("all");
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [showAiOnly, setShowAiOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingForms, setExistingForms] = useState<string[]>([]);
  const [loadingCase, setLoadingCase] = useState(true);

  // Fetch user's case and existing form instances
  useEffect(() => {
    const fetchCase = async () => {
      if (!user || ensuringCase) return;

      if (!ensuredCaseId) {
        setExistingForms([]);
        setLoadingCase(false);
        return;
      }

      try {
        const { data: instances, error } = await supabase
          .from("form_instances")
          .select("form_type")
          .eq("case_id", ensuredCaseId);

        if (error) throw error;

        if (instances) {
          setExistingForms(instances.map((fi) => fi.form_type));
        }
      } catch (err) {
        console.error("Error fetching case:", err);
      } finally {
        setLoadingCase(false);
      }
    };
    fetchCase();
  }, [user, ensuredCaseId, ensuringCase]);

  const filtered = useMemo(() => {
    return immigrationForms.filter((form) => {
      const matchesSearch =
        !search ||
        form.code.toLowerCase().includes(search.toLowerCase()) ||
        form.name.toLowerCase().includes(search.toLowerCase()) ||
        form.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || form.category === activeCategory;
      const matchesAi = !showAiOnly || form.aiRecommended;
      return matchesSearch && matchesCategory && matchesAi;
    });
  }, [search, activeCategory, showAiOnly]);

  const aiRecommended = immigrationForms.filter((f) => f.aiRecommended);

  const toggleForm = (code: string) => {
    if (existingForms.includes(code)) return;
    setSelectedForms((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Auto-create a case if the user doesn't have one
  const ensureCase = async (): Promise<string> => {
    if (ensuredCaseId) return ensuredCaseId;
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("initialize_client_case", {
      _user_id: user.id,
    });

    if (error) throw error;

    const initializedCaseId = (data as { case_id?: string } | null)?.case_id;
    if (!initializedCaseId) throw new Error("Failed to create your case file.");

    return initializedCaseId;
  };

  const handleStartForms = async () => {
    if (selectedForms.length === 0) {
      toast({ title: "No forms selected", description: "Please select at least one form to begin." });
      return;
    }

    setSubmitting(true);
    try {
      const activeCaseId = await ensureCase();

      const rows = selectedForms.map((code) => {
        const formDef = immigrationForms.find((f) => f.code === code);
        return {
          case_id: activeCaseId,
          form_type: code,
          form_name: formDef?.name || code,
          status: "not_started" as const,
          progress: 0,
        };
      });

      const { data: createdForms, error } = await supabase
        .from("form_instances")
        .insert(rows)
        .select("id, form_type");
      if (error) throw error;

      const orderedCreatedForms = selectedForms
        .map((code) => createdForms?.find((instance) => instance.form_type === code))
        .filter((instance): instance is { id: string; form_type: string } => Boolean(instance));

      const firstCreatedForm = orderedCreatedForms[0];

      toast({
        title: `${selectedForms.length} form(s) started`,
        description: firstCreatedForm
          ? `${firstCreatedForm.form_type} opened first. The rest were saved in the order you selected them.`
          : `${selectedForms.join(", ")} added to your case.`,
      });

      setExistingForms((prev) => [...prev, ...selectedForms]);
      setSelectedForms([]);

      if (firstCreatedForm?.id) {
        navigate(`/portal/forms/${firstCreatedForm.id}`);
      }
    } catch (err: any) {
      console.error("Error creating form instances:", err);
      toast({ title: "Error", description: err.message || "Failed to create form instances.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCase) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-sm text-muted-foreground">Loading your case...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-2 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/portal" className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Start a Form</h1>
          <p className="text-xs text-muted-foreground">Browse, search, and begin any immigration form</p>
        </div>
      </div>

      {/* Info: case will be auto-created */}
      {!ensuredCaseId && (
        <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">A case file will be created automatically when you start your first form.</p>
        </div>
      )}

      {/* Existing forms count */}
      {existingForms.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">{existingForms.length} form(s) already started on your case</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search forms (e.g. I-130, asylum, work permit)"
          className="pl-10 h-11"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* AI Recommendations Section */}
      {!search && activeCategory === "all" && !showAiOnly && (
        <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-2xl border border-secondary/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            <h2 className="font-display font-bold text-sm text-foreground">AI Recommended for You</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on your pathway analysis, these forms are most likely needed for your case.
          </p>
          <div className="space-y-2">
            {aiRecommended.map((form) => {
              const isSelected = selectedForms.includes(form.code);
              return (
                <button
                  key={form.code}
                  onClick={() => toggleForm(form.code)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl p-3 transition-colors text-left",
                    isSelected ? "bg-secondary/15 border border-secondary/30" : "bg-card/80 border border-border/50 hover:bg-card"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-black",
                    isSelected ? "bg-secondary text-secondary-foreground" : "bg-secondary/10 text-secondary"
                  )}>
                    {form.code.replace("I-", "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{form.code}</p>
                    <p className="text-xs text-muted-foreground truncate">{form.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className="bg-secondary/10 text-secondary border-0 text-[9px]">AI Pick</Badge>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                    ) : (
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All Forms List */}
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-display font-bold text-foreground">
            {search ? `Results (${filtered.length})` : activeCategory === "all" ? "All Forms" : categories.find(c => c.value === activeCategory)?.label}
          </h2>
          <button
            onClick={() => setShowAiOnly(!showAiOnly)}
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors",
              showAiOnly ? "bg-secondary/10 text-secondary" : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Sparkles className="w-3 h-3" />
            AI Only
          </button>
        </div>

        <div className="divide-y divide-border/50">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No forms match your search.</p>
            </div>
          ) : (
            filtered.map((form) => {
              const isSelected = selectedForms.includes(form.code);
              const alreadyStarted = existingForms.includes(form.code);
              return (
                <button
                  key={form.code}
                  onClick={() => toggleForm(form.code)}
                  disabled={alreadyStarted}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                    alreadyStarted ? "opacity-60 cursor-default" : isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black",
                    alreadyStarted ? "bg-muted text-muted-foreground" : isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground">{form.code}</span>
                      {alreadyStarted && (
                        <Badge className="bg-primary/10 text-primary border-0 text-[9px] px-1.5 py-0">Started</Badge>
                      )}
                      {form.aiRecommended && !alreadyStarted && (
                        <Badge className="bg-secondary/10 text-secondary border-0 text-[9px] px-1.5 py-0">AI Pick</Badge>
                      )}
                      {form.popular && !alreadyStarted && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-muted-foreground/20">
                          <Star className="w-2.5 h-2.5 mr-0.5" />Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{form.name}</p>
                    <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{form.description}</p>
                    {TEMPLATE_REGISTRY[form.code] && (
                      <Badge
                        className="mt-1 text-[9px] bg-secondary/10 text-secondary border-0 cursor-pointer hover:bg-secondary/20"
                        onClick={(e) => { e.stopPropagation(); navigate(`/portal/export/${form.code}`); }}
                      >
                        <FileDown className="w-2.5 h-2.5 mr-0.5" /> Export from Template
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {form.filingFee && form.filingFee !== "$0" && (
                      <span className="text-[10px] font-semibold text-foreground">{form.filingFee}</span>
                    )}
                    {form.filingFee === "$0" && (
                      <span className="text-[10px] font-semibold text-primary">No Fee</span>
                    )}
                    {form.totalPages && (
                      <span className="text-[10px] text-muted-foreground">{form.totalPages} pg</span>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {form.estimatedTime}
                    </span>
                    {alreadyStarted ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <div className="w-5 h-5 rounded border-2 border-muted-foreground/30" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected forms summary + Start button */}
      {selectedForms.length > 0 && (
        <div className="sticky bottom-20 z-20">
          <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">{selectedForms.length} form(s) selected</p>
              <button
                onClick={() => setSelectedForms([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedForms.map((code) => (
                <Badge key={code} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => toggleForm(code)}>
                  {code} ×
                </Badge>
              ))}
            </div>
            <Button
              onClick={handleStartForms}
              disabled={submitting}
              className="w-full h-12 text-base font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-md shadow-secondary/20"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Start Selected Forms
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
};

export default FormSelection;
