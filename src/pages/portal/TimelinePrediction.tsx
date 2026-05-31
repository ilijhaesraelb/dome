import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Bell, AlertTriangle, Loader2, AlertCircle, Clock, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMyCase } from "@/hooks/useMyCase";
import { useCaseTimeline, useCaseFormInstances, useCaseDocuments } from "@/hooks/useCases";
import { format, differenceInDays } from "date-fns";
import { useT } from "@/hooks/useT";

/** USCIS average processing time estimates by case type (in months) */
const PROCESSING_ESTIMATES: Record<string, { label: string; minMonths: number; maxMonths: number; steps: string[] }> = {
  "Adjustment of Status": {
    label: "I-485 Adjustment of Status",
    minMonths: 8, maxMonths: 14,
    steps: ["Application Filed", "Biometrics Appointment", "Interview Scheduled", "Decision"],
  },
  "Family Petition": {
    label: "I-130 Family Petition",
    minMonths: 12, maxMonths: 24,
    steps: ["Petition Filed", "NOA-1 Received", "Case Active", "Approved"],
  },
  "Naturalization": {
    label: "N-400 Naturalization",
    minMonths: 6, maxMonths: 12,
    steps: ["Application Filed", "Biometrics", "Interview", "Oath Ceremony"],
  },
  "Work Visa": {
    label: "H-1B / Work Visa",
    minMonths: 3, maxMonths: 8,
    steps: ["Petition Filed", "RFE Check", "Approval Notice", "Visa Stamping"],
  },
  "Employment Based": {
    label: "EB Green Card",
    minMonths: 12, maxMonths: 36,
    steps: ["PERM Filed", "I-140 Petition", "Priority Date Current", "I-485 Filed", "Interview", "Decision"],
  },
};

const DEFAULT_ESTIMATE = {
  label: "Immigration Case",
  minMonths: 6, maxMonths: 18,
  steps: ["Application Filed", "Processing", "Review", "Decision"],
};

const TimelinePrediction = () => {
  const t = useT();
  const { toast } = useToast();
  const { data: myCase, isLoading: caseLoading } = useMyCase();
  const { data: timelineEvents = [], isLoading: tlLoading } = useCaseTimeline(myCase?.id);
  const { data: forms = [] } = useCaseFormInstances(myCase?.id);
  const { data: documents = [] } = useCaseDocuments(myCase?.id);

  const isLoading = caseLoading || tlLoading;

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!myCase) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-display font-bold text-foreground">{t("timeline.noCase")}</h2>
        <p className="text-sm text-muted-foreground">{t("timeline.noCaseDesc")}</p>
      </div>
    );
  }

  const estimate = PROCESSING_ESTIMATES[myCase.case_type] || DEFAULT_ESTIMATE;
  const caseCreated = new Date(myCase.created_at);
  const daysSinceFiling = differenceInDays(new Date(), caseCreated);
  const avgMonths = (estimate.minMonths + estimate.maxMonths) / 2;
  const avgDays = avgMonths * 30;
  const progressPct = Math.min(Math.round((daysSinceFiling / avgDays) * 100), 100);

  // Map real timeline events
  const milestones = timelineEvents.slice(0, 10).map((evt) => ({
    label: evt.title,
    date: format(new Date(evt.created_at), "MMM d, yyyy"),
    type: evt.event_type,
    description: evt.description,
  }));

  // Determine current step estimate
  const stepProgress = Math.min(
    Math.floor((daysSinceFiling / avgDays) * estimate.steps.length),
    estimate.steps.length - 1
  );

  // Stats
  const formsCompleted = forms.filter(f => f.status === "completed" || f.status === "submitted").length;
  const docsUploaded = documents.length;

  return (
    <div className="px-4 py-2 max-w-lg mx-auto space-y-5">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-display font-bold text-foreground">{t("timeline.title")}</h1>
        <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full" />
        <p className="text-sm text-muted-foreground">{t("timeline.subtitle")}</p>
      </div>

      {/* Case Info Card */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 space-y-3">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{myCase.case_type}</h2>
          <p className="text-sm text-muted-foreground">Case #{myCase.case_number}</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-secondary" />
          <span className="text-sm text-muted-foreground">{t("timeline.status")}</span>
          <Badge variant="outline" className="text-xs">{myCase.status.replace(/_/g, " ")}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-secondary" />
          <span>{t("timeline.filedDaysAgo", { days: daysSinceFiling })}</span>
        </div>
        {myCase.deadline && (
          <div className="border-t border-border pt-3">
            <p className="text-sm font-semibold text-foreground">{t("timeline.nextDeadline")}</p>
            <p className="text-lg font-display font-bold text-foreground">
              {format(new Date(myCase.deadline), "MMMM d, yyyy")}
            </p>
          </div>
        )}
      </div>

      {/* USCIS Processing Estimate */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 space-y-4">
        <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary" /> {t("timeline.processingEstimate")}
        </h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{estimate.label}</span>
          <span className="font-medium text-foreground">{t("timeline.months", { min: estimate.minMonths, max: estimate.maxMonths })}</span>
        </div>
        <Progress value={progressPct} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {t("timeline.elapsed", { pct: progressPct })}
        </p>
        <div className="space-y-0">
          {estimate.steps.map((step, i) => (
            <div key={step} className="flex items-start gap-3 relative">
              {i < estimate.steps.length - 1 && (
                <div className={cn(
                  "absolute left-[9px] top-5 w-0.5 h-full",
                  i < stepProgress ? "bg-green-500" : "bg-border"
                )} />
              )}
              <div className="shrink-0 mt-0.5">
                {i < stepProgress ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : i === stepProgress ? (
                  <div className="w-5 h-5 rounded-full border-2 border-secondary bg-secondary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="pb-4">
                <p className={cn(
                  "text-sm font-medium",
                  i <= stepProgress ? "text-foreground" : "text-muted-foreground"
                )}>{step}</p>
                {i === stepProgress && (
                  <p className="text-xs text-secondary">{t("timeline.currentStage")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Case Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("timeline.forms"), value: `${formsCompleted}/${forms.length}` },
          { label: t("timeline.documents"), value: String(docsUploaded) },
          { label: t("timeline.events"), value: String(milestones.length) },
        ].map((stat) => (
          <div key={stat.label} className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline Events */}
      {milestones.length > 0 ? (
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 space-y-4">
          <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-secondary" /> {t("timeline.timelineEvents")}
          </h2>
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  {m.description && (
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{m.date} · {m.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {t("timeline.noEvents")}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-1">
        <AlertTriangle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">{t("timeline.estimateDisclaimer")}</p>
      </div>

      {/* Notify Button */}
      <div className="pb-4">
        <Button
          onClick={() => toast({ title: t("timeline.subscribed"), description: t("timeline.subscribedDesc") })}
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md"
        >
          <Bell className="w-5 h-5 mr-2" />
          {t("timeline.getNotified")}
        </Button>
        <p className="text-[10px] text-muted-foreground/60 text-center mt-2">{t("common.disclaimer")}</p>
      </div>
    </div>
  );
};

export default TimelinePrediction;
