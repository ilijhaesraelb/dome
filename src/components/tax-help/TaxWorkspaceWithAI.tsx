/**
 * TaxWorkspaceWithAI — Wrapper that adds AI assistant panel + error detection to any tax workspace.
 */
import { useState, useMemo, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaxHelpProvider } from "@/contexts/TaxHelpContext";
import TaxAIAssistantPanel from "@/components/tax-help/TaxAIAssistantPanel";
import TaxReadinessPanel from "@/components/tax-help/TaxReadinessPanel";
import { runTaxErrorDetection, getIssuesByField, type TaxIssue, type TaxErrorContext } from "@/lib/tax-error-engine";
import { Button } from "@/components/ui/button";
import { Bot, AlertTriangle } from "lucide-react";
import type { TaxAssistantContext } from "@/hooks/useTaxAssistant";

interface Props {
  children: ReactNode;
  filingType: string;
  values: Record<string, string>;
  uploadedDocs?: string[];
  extractedData?: Record<string, string>;
  priorYearData?: Record<string, string>;
  paymentStatus?: string;
  stage?: string;
  currentSection?: string;
  currentField?: string;
  userRole?: string;
}

export default function TaxWorkspaceWithAI({
  children, filingType, values, uploadedDocs = [], extractedData = {},
  priorYearData, paymentStatus, stage, currentSection, currentField, userRole,
}: Props) {
  const isMobile = useIsMobile();
  const [showAI, setShowAI] = useState(!isMobile);
  const [showReadiness, setShowReadiness] = useState(false);

  // Run error detection
  const errorCtx: TaxErrorContext = useMemo(() => ({
    filingType, values, uploadedDocs, extractedData,
    priorYearData, paymentStatus, stage,
  }), [filingType, values, uploadedDocs, extractedData, priorYearData, paymentStatus, stage]);

  const issues = useMemo(() => runTaxErrorDetection(errorCtx), [errorCtx]);

  // Readiness score
  const readinessScore = useMemo(() => {
    const totalFields = Object.keys(values).length;
    const filledFields = Object.values(values).filter(v => v?.trim()).length;
    const fieldScore = totalFields > 0 ? (filledFields / Math.max(totalFields, 5)) * 60 : 0;
    const issueDeduction = issues.filter(i => !i.resolved).length * 5;
    return Math.max(0, Math.min(100, Math.round(fieldScore + 40 - issueDeduction)));
  }, [values, issues]);

  const missingDocsCount = issues.filter(i => i.linkedSection === "documents" && !i.resolved).length;

  const assistantContext: TaxAssistantContext = {
    filingType, currentSection, currentField, userRole,
    uploadedDocs, errors: issues.filter(i => !i.resolved).slice(0, 5),
  };

  const handleAskAI = (question: string) => {
    setShowAI(true);
    // The panel will be shown — user can see the quick prompts or type
  };

  return (
    <TaxHelpProvider>
      <div className={`flex ${showAI && !isMobile ? "gap-0" : ""} min-h-screen`}>
        {/* Main content */}
        <div className={`flex-1 ${showAI && !isMobile ? "max-w-[calc(100%-360px)]" : ""}`}>
          {children}

          {/* Mobile floating buttons */}
          {isMobile && (
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
              {issues.filter(i => !i.resolved).length > 0 && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-12 w-12 rounded-full shadow-lg"
                  onClick={() => setShowReadiness(!showReadiness)}
                >
                  <AlertTriangle className="h-5 w-5" />
                </Button>
              )}
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg bg-primary"
                onClick={() => setShowAI(!showAI)}
              >
                <Bot className="h-6 w-6" />
              </Button>
            </div>
          )}

          {/* Mobile readiness sheet */}
          {isMobile && showReadiness && (
            <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setShowReadiness(false)}>
              <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-auto rounded-t-xl bg-background border-t shadow-xl p-4" onClick={e => e.stopPropagation()}>
                <TaxReadinessPanel
                  issues={issues}
                  readinessScore={readinessScore}
                  missingDocsCount={missingDocsCount}
                  onAskAI={handleAskAI}
                  showOverride={userRole === "cpa" || userRole === "accountant"}
                />
              </div>
            </div>
          )}

          {/* Mobile AI sheet */}
          {isMobile && showAI && (
            <div className="fixed inset-0 z-50 bg-background" onClick={() => setShowAI(false)}>
              <div className="h-full" onClick={e => e.stopPropagation()}>
                <TaxAIAssistantPanel
                  context={assistantContext}
                  issues={issues}
                  onClose={() => setShowAI(false)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Desktop right panel */}
        {!isMobile && showAI && (
          <div className="w-[360px] shrink-0 border-l flex flex-col h-screen sticky top-0">
            {/* Readiness at top */}
            <div className="border-b p-3 overflow-auto max-h-[40vh]">
              <TaxReadinessPanel
                issues={issues}
                readinessScore={readinessScore}
                missingDocsCount={missingDocsCount}
                onAskAI={handleAskAI}
                showOverride={userRole === "cpa" || userRole === "accountant"}
              />
            </div>
            {/* AI chat below */}
            <div className="flex-1 min-h-0">
              <TaxAIAssistantPanel
                context={assistantContext}
                issues={issues}
                onClose={() => setShowAI(false)}
              />
            </div>
          </div>
        )}

        {/* Desktop toggle if hidden */}
        {!isMobile && !showAI && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {issues.filter(i => !i.resolved).length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1 shadow-lg"
                onClick={() => { setShowAI(true); }}
              >
                <AlertTriangle className="h-4 w-4" /> {issues.filter(i => !i.resolved).length} Issues
              </Button>
            )}
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-primary"
              onClick={() => setShowAI(true)}
            >
              <Bot className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </TaxHelpProvider>
  );
}
