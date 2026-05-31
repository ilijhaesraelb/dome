/**
 * 990-EZ Guided Filing Workspace — Complete data collection, readiness,
 * review, and payment flow. NOW WITH SUPABASE PERSISTENCE.
 */
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useProductPrice } from "@/hooks/useProductPricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Eye, Save, Shield,
  Loader2, DollarSign, Lock, AlertTriangle,
} from "lucide-react";
import TaxGuidedField from "@/components/tax-help/TaxGuidedField";
import TaxHelpModeToggle from "@/components/tax-help/TaxHelpModeToggle";
import TaxSectionHelpPanel from "@/components/tax-help/TaxSectionHelpPanel";
import TaxWorkspaceWithAI from "@/components/tax-help/TaxWorkspaceWithAI";
import { TAX_SECTION_HELP } from "@/data/taxFieldHelp";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";
import { useIsMobile } from "@/hooks/use-mobile";
import ExportPaymentGate from "@/components/form-engine/ExportPaymentGate";
import { useToast } from "@/hooks/use-toast";
import { useTaxFilingPersistence } from "@/hooks/useTaxFilingPersistence";
import type { FormSection } from "@/data/formSections";

// ══════════════════════════════════════════════
// 990-EZ SECTION DEFINITIONS
// ══════════════════════════════════════════════
const SECTIONS: FormSection[] = [
  {
    id: "org_identity",
    title: "Organization Identity",
    purpose: "Legal name, EIN, address, and basic information.",
    fields: [
      { key: "org_legal_name", label: "Legal Name of Organization", placeholder: "Full legal name", required: true, help: { what: "As shown on your IRS determination letter." } },
      { key: "ein", label: "Employer Identification Number (EIN)", placeholder: "XX-XXXXXXX", required: true, help: { what: "Your 9-digit IRS-issued EIN.", example: "12-3456789" } },
      { key: "org_dba", label: "Doing Business As (DBA)", placeholder: "If different from legal name", help: { what: "Any other name used publicly." } },
      { key: "org_address", label: "Mailing Address", placeholder: "123 Main St", required: true, help: { what: "Principal mailing address." } },
      { key: "org_city", label: "City", placeholder: "e.g. Washington", required: true, help: { what: "City." } },
      { key: "org_state", label: "State", placeholder: "e.g. DC", required: true, help: { what: "Two-letter state abbreviation." } },
      { key: "org_zip", label: "ZIP Code", placeholder: "e.g. 20001", required: true, help: { what: "5-digit ZIP code." } },
      { key: "org_phone", label: "Phone Number", placeholder: "(XXX) XXX-XXXX", help: { what: "Main organization phone number." } },
      { key: "org_website", label: "Website", placeholder: "https://...", help: { what: "Organization website if any." } },
    ],
  },
  {
    id: "filing_details",
    title: "Filing Year & Details",
    purpose: "Tax period and return type information.",
    fields: [
      { key: "tax_year_start", label: "Tax Year Beginning", placeholder: "MM/DD/YYYY", type: "date", required: true, help: { what: "First day of your fiscal year.", example: "01/01/2025" } },
      { key: "tax_year_end", label: "Tax Year Ending", placeholder: "MM/DD/YYYY", type: "date", required: true, help: { what: "Last day of your fiscal year.", example: "12/31/2025" } },
      { key: "amended_return", label: "Is this an amended return?", placeholder: "Select", type: "select", options: ["No", "Yes"], help: { what: "Select Yes only if correcting a previously filed return." } },
      { key: "group_return", label: "Is this a group return?", placeholder: "Select", type: "select", options: ["No", "Yes"], help: { what: "Group returns are filed by a central organization on behalf of subordinates." } },
      { key: "org_formation_year", label: "Year of Formation", placeholder: "e.g. 2015", help: { what: "The year the organization was legally formed." } },
      { key: "org_state_of_domicile", label: "State of Legal Domicile", placeholder: "e.g. NY", help: { what: "State where the organization is legally domiciled." } },
    ],
  },
  {
    id: "revenue",
    title: "Revenue",
    purpose: "All sources of income for the organization.",
    fields: [
      { key: "contributions_gifts", label: "Contributions, Gifts, and Grants", placeholder: "$0.00", required: true, help: { what: "Total contributions, gifts, and grants received.", example: "Individual donations, foundation grants, government grants." } },
      { key: "program_service_revenue", label: "Program Service Revenue", placeholder: "$0.00", help: { what: "Revenue from activities related to your exempt purpose.", example: "Tuition, admission fees, service fees." } },
      { key: "membership_dues", label: "Membership Dues and Assessments", placeholder: "$0.00", help: { what: "Dues collected from members." } },
      { key: "investment_income", label: "Investment Income", placeholder: "$0.00", help: { what: "Interest, dividends, and other investment income." } },
      { key: "special_event_revenue", label: "Gross Revenue from Special Events", placeholder: "$0.00", help: { what: "Revenue from fundraising events, galas, auctions.", example: "Ticket sales, auction proceeds, sponsorships." } },
      { key: "special_event_expenses", label: "Direct Expenses for Special Events", placeholder: "$0.00", help: { what: "Costs directly related to fundraising events.", example: "Venue rental, catering, entertainment." } },
      { key: "other_revenue", label: "Other Revenue", placeholder: "$0.00", help: { what: "Any revenue not listed above.", example: "Rental income, royalties, sales of assets." } },
      { key: "total_revenue", label: "Total Revenue", placeholder: "$0.00", required: true, help: { what: "Sum of all revenue sources. Should match your financial statements." } },
    ],
  },
  {
    id: "expenses",
    title: "Expenses",
    purpose: "Functional expense breakdown.",
    fields: [
      { key: "grants_paid", label: "Grants and Similar Amounts Paid", placeholder: "$0.00", help: { what: "Total grants and assistance given to individuals or organizations." } },
      { key: "salaries_compensation", label: "Salaries and Compensation", placeholder: "$0.00", help: { what: "Total wages, salaries, and compensation paid to all employees." } },
      { key: "employee_benefits", label: "Employee Benefits and Payroll Taxes", placeholder: "$0.00", help: { what: "Health insurance, retirement contributions, payroll taxes." } },
      { key: "professional_fees", label: "Professional Fees and Payments", placeholder: "$0.00", help: { what: "Fees paid to accountants, lawyers, consultants, fundraisers." } },
      { key: "occupancy_expenses", label: "Occupancy, Rent, and Utilities", placeholder: "$0.00", help: { what: "Costs of office space, rent, utilities." } },
      { key: "travel_expenses", label: "Travel and Conference Expenses", placeholder: "$0.00", help: { what: "Transportation, lodging, and conference fees." } },
      { key: "printing_publications", label: "Printing, Publications, and Postage", placeholder: "$0.00", help: { what: "Newsletters, mailings, printing costs." } },
      { key: "other_expenses", label: "All Other Expenses", placeholder: "$0.00", help: { what: "Any expenses not listed above." } },
      { key: "total_expenses", label: "Total Expenses", placeholder: "$0.00", required: true, help: { what: "Total of all expenses." } },
    ],
  },
  {
    id: "balance",
    title: "Assets & Balance",
    purpose: "Cash, assets, liabilities, and net assets.",
    fields: [
      { key: "cash_begin", label: "Cash and Equivalents — Beginning of Year", placeholder: "$0.00", required: true, help: { what: "Cash and bank balances at the start of the tax year." } },
      { key: "cash_end", label: "Cash and Equivalents — End of Year", placeholder: "$0.00", required: true, help: { what: "Cash and bank balances at year-end." } },
      { key: "other_assets_begin", label: "Other Assets — Beginning of Year", placeholder: "$0.00", help: { what: "Investments, property, equipment, receivables." } },
      { key: "other_assets_end", label: "Other Assets — End of Year", placeholder: "$0.00", help: { what: "Total other assets at year-end." } },
      { key: "total_assets_end", label: "Total Assets — End of Year", placeholder: "$0.00", required: true, help: { what: "Cash + other assets at year-end." } },
      { key: "total_liabilities_begin", label: "Total Liabilities — Beginning of Year", placeholder: "$0.00", help: { what: "Outstanding debts and obligations at start of year." } },
      { key: "total_liabilities_end", label: "Total Liabilities — End of Year", placeholder: "$0.00", help: { what: "Outstanding debts and obligations at year-end." } },
      { key: "net_assets_begin", label: "Net Assets — Beginning of Year", placeholder: "$0.00", help: { what: "Total assets minus total liabilities at start of year." } },
      { key: "net_assets_end", label: "Net Assets — End of Year", placeholder: "$0.00", required: true, help: { what: "Total assets minus total liabilities at year-end." } },
    ],
  },
  {
    id: "officers",
    title: "Officers & Directors",
    purpose: "Board members, officers, and key employees.",
    fields: [
      { key: "principal_officer_name", label: "Principal Officer Name", placeholder: "Full name", required: true, help: { what: "President, CEO, or Executive Director." } },
      { key: "principal_officer_title", label: "Principal Officer Title", placeholder: "e.g. Executive Director", required: true, help: { what: "The title of the principal officer." } },
      { key: "principal_officer_address", label: "Principal Officer Address", placeholder: "Full address", help: { what: "Mailing address of the principal officer." } },
      { key: "principal_officer_hours", label: "Average Hours per Week", placeholder: "e.g. 40", help: { what: "Hours per week devoted to the organization." } },
      { key: "principal_officer_compensation", label: "Compensation (if any)", placeholder: "$0.00", help: { what: "Total reportable compensation paid." } },
      { key: "num_voting_members", label: "Number of Voting Board Members", placeholder: "e.g. 7", required: true, help: { what: "Total individuals with voting rights on the governing board." } },
      { key: "num_independent_members", label: "Number of Independent Board Members", placeholder: "e.g. 5", help: { what: "Board members with no compensation or family/business relationship." } },
      { key: "officer_2_name", label: "Additional Officer / Director (optional)", placeholder: "Full name", help: { what: "Add another officer or board member." } },
      { key: "officer_2_title", label: "Title", placeholder: "e.g. Treasurer", help: { what: "Title of additional officer." } },
      { key: "officer_2_compensation", label: "Compensation (if any)", placeholder: "$0.00", help: { what: "Compensation paid to this person." } },
    ],
  },
  {
    id: "programs",
    title: "Program Activities",
    purpose: "Describe your organization's mission and program accomplishments.",
    fields: [
      { key: "mission_statement", label: "Mission Statement", placeholder: "Describe your organization's mission...", required: true, help: { what: "A brief statement of your organization's mission or most significant activities." } },
      { key: "program_1_description", label: "Primary Program Service", placeholder: "Describe your largest program...", required: true, help: { what: "Describe the organization's largest program service accomplishment.", example: "Provided free legal aid to 500 immigrant families…" } },
      { key: "program_1_expenses", label: "Primary Program Expenses", placeholder: "$0.00", help: { what: "Total expenses allocated to this program." } },
      { key: "program_1_grants", label: "Grants Included in Program Expenses", placeholder: "$0.00", help: { what: "Grants paid as part of this program." } },
      { key: "program_1_revenue", label: "Revenue from This Program", placeholder: "$0.00", help: { what: "Revenue generated by this program." } },
      { key: "program_2_description", label: "Second Program (optional)", placeholder: "Describe another program...", help: { what: "Describe a second program if applicable." } },
      { key: "program_2_expenses", label: "Program 2 Expenses", placeholder: "$0.00", help: { what: "Expenses for second program." } },
      { key: "program_3_description", label: "Third Program (optional)", placeholder: "Describe another program...", help: { what: "Describe a third program if applicable." } },
    ],
  },
  {
    id: "additional_questions",
    title: "Additional Questions",
    purpose: "Required governance and compliance questions.",
    fields: [
      { key: "has_conflict_policy", label: "Does the organization have a written conflict of interest policy?", placeholder: "Select", type: "select", options: ["Yes", "No"], help: { what: "Ensures board decisions are made in the organization's best interest." } },
      { key: "has_whistleblower_policy", label: "Does the organization have a whistleblower policy?", placeholder: "Select", type: "select", options: ["Yes", "No"], help: { what: "Protects employees who report misconduct." } },
      { key: "has_document_retention", label: "Does the organization have a document retention policy?", placeholder: "Select", type: "select", options: ["Yes", "No"], help: { what: "Governs how long different types of records are kept." } },
      { key: "conducts_lobbying", label: "Did the organization engage in lobbying?", placeholder: "Select", type: "select", options: ["Yes", "No"], help: { what: "Attempting to influence legislation.", warning: "501(c)(3) organizations have limits on lobbying." } },
      { key: "had_significant_changes", label: "Were there significant changes to governing documents?", placeholder: "Select", type: "select", options: ["Yes", "No"], help: { what: "Changes to articles of incorporation, bylaws, or organizational structure." } },
      { key: "had_unrelated_business_income", label: "Did the organization have unrelated business income over $1,000?", placeholder: "Select", type: "select", options: ["Yes", "No"], help: { what: "Income from a trade or business not related to exempt purpose.", warning: "If yes, you may also need to file Form 990-T." } },
      { key: "is_section_501c3", label: "Is the organization a 501(c)(3)?", placeholder: "Select", type: "select", options: ["Yes", "No"], help: { what: "Most common type of tax-exempt nonprofit." } },
      { key: "received_substantial_gift", label: "Did the organization receive a substantial gift or bequest?", placeholder: "Select", type: "select", options: ["Yes", "No"], help: { what: "A large one-time gift that might affect public support calculations." } },
    ],
  },
];

// ══════════════════════════════════════════════
// WORKSPACE COMPONENT
// ══════════════════════════════════════════════

const DynamicPriceBadge = ({ productKey, fallback }: { productKey: string; fallback: string }) => {
  const { price, isLoading } = useProductPrice(productKey);
  return (
    <Badge className="bg-secondary/10 text-secondary border-0 text-lg font-bold">
      {isLoading ? fallback : `$${(price ?? 75).toFixed(0)}`}
    </Badge>
  );
};

const Filing990EZWorkspace = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill || {};

  const [step, setStep] = useState(0);
  const [view, setView] = useState<"workspace" | "readiness" | "review" | "payment" | "success">("workspace");

  // ── Supabase persistence ──
  const {
    values,
    loading: persistLoading,
    saveStatus,
    handleChange,
    manualSave,
    markCompleted,
  } = useTaxFilingPersistence({ filingType: "990-EZ", prefill });

  const section = SECTIONS[step];

  const sectionCompletion = SECTIONS.map(s => {
    const req = s.fields.filter(f => f.required);
    if (req.length === 0) return s.fields.some(f => values[f.key]?.trim()) ? 100 : 0;
    return Math.round((req.filter(f => values[f.key]?.trim()).length / req.length) * 100);
  });
  const totalProgress = Math.round(sectionCompletion.reduce((a, b) => a + b, 0) / SECTIONS.length);
  const missingRequired = SECTIONS.flatMap(s => s.fields.filter(f => f.required && !values[f.key]?.trim()));

  const handleExport = async () => {
    await markCompleted();
    toast({ title: "990-EZ filing draft exported!", description: "Your filing package has been prepared." });
    setView("success");
  };

  if (persistLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── SUCCESS ──
  if (view === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
        <h1 className="text-2xl font-display font-bold">990-EZ Filing Submitted</h1>
        <p className="text-sm text-muted-foreground">Your filing data has been prepared and exported.</p>
        <Card className="text-left">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Organization</span><span className="font-medium">{values.org_legal_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">EIN</span><span className="font-medium">{values.ein}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax Year</span><span className="font-medium">{values.tax_year_start} – {values.tax_year_end}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Filing Type</span><Badge className="bg-success/10 text-success border-0">990-EZ</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-secondary/10 text-secondary border-0">Completed</Badge></div>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => window.location.href = "/tax"}>← Back to Tax Services</Button>
        <p className="text-[10px] text-muted-foreground">D.O.M.E. provides filing preparation tools — not legal or tax advice.</p>
      </div>
    );
  }

  // ── PAYMENT ──
  if (view === "payment") {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="text-center space-y-3">
          <DollarSign className="w-12 h-12 text-secondary mx-auto" />
          <h1 className="text-2xl font-display font-bold">Complete Your 990-EZ Filing</h1>
          <p className="text-sm text-muted-foreground">Flat-fee pricing — review and submit.</p>
        </div>
        <Card className="border-2 border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">990-EZ Guided Filing</p>
                <p className="text-xs text-muted-foreground">Full guided preparation & filing support</p>
              </div>
              <DynamicPriceBadge productKey="990ez_filing" fallback="$75" />
            </div>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">What's Included:</p>
              <ul className="space-y-1.5">
                {[
                  "Guided workspace with all 990-EZ sections",
                  "Revenue, expenses, and balance sheet support",
                  "Officer and program activity sections",
                  "Filing readiness analysis",
                  "Clean filing draft export",
                  "Save and resume anytime",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <ExportPaymentGate formType="990-EZ Filing" productKey="990ez_filing" onExportAllowed={handleExport} onPreview={() => setView("review")} />
          </CardContent>
        </Card>
        <Button variant="ghost" className="w-full" onClick={() => setView("review")}>← Back to Review</Button>
        <p className="text-[10px] text-muted-foreground text-center">D.O.M.E. provides filing preparation tools — not legal or tax advice.</p>
      </div>
    );
  }

  // ── READINESS ──
  if (view === "readiness") {
    const checks = [
      { label: "Organization Identity", ok: !!values.org_legal_name?.trim() && !!values.ein?.trim() && !!values.org_address?.trim() },
      { label: "Filing Year", ok: !!values.tax_year_start?.trim() && !!values.tax_year_end?.trim() },
      { label: "Revenue", ok: !!values.contributions_gifts?.trim() && !!values.total_revenue?.trim() },
      { label: "Expenses", ok: !!values.total_expenses?.trim() },
      { label: "Assets & Balance", ok: !!values.cash_begin?.trim() && !!values.cash_end?.trim() && !!values.total_assets_end?.trim() && !!values.net_assets_end?.trim() },
      { label: "Officers & Directors", ok: !!values.principal_officer_name?.trim() && !!values.num_voting_members?.trim() },
      { label: "Program Activities", ok: !!values.mission_statement?.trim() && !!values.program_1_description?.trim() },
    ];
    const ready = checks.every(c => c.ok);

    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display font-bold">990-EZ Readiness Check</h1>
          <p className="text-sm text-muted-foreground">Make sure everything is complete before review.</p>
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            {checks.map(c => (
              <div key={c.label} className="flex items-center gap-3">
                {c.ok ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <AlertTriangle className="w-5 h-5 text-warning shrink-0" />}
                <span className={cn("text-sm", c.ok ? "" : "text-warning font-medium")}>{c.label}</span>
                <Badge className={cn("ml-auto border-0 text-[10px]", c.ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                  {c.ok ? "Complete" : "Missing"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-3">
          {ready ? (
            <Button className="flex-1 gap-2 bg-secondary hover:bg-secondary/90" onClick={() => setView("review")}>
              <Eye className="w-4 h-4" /> Continue to Review
            </Button>
          ) : (
            <Button className="flex-1 gap-2" onClick={() => { setView("workspace"); setStep(0); }}>Fix Missing Items</Button>
          )}
          <Button variant="outline" className="flex-1" onClick={() => setView("workspace")}>← Back to Workspace</Button>
        </div>
      </div>
    );
  }

  // ── REVIEW ──
  if (view === "review") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Review Your 990-EZ Filing</h1>
            <p className="text-sm text-muted-foreground">Verify all information before proceeding.</p>
          </div>
          <Badge className={totalProgress === 100 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
            {totalProgress}% Complete
          </Badge>
        </div>

        {SECTIONS.map((s, i) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {sectionCompletion[i] === 100 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  {sectionCompletion[i] < 100 && (
                    <Badge variant="outline" className="text-[10px] ml-1">{s.fields.filter(f => f.required && !values[f.key]?.trim()).length} missing</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setStep(i); setView("workspace"); }}>Edit</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {s.fields.map(f => (
                  <div key={f.key} className={!values[f.key]?.trim() && f.required ? "text-destructive" : ""}>
                    <span className="text-muted-foreground">{f.label}:</span>{" "}
                    <span className="font-medium">{values[f.key] || "—"}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              By continuing, you confirm the information is accurate to the best of your knowledge. D.O.M.E. provides guided filing preparation — not legal or tax advice.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1 gap-2 bg-secondary hover:bg-secondary/90" onClick={() => setView("payment")} disabled={missingRequired.length > 0}>
            <Lock className="w-4 h-4" /> Pay & Submit Filing
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setView("readiness")}>← Readiness Check</Button>
        </div>
      </div>
    );
  }

  // ── WORKSPACE ──
  return (
    <TaxWorkspaceWithAI filingType="990-EZ" values={values} currentSection={section?.id}>
    <div className="flex min-h-screen bg-background">
      {!isMobile && (
        <aside className="w-56 border-r bg-sidebar shrink-0 p-4 space-y-1">
          <div className="mb-2"><BackButton /></div>
          <TaxHelpModeToggle compact className="mb-3" />
          <p className="text-xs font-semibold text-muted-foreground mb-3">990-EZ SECTIONS</p>
          {SECTIONS.map((s, i) => {
            const missing = s.fields.filter(f => f.required && !values[f.key]?.trim()).length;
            return (
              <button key={s.id} onClick={() => setStep(i)} className={cn(
                "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left",
                i === step ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}>
                {sectionCompletion[i] === 100 ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  : i === step ? <div className="w-3.5 h-3.5 rounded-full bg-primary shrink-0" />
                  : <Circle className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate flex-1">{s.title}</span>
                {missing > 0 && sectionCompletion[i] < 100 && <span className="text-[10px] text-warning">{missing}</span>}
              </button>
            );
          })}
          <div className="pt-4 space-y-1">
            <button onClick={() => setView("readiness")} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted">
              <CheckCircle2 className="w-3.5 h-3.5" /> Readiness Check
            </button>
            <button onClick={() => setView("review")} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted">
              <Eye className="w-3.5 h-3.5" /> Review & Pay
            </button>
          </div>
        </aside>
      )}

      <div className="flex-1 max-w-2xl mx-auto px-4 py-8 space-y-5">
        {isMobile && <BackButton />}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Section {step + 1} of {SECTIONS.length} — {section.title}</span>
            <span className="flex items-center gap-1">
              {saveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
              {saveStatus === "saved" && <><Save className="w-3 h-3 text-success" /> Saved</>}
              {saveStatus === "error" && <><AlertTriangle className="w-3 h-3 text-destructive" /> Save failed</>}
            </span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {step === 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center space-y-1">
              <p className="text-sm font-medium">You don't need to know every tax term to begin.</p>
              <p className="text-xs text-muted-foreground">We'll guide you through each section. Save your progress and come back anytime.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b bg-muted/30">
              <h2 className="font-semibold">{section.title}</h2>
              <p className="text-xs text-muted-foreground">{section.purpose}</p>
            </div>
            <div className="divide-y">
              {section.fields.map(f => (
                <TaxGuidedField key={f.key} field={f} value={values[f.key] || ""} onChange={handleChange} />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={manualSave} className="gap-1">
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
            {isMobile && (
              <Button variant="outline" size="sm" onClick={() => setView("readiness")}>
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            {step < SECTIONS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="gap-1">Next <ArrowRight className="w-4 h-4" /></Button>
            ) : (
              <Button onClick={() => setView("readiness")} className="gap-1 bg-secondary hover:bg-secondary/90">
                Readiness Check <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-muted-foreground/40 text-[10px]">
          <Shield className="w-3 h-3" /> <span>Encrypted • Auto-saved • Resume anytime</span>
        </div>
      </div>
    </div>
    </TaxWorkspaceWithAI>
  );
};

export default Filing990EZWorkspace;
