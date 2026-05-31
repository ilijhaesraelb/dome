import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, FileText, Users, GraduationCap, Briefcase, Globe, ArrowRight, FileCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useT } from "@/hooks/useT";
import { AlertTriangle } from "lucide-react";

const monthlyData = [
  { month: "Oct", participants: 42, completions: 8, referrals: 5 },
  { month: "Nov", participants: 58, completions: 12, referrals: 8 },
  { month: "Dec", participants: 73, completions: 18, referrals: 11 },
  { month: "Jan", participants: 91, completions: 24, referrals: 14 },
  { month: "Feb", participants: 112, completions: 35, referrals: 19 },
  { month: "Mar", participants: 134, completions: 48, referrals: 23 },
];

const languageData = [
  { name: "English", value: 45 }, { name: "Spanish", value: 38 }, { name: "Arabic", value: 12 },
  { name: "Mandarin", value: 8 }, { name: "French", value: 6 }, { name: "Other", value: 4 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--gold))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--muted-foreground))"];

const reportMetrics = [
  { label: "Total Participants Served", value: "134", icon: Users },
  { label: "Citizenship Participants", value: "48", icon: GraduationCap },
  { label: "Business Launch Participants", value: "25", icon: Briefcase },
  { label: "Referrals to Attorneys/Reps", value: "23", icon: ArrowRight },
  { label: "Documents Uploaded", value: "847", icon: FileText },
  { label: "Avg Readiness Score", value: "64%", icon: FileCheck },
  { label: "Completion Rate", value: "36%", icon: BarChart3 },
  { label: "Languages Served", value: "7", icon: Globe },
];

const ProgramReporting = () => {
  const t = useT();
  const [dateRange, setDateRange] = useState("6months");
  const [programFilter, setProgramFilter] = useState("all");

  return (
    <div className="space-y-6">
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <div>
          <p className="font-semibold text-sm">Preview Mode — Coming Soon</p>
          <p className="text-xs text-muted-foreground">This report shows sample data. Live reporting will be connected in an upcoming release.</p>
        </div>
      </div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("govReport.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("govReport.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> PDF</Button>
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> CSV</Button>
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="1month">Last 30 Days</SelectItem><SelectItem value="3months">Last 3 Months</SelectItem><SelectItem value="6months">Last 6 Months</SelectItem><SelectItem value="1year">Last 12 Months</SelectItem></SelectContent>
          </Select>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Programs</SelectItem><SelectItem value="citizenship">Citizenship</SelectItem><SelectItem value="legal_orientation">Legal Orientation</SelectItem><SelectItem value="integration">Integration</SelectItem><SelectItem value="entrepreneurship">Entrepreneurship</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reportMetrics.map((m) => (
          <Card key={m.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1"><m.icon className="w-4 h-4 text-primary" /><p className="text-[11px] text-muted-foreground uppercase tracking-wide">{m.label}</p></div>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">{t("govReport.monthlyTrends")}</CardTitle><CardDescription>{t("govReport.monthlyTrendsDesc")}</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="participants" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Participants" />
                <Bar dataKey="completions" fill="hsl(var(--success))" radius={[4,4,0,0]} name="Completions" />
                <Bar dataKey="referrals" fill="hsl(var(--gold))" radius={[4,4,0,0]} name="Referrals" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">{t("govReport.languageDistribution")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={languageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">{languageData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} /></PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {languageData.map((l, i) => (<div key={l.name} className="flex items-center gap-1.5 text-[11px]"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-muted-foreground">{l.name}: {l.value}</span></div>))}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">{t("govReport.exportFormats")}</p>
      <div className="text-[11px] text-muted-foreground text-center py-3">{t("gov.disclaimerLong")}</div>
    </div>
  );
};

export default ProgramReporting;
