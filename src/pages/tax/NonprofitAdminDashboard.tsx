/**
 * Nonprofit Admin/Operations Dashboard — Internal tracking of nonprofit filing pipelines.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, FileText, AlertTriangle, CheckCircle2,
  Clock, DollarSign, TrendingUp, XCircle, Users, Loader2,
} from "lucide-react";
import BackButton from "@/components/BackButton";

const QUEUES = [
  { label: "New Nonprofit Intakes", value: "—", icon: Building2, color: "text-primary" },
  { label: "Likely 990-N Queue", value: "—", icon: FileText, color: "text-success" },
  { label: "Likely 990-EZ Queue", value: "—", icon: FileText, color: "text-secondary" },
  { label: "Likely 990 Queue", value: "—", icon: FileText, color: "text-primary" },
  { label: "Missing Documents", value: "—", icon: AlertTriangle, color: "text-warning" },
  { label: "Review Needed", value: "—", icon: Clock, color: "text-warning" },
  { label: "Paid but Incomplete", value: "—", icon: DollarSign, color: "text-destructive" },
  { label: "Filing-Ready", value: "—", icon: CheckCircle2, color: "text-success" },
  { label: "Failed Exports", value: "0", icon: XCircle, color: "text-destructive" },
  { label: "Revenue (MTD)", value: "$0", icon: TrendingUp, color: "text-primary" },
];

const NonprofitAdminDashboard = () => (
  <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
    <BackButton />
    <div>
      <Badge className="bg-destructive/10 text-destructive border-0 mb-2">Admin</Badge>
      <h1 className="text-2xl font-display font-bold">Nonprofit Filing Operations</h1>
      <p className="text-sm text-muted-foreground">Internal dashboard for managing nonprofit filing workflows.</p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {QUEUES.map(s => (
        <Card key={s.label}>
          <CardContent className="p-4 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color}`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardContent className="p-8 text-center text-muted-foreground">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="font-semibold">Nonprofit filing queues will populate as intakes arrive.</p>
        <p className="text-xs mt-2">990-N, 990-EZ, and 990 pipelines will appear here with readiness status.</p>
      </CardContent>
    </Card>
  </div>
);

export default NonprofitAdminDashboard;
