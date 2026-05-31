import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, FileCheck, GraduationCap, Briefcase, Scale, TrendingUp,
  AlertTriangle, Clock, ArrowUpRight, Activity, BarChart3, Target
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useT } from "@/hooks/useT";

const mockTrends = [
  { month: "Oct", participants: 42, completions: 12 },
  { month: "Nov", participants: 58, completions: 18 },
  { month: "Dec", participants: 73, completions: 24 },
  { month: "Jan", participants: 91, completions: 35 },
  { month: "Feb", participants: 112, completions: 48 },
  { month: "Mar", participants: 134, completions: 61 },
];

const programBreakdown = [
  { name: "Citizenship", count: 48, color: "hsl(var(--primary))" },
  { name: "Legal Orient.", count: 32, color: "hsl(var(--secondary))" },
  { name: "Integration", count: 29, color: "hsl(var(--gold))" },
  { name: "Entrepreneur", count: 25, color: "hsl(var(--success))" },
];

const GovernmentDashboard = () => {
  const t = useT();
  const { data: participants } = useQuery({
    queryKey: ["gov-participants-count"],
    queryFn: async () => {
      const { count } = await supabase.from("institution_participants").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: programs } = useQuery({
    queryKey: ["gov-programs-count"],
    queryFn: async () => {
      const { count } = await supabase.from("institution_programs").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: institutions } = useQuery({
    queryKey: ["gov-institutions-count"],
    queryFn: async () => {
      const { count } = await supabase.from("institutions").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const stats = [
    { label: t("govDash.totalParticipants"), value: participants ?? 0, icon: Users, trend: "+12%", color: "text-primary" },
    { label: t("govDash.activePrograms"), value: programs ?? 0, icon: Target, trend: "+3", color: "text-secondary" },
    { label: t("govDash.institutions"), value: institutions ?? 0, icon: Activity, trend: "—", color: "text-[hsl(var(--gold))]" },
    { label: t("govDash.completionRate"), value: "73%", icon: FileCheck, trend: "+5%", color: "text-[hsl(var(--success))]" },
  ];

  const alerts = [
    { text: "14 participants waiting on documents", severity: "warning" },
    { text: "3 citizenship exam deadlines this week", severity: "urgent" },
    { text: "New partnership inquiry from City of Houston", severity: "info" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("govDash.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("govDash.subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-[hsl(var(--success))] font-medium">{stat.trend}</span> {t("govDash.vsLastPeriod")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("govDash.participantGrowth")}</CardTitle>
            <CardDescription>{t("govDash.sixMonthTrend")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={mockTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="participants" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} name="Participants" />
                <Area type="monotone" dataKey="completions" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.15)" strokeWidth={2} name="Completions" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Program Breakdown */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("govDash.programsBreakdown")}</CardTitle>
            <CardDescription>{t("govDash.activeByProgram")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={programBreakdown} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
              {t("govDash.alertsDeadlines")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className={`w-4 h-4 shrink-0 ${alert.severity === "urgent" ? "text-destructive" : alert.severity === "warning" ? "text-[hsl(var(--warning))]" : "text-primary"}`} />
                <span className="text-sm text-foreground">{alert.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("govDash.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: t("govDash.addParticipant"), icon: Users, to: "/gov/participants" },
              { label: t("govDash.viewReports"), icon: BarChart3, to: "/gov/reporting" },
              { label: t("govDash.citizenshipPrep"), icon: GraduationCap, to: "/gov/citizenship" },
              { label: t("govDash.entrepreneurHub"), icon: Briefcase, to: "/gov/entrepreneurship" },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex-col gap-2 text-xs font-medium border-border hover:bg-accent"
                onClick={() => window.location.href = action.to}
              >
                <action.icon className="w-5 h-5 text-primary" />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="text-[11px] text-muted-foreground text-center py-4 border-t border-border">
        {t("common.disclaimerLong")}
      </div>
    </div>
  );
};

export default GovernmentDashboard;
