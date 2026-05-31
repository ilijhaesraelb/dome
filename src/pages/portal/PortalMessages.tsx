import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight, Upload, Plus, FileText, Clock, Send,
  CheckCircle2, Lock, ShieldCheck, UserCheck
} from "lucide-react";
import { useT } from "@/hooks/useT";

const timelineEvents = [
  { icon: Plus, label: "Pathway Identified", date: "Apr 8, 2024" },
  { icon: FileText, label: "H-1B Petition Started", date: "Apr 10, 2024" },
  { icon: Send, label: "Invitation Sent to Attorney", date: "Apr 10, 2024", hasChevron: true },
  { icon: Upload, label: "Documents Uploading: 6/9", date: "Apr 12, 2024" },
  { icon: CheckCircle2, label: "Form Preparation", date: "up next", upcoming: true },
];

const updates = [
  {
    icon: Send,
    title: "Attorney Invitation Sent",
    subtitle: "Daniel Lee, Immigration Attorney",
    detail: "Invitation sent – not yet confirmed",
  },
  {
    icon: FileText,
    title: "Priority Date Recorded",
    subtitle: "Apr 8, 2024",
    hasChevron: true,
  },
  {
    icon: CheckCircle2,
    title: "Eligibility Match",
    subtitle: "The H-1B visa won as the best pathway",
    highlight: "Found",
    hasChevron: true,
  },
  {
    icon: Clock,
    title: "Case Started",
    subtitle: "Your profile was submitted",
    timeLabel: "Oct 2024",
  },
];

const PortalMessages = () => {
  const t = useT();
  const [activeTab, setActiveTab] = useState<"updates" | "messages">("updates");

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Page Header */}
      <div className="bg-primary rounded-xl p-5 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold">{t("messages.title")}</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">{t("messages.subtitle")}</p>
      </div>

      {/* Case Readiness */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-base mb-3">{t("messages.caseReadiness")}</h3>
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6"
                  strokeDasharray={`${72 * 2.01} ${100 * 2.01}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-secondary">72%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">{t("messages.youStillNeed")}</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                <li>Passport scan</li>
                <li>Travel history</li>
                <li>Employment history</li>
              </ul>
            </div>
          </div>
          <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 mt-4">
            {t("messages.uploadMissing")} <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Case Timeline */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-base mb-4">{t("messages.caseTimeline")}</h3>
          <div className="space-y-4">
            {timelineEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    ev.upcoming ? "bg-muted" : "bg-secondary/10"
                  }`}>
                    <ev.icon className={`w-4 h-4 ${ev.upcoming ? "text-muted-foreground" : "text-secondary"}`} />
                  </div>
                  {i < timelineEvents.length - 1 && (
                    <div className="w-0.5 h-6 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${ev.upcoming ? "text-muted-foreground" : ""}`}>{ev.label}</p>
                    {ev.hasChevron && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{ev.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Updates & Messages section */}
      <div className="bg-primary rounded-xl p-5 text-primary-foreground">
        <h2 className="font-display text-xl font-bold">{t("messages.updatesMessages")}</h2>
        <p className="text-primary-foreground/70 text-sm mt-1">{t("messages.updatesSubtitle")}</p>
      </div>

      {/* Tab toggle */}
      <div className="flex rounded-lg border overflow-hidden">
        <button
          onClick={() => setActiveTab("updates")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "updates"
              ? "bg-secondary text-secondary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("messages.updates")}
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "messages"
              ? "bg-secondary text-secondary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("messages.messagesTab")}
        </button>
      </div>

      {activeTab === "updates" && (
        <Card>
          <CardContent className="p-4 space-y-1">
            <h3 className="font-display font-bold text-base mb-2">{t("messages.recentUpdates")}</h3>
            {updates.map((u, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <u.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {u.title}
                    {u.highlight && <span className="text-secondary ml-1">{u.highlight}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{u.subtitle}</p>
                  {u.detail && <p className="text-xs text-muted-foreground">{u.detail}</p>}
                </div>
                {u.hasChevron && <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />}
                {u.timeLabel && <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">{u.timeLabel}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "messages" && (
        <Card>
          <CardContent className="p-5 text-center text-muted-foreground">
            <p className="text-sm">{t("messages.noMessages")}</p>
          </CardContent>
        </Card>
      )}

      {/* Security footer */}
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-secondary" />
          <span>{t("common.bankGradeEncryption")}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>{t("messages.accessControlled")}</span>
        </div>
      </div>

      <div className="flex justify-center gap-3 text-xs text-muted-foreground pb-2">
        <a href="/privacy" className="hover:underline">{t("common.privacyPolicy")}</a>
        <span>·</span>
        <a href="/terms" className="hover:underline">{t("common.terms")}</a>
      </div>
    </div>
  );
};

export default PortalMessages;
