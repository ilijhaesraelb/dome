import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StatusBadge, DomeCard, QuestionCard, StickyActionBar,
  EmptyState, FileUploadZone, ReadinessPanel, PricingCard,
  DomeAlert, StepProgressBar, StepSidebar, type StepDef,
} from "@/components/dome-ui";
import { FileText, Calculator, Users, Building2, Heart, Shield, Upload, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STATUSES = [
  "draft","in-progress","missing","needs-review","ready","ready-payment",
  "paid","verified","exported","finalized","locked","error","warning","pending","info",
] as const;

const SAMPLE_STEPS: StepDef[] = [
  { label: "Profile", status: "completed" },
  { label: "Upload", status: "completed" },
  { label: "Analysis", status: "current" },
  { label: "Confirm Filing", status: "upcoming" },
  { label: "Preparation", status: "upcoming" },
  { label: "Review", status: "upcoming" },
];

export default function StyleGuide() {
  const [tab, setTab] = useState("tokens");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold font-display text-foreground">D.O.M.E. Design System</h1>
        <p className="text-sm text-muted-foreground mt-1">Component library & style guide — internal reference</p>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="states">States</TabsTrigger>
          </TabsList>

          {/* ════ TOKENS ════ */}
          <TabsContent value="tokens" className="space-y-8">
            <Section title="Color Palette">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {([
                  ["Primary","bg-primary","text-primary-foreground"],
                  ["Secondary","bg-secondary","text-secondary-foreground"],
                  ["Destructive","bg-destructive","text-destructive-foreground"],
                  ["Success","bg-success","text-success-foreground"],
                  ["Warning","bg-warning","text-warning-foreground"],
                  ["Info","bg-info","text-info-foreground"],
                  ["Muted","bg-muted","text-muted-foreground"],
                  ["Accent","bg-accent","text-accent-foreground"],
                  ["Card","bg-card","text-card-foreground"],
                  ["Background","bg-background","text-foreground"],
                  ["Gold","bg-gold","text-primary-foreground"],
                  ["Border","bg-border","text-foreground"],
                ] as [string,string,string][]).map(([name,bg,fg]) => (
                  <div key={name} className="space-y-1">
                    <div className={`${bg} ${fg} rounded-md h-16 flex items-center justify-center text-xs font-medium border`}>
                      {name}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{name}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Typography">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold font-display">H1 — Page Title (Outfit 700)</h1>
                <h2 className="text-2xl font-semibold font-display">H2 — Section Title (Outfit 600)</h2>
                <h3 className="text-xl font-semibold font-display">H3 — Card Title (Outfit 600)</h3>
                <h4 className="text-lg font-medium font-display">H4 — Subsection (Outfit 500)</h4>
                <p className="text-base">Body text — Inter 400, readable and clean</p>
                <p className="text-sm text-muted-foreground">Secondary text — Inter 400, muted</p>
                <p className="text-xs text-muted-foreground">Caption / helper text — Inter 400, small</p>
              </div>
            </Section>

            <Section title="Spacing Scale">
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,8,10,12,16,20].map(n => (
                  <div key={n} className="text-center">
                    <div className="bg-primary/20 border border-primary/30 rounded" style={{width:`${n*4}px`,height:`${n*4}px`}} />
                    <p className="text-xs text-muted-foreground mt-1">{n}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Border Radius">
              <div className="flex gap-4">
                {(["sm","md","lg","full"] as const).map(r => (
                  <div key={r} className="text-center">
                    <div className={`bg-primary/20 border border-primary/30 h-16 w-16 rounded-${r}`} />
                    <p className="text-xs text-muted-foreground mt-1">rounded-{r}</p>
                  </div>
                ))}
              </div>
            </Section>
          </TabsContent>

          {/* ════ BUTTONS ════ */}
          <TabsContent value="buttons" className="space-y-8">
            <Section title="Button Variants">
              <div className="flex flex-wrap gap-3">
                <Button>Primary CTA</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </Section>
            <Section title="Button Sizes">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><FileText className="h-4 w-4" /></Button>
              </div>
            </Section>
            <Section title="Button States">
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button disabled>Disabled</Button>
                <Button disabled><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading</Button>
              </div>
            </Section>
            <Section title="Button Labels (Best Practice)">
              <div className="flex flex-wrap gap-2">
                {["Start Tax Preparation","Continue to Review","Save Draft","Preview Official Form",
                  "Pay & Continue","Fix Blockers","Upload Documents","Request Review","Finalize & Lock"
                ].map(l => <Button key={l} size="sm" variant="outline">{l}</Button>)}
              </div>
            </Section>
          </TabsContent>

          {/* ════ CARDS ════ */}
          <TabsContent value="cards" className="space-y-8">
            <Section title="Action Cards">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DomeCard variant="action" icon={Calculator} title="File Taxes On My Own" description="Self-prepare your return with AI guidance" onClick={() => {}} />
                <DomeCard variant="action" icon={Upload} title="Upload Documents First" description="Start by uploading W-2s, 1099s, prior returns" onClick={() => {}} />
                <DomeCard variant="action" icon={Building2} title="Start Nonprofit Filing" description="990-N, 990-EZ, 8868 extension" onClick={() => {}} />
              </div>
            </Section>
            <Section title="Metric Cards">
              <div className="grid sm:grid-cols-3 gap-4">
                <DomeCard variant="metric" icon={Users} title="Active Clients" metric={142} metricLabel="Total this quarter" />
                <DomeCard variant="metric" icon={FileText} title="Documents" metric={38} metricLabel="Uploaded this week" />
                <DomeCard variant="metric" icon={Shield} title="Readiness" metric="87%" metricLabel="Average score" />
              </div>
            </Section>
            <Section title="Warning Card">
              <DomeCard variant="warning" icon={Shield} title="Missing EIN" description="An EIN is required before we can continue with nonprofit filing." />
            </Section>
          </TabsContent>

          {/* ════ INPUTS ════ */}
          <TabsContent value="inputs" className="space-y-8">
            <Section title="Question Card (Guided Field)">
              <div className="max-w-lg space-y-4">
                <QuestionCard label="Legal First Name" explanation="As shown on your tax return or government ID" example="Maria" required onHelp={() => {}} onVoice={() => {}}>
                  <Input placeholder="Enter your legal first name" />
                </QuestionCard>
                <QuestionCard label="Employer Identification Number" explanation="Your organization's EIN from the IRS" example="12-3456789" required error="EIN format must be XX-XXXXXXX">
                  <Input placeholder="XX-XXXXXXX" />
                </QuestionCard>
                <QuestionCard label="Email Address" verified>
                  <Input value="maria@example.com" readOnly />
                </QuestionCard>
              </div>
            </Section>
            <Section title="File Upload Zone">
              <div className="max-w-lg">
                <FileUploadZone
                  hint="Supports PDF, JPG, PNG, XLSX, CSV up to 25MB"
                  files={[
                    { id: "1", name: "w2-2025.pdf", type: "W-2", status: "done" },
                    { id: "2", name: "1099-misc.pdf", type: "1099", status: "uploading" },
                    { id: "3", name: "receipts.xlsx", status: "error" },
                  ]}
                />
              </div>
            </Section>
          </TabsContent>

          {/* ════ BADGES ════ */}
          <TabsContent value="badges" className="space-y-8">
            <Section title="Status Badges">
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => <StatusBadge key={s} status={s} label={s.replace(/-/g," ")} />)}
              </div>
            </Section>
          </TabsContent>

          {/* ════ ALERTS ════ */}
          <TabsContent value="alerts" className="space-y-8">
            <Section title="Alert Variants">
              <div className="space-y-3 max-w-xl">
                <DomeAlert severity="success" title="Document uploaded" message="W-2 for 2025 has been successfully uploaded and classified." onDismiss={() => {}} />
                <DomeAlert severity="info" title="IRS integration not yet active" message="Connect your IRIS credentials in settings when ready." />
                <DomeAlert severity="warning" title="Missing required document" message="A prior year 1040 is needed for carryforward analysis." action={<Button size="sm" variant="outline">Upload Now</Button>} />
                <DomeAlert severity="error" title="Save failed" message="Network error. Please try again." action={<Button size="sm" variant="destructive">Retry</Button>} />
                <DomeAlert severity="blocked" title="Export blocked" message="3 critical blockers must be resolved before exporting." />
                <DomeAlert severity="compliance" title="Compliance notice" message="This filing requires officer signatures before submission." />
              </div>
            </Section>
          </TabsContent>

          {/* ════ PATTERNS ════ */}
          <TabsContent value="patterns" className="space-y-8">
            <Section title="Step Navigation — Horizontal">
              <div className="max-w-lg">
                <StepProgressBar steps={SAMPLE_STEPS} />
              </div>
            </Section>
            <Section title="Step Navigation — Vertical Sidebar">
              <div className="max-w-xs border rounded-lg p-3 bg-card">
                <StepSidebar steps={SAMPLE_STEPS} onSelect={() => {}} />
              </div>
            </Section>
            <Section title="Readiness Panel">
              <div className="max-w-sm">
                <ReadinessPanel score={62} blockers={2} warnings={4} missingDocs={1} onFixBlockers={() => {}} onReviewWarnings={() => {}} onAskAI={() => {}} />
              </div>
            </Section>
            <Section title="Pricing Cards">
              <div className="grid sm:grid-cols-3 gap-4">
                <PricingCard title="Self-Prep Export" price="$3" features={["PDF export","AI review","Document attach"]} onSelect={() => {}} />
                <PricingCard title="Professional Review" price="$149" features={["CPA review","Error check","Priority support","Audit notes"]} highlighted onSelect={() => {}} />
                <PricingCard title="Full Service" price="$299" features={["Complete preparation","Filing support","Year-round access","Dedicated CPA"]} onSelect={() => {}} />
              </div>
            </Section>
            <Section title="Sticky Action Bar">
              <div className="border rounded-lg overflow-hidden">
                <StickyActionBar
                  onBack={() => {}} onSave={() => {}} onNext={() => {}}
                  nextLabel="Continue to Review"
                />
              </div>
            </Section>
          </TabsContent>

          {/* ════ STATES ════ */}
          <TabsContent value="states" className="space-y-8">
            <Section title="Empty State">
              <EmptyState icon={FileText} title="No documents uploaded yet" description="Upload your W-2s, 1099s, or prior tax returns to get started." actionLabel="Upload Documents" onAction={() => {}} />
            </Section>
            <Section title="Loading / Skeleton">
              <div className="max-w-md space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-3 pt-2">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            </Section>
            <Section title="Error State">
              <div className="max-w-md">
                <DomeAlert severity="error" title="Failed to load tax file" message="An unexpected error occurred. Please try again or contact support." action={<Button size="sm" variant="destructive">Retry</Button>} />
              </div>
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold font-display text-foreground mb-4 border-b pb-2">{title}</h2>
      {children}
    </div>
  );
}
