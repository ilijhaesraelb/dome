/**
 * Nonprofit Entry Decision Screen — "What do you need help with today?"
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Calendar, HelpCircle, Upload, ArrowRight, Building2, Clock, Shield,
} from "lucide-react";
import BackButton from "@/components/BackButton";

const OPTIONS = [
  {
    title: "Annual Nonprofit Filing",
    desc: "Start or continue your organization's annual 990-series filing.",
    icon: FileText,
    to: "/tax/nonprofit",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "990-N / 990-EZ / 990 Preparation",
    desc: "Get guided help preparing a specific nonprofit form.",
    icon: Building2,
    to: "/tax/nonprofit",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    title: "Extension Filing",
    desc: "Need more time? File Form 8868 for an automatic extension.",
    icon: Clock,
    to: "/tax/nonprofit",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    title: "I'm Not Sure What to File",
    desc: "Answer a few questions and we'll recommend the likely filing path.",
    icon: HelpCircle,
    to: "/tax/nonprofit",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Upload Documents for Review",
    desc: "Upload your financial documents and we'll help organize them.",
    icon: Upload,
    to: "/tax/documents",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    title: "Continue Previous Filing",
    desc: "Resume your in-progress nonprofit filing workspace.",
    icon: ArrowRight,
    to: "/tax/nonprofit/workspace",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
];

const NonprofitDecisionScreen = () => (
  <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in">
    <BackButton />
    <div className="text-center space-y-3">
      <Badge className="bg-secondary/10 text-secondary border-0">Nonprofit Filing</Badge>
      <h1 className="text-2xl sm:text-3xl font-display font-bold">What do you need help with today?</h1>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto">
        Choose an option below to get started. You can save and return anytime.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {OPTIONS.map(opt => (
        <Link key={opt.title} to={opt.to}>
          <Card className="h-full hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer border-2 hover:border-primary/30 group">
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${opt.bg} flex items-center justify-center shrink-0`}>
                <opt.icon className={`w-6 h-6 ${opt.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{opt.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>

    <div className="text-center space-y-3">
      <div className="flex items-center justify-center gap-6 text-muted-foreground/50 text-xs">
        {[
          { icon: Shield, text: "Secure & Encrypted" },
          { icon: Clock, text: "Save & Resume" },
          { icon: Building2, text: "Built for Nonprofits" },
        ].map(t => (
          <span key={t.text} className="flex items-center gap-1.5">
            <t.icon className="w-3.5 h-3.5" /> {t.text}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        D.O.M.E. provides filing preparation tools — not legal or tax advice.
      </p>
    </div>
  </div>
);

export default NonprofitDecisionScreen;
