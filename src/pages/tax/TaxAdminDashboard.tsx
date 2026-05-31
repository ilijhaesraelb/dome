/**
 * Tax Admin / Operations Dashboard
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Building2, FileText, AlertTriangle, CheckCircle2,
  Clock, DollarSign, TrendingUp,
} from "lucide-react";
import BackButton from "@/components/BackButton";

const stats = [
  { label: "Individual Intakes", value: "—", icon: Users, color: "text-primary" },
  { label: "Nonprofit Intakes", value: "—", icon: Building2, color: "text-secondary" },
  { label: "Awaiting Review", value: "—", icon: Clock, color: "text-warning" },
  { label: "Ready to File", value: "—", icon: CheckCircle2, color: "text-success" },
  { label: "Missing Documents", value: "—", icon: AlertTriangle, color: "text-destructive" },
  { label: "Revenue (MTD)", value: "$0", icon: DollarSign, color: "text-primary" },
  { label: "Most Common Filing", value: "990-EZ", icon: FileText, color: "text-secondary" },
  { label: "Failed Exports", value: "0", icon: TrendingUp, color: "text-muted-foreground" },
];

const TaxAdminDashboard = () => (
  <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
    <BackButton />
    <div>
      <Badge className="bg-destructive/10 text-destructive border-0 mb-2">Admin</Badge>
      <h1 className="text-2xl font-display font-bold">Tax & Accounting Operations</h1>
      <p className="text-sm text-muted-foreground">Internal dashboard for managing tax filing workflows.</p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-4 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color}`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardContent className="p-8 text-center text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="font-semibold">Operations dashboard will populate as filings come in.</p>
        <p className="text-xs mt-2">Individual intakes, nonprofit filings, and review queues will appear here.</p>
      </CardContent>
    </Card>
  </div>
);

export default TaxAdminDashboard;
