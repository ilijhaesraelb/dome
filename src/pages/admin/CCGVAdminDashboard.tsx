import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefcase, AlertTriangle, Users, DollarSign, Search, Bell,
  List, FileDown, Loader2, Plus, Building2, ShieldCheck, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCases } from "@/hooks/useCases";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useT } from "@/hooks/useT";

/* ── mock chart data ── */
const chartData = [
  { month: "Nov", signups: 180, earnings: 320 },
  { month: "Dec", signups: 220, earnings: 480 },
  { month: "Jan", signups: 310, earnings: 620 },
  { month: "Feb", signups: 280, earnings: 710 },
  { month: "Mar", signups: 350, earnings: 890 },
  { month: "Apr", signups: 420, earnings: 1050 },
  { month: "May", signups: 480, earnings: 1180 },
  { month: "Jun", signups: 520, earnings: 1320 },
  { month: "Jul", signups: 610, earnings: 1480 },
  { month: "Aug", signups: 580, earnings: 1550 },
  { month: "Sep", signups: 640, earnings: 1620 },
  { month: "Oct", signups: 690, earnings: 1780 },
  { month: "Nov", signups: 720, earnings: 1850 },
  { month: "Dec", signups: 750, earnings: 1920 },
];

const mockOrganizations = [
  { name: "American Dream Immigration", color: "bg-red-500", count: 257 },
  { name: "Canada Express Immigration", color: "bg-red-600", count: 107 },
  { name: "Perfect Portuguese Visas", color: "bg-green-600", count: 62 },
  { name: "Law Office of Smart & Cho", color: "bg-blue-700", count: 31 },
  { name: "Univision Latino Outreach", color: "bg-yellow-600", count: 19 },
];

const statusLabels: Record<string, string> = {
  draft: "Draft", in_progress: "Onboarding", waiting_client: "Waiting",
  ready_for_review: "Review", submitted: "Submitted", rfe_issued: "RFE",
  approved: "Approved", denied: "Denied", closed: "Closed",
  rfe_response_sent: "RFE Sent",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-secondary/80 text-white",
  waiting_client: "bg-warning/80 text-white",
  ready_for_review: "bg-primary/80 text-white",
  submitted: "bg-primary/60 text-white",
  approved: "bg-success/80 text-white",
  denied: "bg-destructive/80 text-white",
  closed: "bg-muted text-muted-foreground",
  rfe_issued: "bg-warning text-white",
  rfe_response_sent: "bg-primary/60 text-white",
};

const CCGVAdminDashboard = () => {
  const t = useT();
  const { user } = useAuth();
  const { data: cases, isLoading: casesLoading } = useCases();
  const navigate = useNavigate();
  const [caseFilter, setCaseFilter] = useState("all");
  const [chartFilter, setChartFilter] = useState("all");

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || "Admin Manager";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  // Fetch real affiliate/referral stats
  const { data: affiliateStats } = useQuery({
    queryKey: ["admin-affiliate-stats"],
    queryFn: async () => {
      const [{ count: activeReferrals }, { data: commissions }] = await Promise.all([
        supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("affiliate_commissions").select("commission_amount, status"),
      ]);
      const totalEarnings = commissions?.reduce((s, c) => s + Number(c.commission_amount), 0) || 0;
      const totalPaid = commissions?.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0) || 0;
      return { activeReferrals: activeReferrals || 0, totalEarnings, totalPaid };
    },
  });

  // Fetch pending verifications count
  const { data: pendingVerifications } = useQuery({
    queryKey: ["admin-pending-verifications"],
    queryFn: async () => {
      const { count } = await supabase
        .from("professional_verifications" as any)
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      return count || 0;
    },
  });

  // Fetch export monitoring stats
  const { data: exportStats } = useQuery({
    queryKey: ["admin-export-stats"],
    queryFn: async () => {
      const [
        { count: totalExports },
        { count: successfulExports },
        { count: failedExports },
        { data: recentExports },
      ] = await Promise.all([
        supabase.from("case_exports").select("*", { count: "exact", head: true }),
        supabase.from("case_exports").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("case_exports").select("*", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("case_exports").select("*, cases(case_number)").order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        total: totalExports || 0,
        successful: successfulExports || 0,
        failed: failedExports || 0,
        recent: recentExports || [],
      };
    },
  });

  // Fetch user role overview
  const { data: roleOverview } = useQuery({
    queryKey: ["admin-role-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role");
      const counts: Record<string, number> = {};
      data?.forEach(r => { counts[r.role] = (counts[r.role] || 0) + 1; });
      return counts;
    },
  });

  // Fetch incomplete profiles count
  const { data: incompleteProfiles } = useQuery({
    queryKey: ["admin-incomplete-profiles"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .or("first_name.is.null,last_name.is.null");
      return count || 0;
    },
  });

  const activeCasesCount = cases?.filter(c => !["approved", "denied", "closed"].includes(c.status)).length || 0;
  const pendingReviewCount = cases?.filter(c => c.status === "ready_for_review").length || 0;
  const exportRevenue = (cases?.length || 0) * 3;

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    if (caseFilter === "all") return cases;
    return cases.filter(c => c.status === caseFilter);
  }, [cases, caseFilter]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground relative">
            <Bell className="w-5 h-5" />
            {(pendingReviewCount + (pendingVerifications || 0)) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                {pendingReviewCount + (pendingVerifications || 0)}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <List className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <Avatar className="w-9 h-9 border-2 border-secondary">
              <AvatarFallback className="bg-secondary/20 text-secondary font-bold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-foreground">{displayName}</p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-secondary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Main Column (3/4) ── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Referral Performance Stats */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">Referral Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted/40 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <span className="text-3xl font-bold font-display text-foreground">
                      {casesLoading ? "—" : activeCasesCount}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Active Cases</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="text-3xl font-bold font-display text-foreground">
                      {casesLoading ? "—" : pendingReviewCount}
                    </span>
                    {pendingReviewCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Pending Reviews</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-secondary" />
                    <span className="text-3xl font-bold font-display text-foreground">
                      {affiliateStats?.activeReferrals ?? "—"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Active Referrals</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <DollarSign className="w-5 h-5 text-secondary" />
                    <span className="text-3xl font-bold font-display text-foreground">
                      ${(exportRevenue + (affiliateStats?.totalEarnings || 0)).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Export Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Performance Chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Referral Performance</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={chartFilter} onValueChange={setChartFilter}>
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="signups">Sign-Ups</SelectItem>
                    <SelectItem value="earnings">Earnings</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <FileDown className="w-3.5 h-3.5" />
                  Quick Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number, name: string) => [name === "earnings" ? `$${v}` : v, name === "earnings" ? "Partner Earnings" : "Daily Sign-Ups"]} />
                    <Legend />
                    {(chartFilter === "all" || chartFilter === "signups") && (
                      <Line type="monotone" dataKey="signups" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Daily Sign-Ups" />
                    )}
                    {(chartFilter === "all" || chartFilter === "earnings") && (
                      <Line type="monotone" dataKey="earnings" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} name="Partner Earnings" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Case Management */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Case Management</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={caseFilter} onValueChange={setCaseFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cases</SelectItem>
                    <SelectItem value="in_progress">Onboarding</SelectItem>
                    <SelectItem value="ready_for_review">Review</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <FileDown className="w-3.5 h-3.5" />
                  Quick Export
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <Plus className="w-3.5 h-3.5" />
                  New Case
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {casesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCases.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">All Cases</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Case Type</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Priority</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Export Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredCases.slice(0, 12).map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/cases/${c.id}`)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-foreground">{c.case_number}</span>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{c.case_type || c.visa_type || "—"}</td>
                          <td className="px-3 py-3">
                            <Badge className={cn("text-[10px] font-semibold border-0 rounded-md", statusColors[c.status] || "bg-muted text-muted-foreground")}>
                              {statusLabels[c.status] || c.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="outline" className="text-[10px] capitalize">{c.priority}</Badge>
                          </td>
                          <td className="px-3 py-3 text-right font-medium">$3.00</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No cases found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Sidebar (1/4) ── */}
        <div className="space-y-6">
          {/* Export Revenue Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Export Revenue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">
                    ${(affiliateStats?.totalEarnings || 3842).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Referral Earnings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">
                    ${(affiliateStats?.totalPaid || 1480).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Total Payouts</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xl font-bold font-display text-foreground">
                  ${((affiliateStats?.totalEarnings || 3842) - (affiliateStats?.totalPaid || 1480)).toLocaleString()}.00
                </p>
                <p className="text-[10px] text-muted-foreground mb-3">Available Balance</p>
                <Button size="sm" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold">
                  Withdraw Funds
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Verification Queue */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">Verification Queue</CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {pendingVerifications ?? 0} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="flex-1 text-muted-foreground">Attorney Licenses</span>
                  <Badge variant="outline" className="text-[10px]">Review</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  <span className="flex-1 text-muted-foreground">DOJ Approvals</span>
                  <Badge variant="outline" className="text-[10px]">Review</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                View All Verifications
              </Button>
            </CardContent>
          </Card>

          {/* Export Monitoring */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Export Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{exportStats?.total ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{exportStats?.successful ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Success</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-destructive">{exportStats?.failed ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Failed</p>
                </div>
              </div>
              {(exportStats?.recent?.length ?? 0) > 0 && (
                <div className="border-t pt-2 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-medium">Recent Exports</p>
                  {exportStats?.recent?.slice(0, 3).map((exp: any) => (
                    <div key={exp.id} className="flex items-center gap-2 text-xs">
                      <span className={cn("w-1.5 h-1.5 rounded-full", exp.status === "completed" ? "bg-green-500" : "bg-destructive")} />
                      <span className="flex-1 truncate">{exp.file_name || (exp.cases as any)?.case_number || "Export"}</span>
                      <span className="text-muted-foreground">{new Date(exp.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-2 space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-medium">User Roles</p>
                {roleOverview && Object.entries(roleOverview).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{role}</span>
                    <span className="font-semibold">{count as number}</span>
                  </div>
                ))}
                {incompleteProfiles ? (
                  <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    {incompleteProfiles} incomplete profile(s)
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Organizations */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="font-display text-base">Organizations</CardTitle>
              <Button variant="link" size="sm" className="text-xs text-secondary p-0 h-auto">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockOrganizations.map((org) => (
                  <div key={org.name} className="flex items-center gap-2.5">
                    <div className={cn("w-3 h-3 rounded-sm", org.color)} />
                    <span className="flex-1 text-sm text-foreground truncate">{org.name}</span>
                    <span className="text-sm font-bold text-foreground">{org.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Quality Control */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Export Quality Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-600">{exportStats?.total ? Math.round(((exportStats?.successful || 0) / exportStats.total) * 100) : 100}%</p>
                  <p className="text-[10px] text-muted-foreground">Success Rate</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-2">
                  <p className="text-lg font-bold text-destructive">{exportStats?.failed ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Failed Exports</p>
                </div>
              </div>
              {exportStats?.recent?.filter((e: any) => e.status === "failed").slice(0, 2).map((exp: any) => (
                <div key={exp.id} className="text-xs p-2 bg-destructive/5 rounded border border-destructive/10">
                  <p className="font-medium text-destructive truncate">{exp.file_name || "Unknown"}</p>
                  <p className="text-muted-foreground truncate">{exp.error_message || "Export failed"}</p>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate("/admin/templates")}>
                Template Manager
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => navigate("/admin/health")}>
                <AlertTriangle className="w-3 h-3" /> Platform Health
              </Button>
            </CardContent>
          </Card>

          {/* Quick Admin Actions */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2" onClick={() => navigate("/admin/referrals")}>
                <Users className="w-3.5 h-3.5" /> Manage Referrals
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2" onClick={() => navigate("/admin/revenue")}>
                <DollarSign className="w-3.5 h-3.5" /> Revenue Reports
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2" onClick={() => navigate("/admin/listings")}>
                <Building2 className="w-3.5 h-3.5" /> Listing Moderation
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2" onClick={() => navigate("/clients")}>
                <Users className="w-3.5 h-3.5" /> Client Management
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center">
        CCGV Administrative Console — Authorized Personnel Only. All activity is logged.
      </p>
    </div>
  );
};

export default CCGVAdminDashboard;
