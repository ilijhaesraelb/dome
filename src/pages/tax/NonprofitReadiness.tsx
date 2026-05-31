/**
 * Nonprofit Readiness Check — Shows completion status before entering workspace.
 */
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, Upload,
  UserCheck, Building2, Shield,
} from "lucide-react";
import BackButton from "@/components/BackButton";

interface ReadinessItem {
  label: string;
  status: "complete" | "warning" | "blocker";
  detail: string;
}

// In a real app these would be computed from stored intake + document data
const ITEMS: ReadinessItem[] = [
  { label: "Organization Identity", status: "complete", detail: "EIN, name, and address provided." },
  { label: "Filing Year", status: "complete", detail: "Tax year dates confirmed." },
  { label: "Financial Data", status: "warning", detail: "Revenue entered — expenses still needed." },
  { label: "Governance Info", status: "blocker", detail: "Principal officer name is required." },
  { label: "Uploaded Documents", status: "warning", detail: "2 of 5 recommended documents uploaded." },
  { label: "Filing Path", status: "complete", detail: "Likely form: 990-EZ" },
];

const STATUS_ICON = {
  complete: <CheckCircle2 className="w-5 h-5 text-success" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  blocker: <XCircle className="w-5 h-5 text-destructive" />,
};

const NonprofitReadiness = () => {
  const navigate = useNavigate();
  const blockers = ITEMS.filter(i => i.status === "blocker").length;
  const warnings = ITEMS.filter(i => i.status === "warning").length;
  const complete = ITEMS.filter(i => i.status === "complete").length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <BackButton />
      <div className="text-center space-y-2">
        <Badge className="bg-primary/10 text-primary border-0">Readiness Check</Badge>
        <h1 className="text-2xl font-display font-bold">Filing Readiness</h1>
        <p className="text-sm text-muted-foreground">
          Here's what's complete, what needs attention, and what's blocking your filing.
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex items-center justify-center gap-3">
        <Badge className="bg-success/10 text-success border-0 gap-1">
          <CheckCircle2 className="w-3 h-3" /> {complete} Complete
        </Badge>
        <Badge className="bg-warning/10 text-warning border-0 gap-1">
          <AlertTriangle className="w-3 h-3" /> {warnings} Warnings
        </Badge>
        {blockers > 0 && (
          <Badge className="bg-destructive/10 text-destructive border-0 gap-1">
            <XCircle className="w-3 h-3" /> {blockers} Blockers
          </Badge>
        )}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {ITEMS.map(item => (
          <Card key={item.label} className={
            item.status === "blocker" ? "border-destructive/30" :
            item.status === "warning" ? "border-warning/30" : ""
          }>
            <CardContent className="p-4 flex items-center gap-4">
              {STATUS_ICON[item.status]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              {item.status !== "complete" && (
                <Button variant="ghost" size="sm" className="text-xs shrink-0"
                  onClick={() => navigate("/tax/nonprofit/workspace")}>
                  Fix
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1 gap-2" onClick={() => navigate("/tax/nonprofit/workspace")}
          disabled={blockers > 0}>
          {blockers > 0 ? "Fix Blockers First" : "Continue to Filing"} <ArrowRight className="w-4 h-4" />
        </Button>
        <Link to="/tax/documents" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Upload className="w-4 h-4" /> Upload Documents
          </Button>
        </Link>
        <Link to="/tax/review" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <UserCheck className="w-4 h-4" /> Request Review
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-center gap-4 text-muted-foreground/40 text-[10px]">
        <Shield className="w-3 h-3" />
        <span>You can save and return later. Your data is safe.</span>
      </div>
    </div>
  );
};

export default NonprofitReadiness;
