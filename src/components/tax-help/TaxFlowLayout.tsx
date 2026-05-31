/**
 * TaxFlowLayout — Shared layout wrapper for all tax flow screens.
 * Provides: step navigation (left), main content (center), AI panel (right), sticky bottom bar.
 */
import { useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, Save, Bot, CheckCircle2, Circle, Loader2,
  Calculator, User, Upload, Sparkles, FileText, ClipboardCheck,
  Table2, Pencil, AlertTriangle, BarChart3, Shield, DollarSign,
  Download, FolderOpen, UserCheck, Clock, X,
} from "lucide-react";

const TAX_STEPS = [
  { id: "landing", label: "Tax Services", path: "/tax", icon: Calculator, step: 0 },
  { id: "start", label: "Filing Path", path: "/tax/start", icon: FileText, step: 1 },
  { id: "profile", label: "Tax Profile", path: "/tax/profile", icon: User, step: 2 },
  { id: "upload", label: "Upload Documents", path: "/tax/documents/upload", icon: Upload, step: 3 },
  { id: "analysis", label: "AI Analysis", pathPrefix: "/tax/file/", pathSuffix: "/recommendation", icon: Sparkles, step: 4 },
  { id: "confirm", label: "Confirm Filing", pathPrefix: "/tax/file/", pathSuffix: "/confirm", icon: ClipboardCheck, step: 5 },
  { id: "extracted", label: "Review Data", pathPrefix: "/tax/file/", pathSuffix: "/extracted", icon: FileText, step: 6 },
  { id: "spreadsheet", label: "Spreadsheet Map", pathPrefix: "/tax/file/", pathSuffix: "/spreadsheet", icon: Table2, step: 7 },
  { id: "workspace", label: "Preparation", pathPrefix: "/tax/file/", pathSuffix: "/workspace", icon: Pencil, step: 8 },
  { id: "errors", label: "Error Review", pathPrefix: "/tax/file/", pathSuffix: "/errors", icon: AlertTriangle, step: 9 },
  { id: "review", label: "Final Review", pathPrefix: "/tax/file/", pathSuffix: "/review", icon: Shield, step: 10 },
  { id: "payment", label: "Payment", pathPrefix: "/tax/file/", pathSuffix: "/payment", icon: DollarSign, step: 11 },
  { id: "post-payment", label: "Complete", pathPrefix: "/tax/file/", pathSuffix: "/post-payment", icon: Download, step: 12 },
];

interface Props {
  children: ReactNode;
  currentStep: number;
  title: string;
  subtitle?: string;
  taxFileId?: string;
  onBack?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  nextLabel?: string;
  backLabel?: string;
  saveStatus?: "idle" | "saving" | "saved";
  nextDisabled?: boolean;
  showAI?: boolean;
  aiPanel?: ReactNode;
  hideStepNav?: boolean;
  hideBottomBar?: boolean;
}

export default function TaxFlowLayout({
  children, currentStep, title, subtitle, taxFileId,
  onBack, onNext, onSave, nextLabel = "Next Step", backLabel = "Back",
  saveStatus = "idle", nextDisabled = false, showAI: showAIProp,
  aiPanel, hideStepNav = false, hideBottomBar = false,
}: Props) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAI, setShowAI] = useState(false);

  const getStepPath = (step: typeof TAX_STEPS[0]) => {
    if (step.path) return step.path;
    if (step.pathPrefix && taxFileId) return `${step.pathPrefix}${taxFileId}${step.pathSuffix || ""}`;
    return "#";
  };

  const currentStepInfo = TAX_STEPS.find(s => s.step === currentStep);
  const progressPct = Math.round((currentStep / (TAX_STEPS.length - 1)) * 100);

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    navigate(-1);
  };

  const handleNext = () => {
    if (onNext) { onNext(); return; }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-between h-14 px-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm text-primary">D.O.M.E.</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">›</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Tax Services</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">›</span>
            <span className="text-xs font-medium hidden sm:inline">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Save status */}
            {saveStatus !== "idle" && (
              <Badge variant="outline" className="text-[10px] gap-1">
                {saveStatus === "saving" ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                ) : (
                  <><CheckCircle2 className="w-3 h-3 text-green-600" /> Saved</>
                )}
              </Badge>
            )}
            {/* AI toggle */}
            {!isMobile && (
              <Button size="sm" variant={showAI ? "default" : "outline"} className="gap-1 h-8" onClick={() => setShowAI(!showAI)}>
                <Bot className="w-3.5 h-3.5" /> AI Help
              </Button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <Progress value={progressPct} className="h-1 rounded-none" />
      </header>

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
        {/* LEFT STEP NAV (Desktop only) */}
        {!isMobile && !hideStepNav && (
          <nav className="w-56 shrink-0 border-r bg-card/50 overflow-y-auto py-4 hidden lg:block">
            <div className="px-3 mb-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Tax Flow</p>
            </div>
            <div className="space-y-0.5 px-2">
              {TAX_STEPS.map(step => {
                const isActive = step.step === currentStep;
                const isCompleted = step.step < currentStep;
                const isClickable = isCompleted || isActive;
                return (
                  <button
                    key={step.id}
                    onClick={() => isClickable && navigate(getStepPath(step))}
                    disabled={!isClickable}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-xs
                      ${isActive ? "bg-primary/10 text-primary font-semibold" : ""}
                      ${isCompleted ? "text-foreground hover:bg-muted/50 cursor-pointer" : ""}
                      ${!isClickable ? "text-muted-foreground/40 cursor-not-allowed" : ""}
                    `}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
                      ${isCompleted ? "bg-green-100 text-green-600" : ""}
                      ${isActive ? "bg-primary text-primary-foreground" : ""}
                      ${!isClickable && !isActive ? "bg-muted text-muted-foreground/40" : ""}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{step.step}</span>
                      )}
                    </div>
                    <span className="truncate">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* MAIN CONTENT */}
        <main className={`flex-1 min-w-0 overflow-y-auto pb-24 ${showAI && !isMobile ? "max-w-[calc(100%-340px)]" : ""}`}>
          {/* Step badge header (mobile) */}
          {isMobile && (
            <div className="px-4 pt-4 pb-2">
              <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                Step {currentStep} of {TAX_STEPS.length - 1}
              </Badge>
            </div>
          )}
          {children}
        </main>

        {/* RIGHT AI PANEL (Desktop) */}
        {!isMobile && showAI && (
          <aside className="w-[340px] shrink-0 border-l bg-card/50 overflow-y-auto">
            {aiPanel || (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <p className="font-semibold text-sm">AI Tax Assistant</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowAI(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {["Explain this step", "What's missing?", "Fix blockers", "Help me decide"].map(q => (
                    <Button key={q} variant="outline" size="sm" className="w-full justify-start text-xs gap-2">
                      <Sparkles className="w-3 h-3" /> {q}
                    </Button>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">About this step</p>
                  <p>{currentStepInfo?.label || "Complete this step to continue with your tax preparation."}</p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* MOBILE AI FLOATING BUTTON */}
      {isMobile && (
        <button
          onClick={() => setShowAI(!showAI)}
          className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}

      {/* MOBILE AI SHEET */}
      {isMobile && showAI && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowAI(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-auto rounded-t-xl bg-card border-t shadow-xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <p className="font-semibold text-sm">AI Tax Assistant</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowAI(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {aiPanel || (
              <div className="space-y-2">
                {["Explain this step", "What's missing?", "Fix blockers", "Help me decide"].map(q => (
                  <Button key={q} variant="outline" size="sm" className="w-full justify-start text-xs gap-2">
                    <Sparkles className="w-3 h-3" /> {q}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STICKY BOTTOM BAR */}
      {!hideBottomBar && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center justify-between h-14 px-4 max-w-[1600px] mx-auto gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Button>
            <div className="flex items-center gap-2">
              {onSave && (
                <Button variant="outline" size="sm" onClick={onSave} className="gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Save
                </Button>
              )}
              {onNext && (
                <Button size="sm" onClick={handleNext} disabled={nextDisabled} className="gap-1.5">
                  {nextLabel} <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
