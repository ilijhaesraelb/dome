import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign, Users, FileDown, TrendingUp, CreditCard,
  Gift, BarChart3, Building2, Scale, ArrowUpRight, ArrowDownRight,
  Loader2, Download,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useT } from "@/hooks/useT";
// Mock revenue data for the dashboard
const mockMonthlyRevenue = [
  { month: "Jan", subscriptions: 1200, exports: 340, referrals: 120, consultations: 75, total: 1735 },
  { month: "Feb", subscriptions: 1450, exports: 420, referrals: 180, consultations: 150, total: 2200 },
  { month: "Mar", subscriptions: 1800, exports: 510, referrals: 210, consultations: 225, total: 2745 },
  { month: "Apr", subscriptions: 2100, exports: 580, referrals: 280, consultations: 200, total: 3160 },
  { month: "May", subscriptions: 2400, exports: 620, referrals: 310, consultations: 350, total: 3680 },
  { month: "Jun", subscriptions: 2850, exports: 750, referrals: 380, consultations: 300, total: 4280 },
];

const mockSubscriptionBreakdown = [
  { name: "Standard ($3/mo)", value: 420, color: "hsl(22, 76%, 53%)" },
  { name: "Pro ($12/mo)", value: 85, color: "hsl(218, 41%, 21%)" },
  { name: "Attorney Starter", value: 32, color: "hsl(142, 71%, 45%)" },
  { name: "Attorney Pro", value: 18, color: "hsl(38, 92%, 50%)" },
  { name: "Nonprofit", value: 12, color: "hsl(220, 20%, 60%)" },
  { name: "Enterprise", value: 5, color: "hsl(0, 84%, 60%)" },
];

const mockRecentPayments = [
  { id: "1", user: "Maria G.", type: "subscription", plan: "Standard", amount: 3, date: "2026-03-08", status: "paid" },
  { id: "2", user: "Law Offices of J. Kim", type: "subscription", plan: "Attorney Pro", amount: 99, date: "2026-03-08", status: "paid" },
  { id: "3", user: "Carlos R.", type: "export", plan: "Marriage Adjustment", amount: 10, date: "2026-03-07", status: "paid" },
  { id: "4", user: "nonprofit-org-1", type: "subscription", plan: "Nonprofit Access", amount: 25, date: "2026-03-07", status: "paid" },
  { id: "5", user: "Ahmed K.", type: "onboarding", plan: "Onboarding Fee", amount: 1, date: "2026-03-07", status: "paid" },
  { id: "6", user: "Priya S.", type: "addon", plan: "AI Case Report", amount: 14, date: "2026-03-06", status: "paid" },
  { id: "7", user: "John D.", type: "export", plan: "Citizenship Packet", amount: 5, date: "2026-03-06", status: "paid" },
  { id: "8", user: "affiliate-payout", type: "referral", plan: "Partner Commission", amount: -45, date: "2026-03-05", status: "paid" },
];

const mockPayoutQueue = [
  { affiliate: "ImmigrationHelp.org", amount: 120, period: "Feb 2026", status: "pending" },
  { affiliate: "AttorneyNetwork", amount: 85.50, period: "Feb 2026", status: "pending" },
  { affiliate: "Maria Lopez (Individual)", amount: 35, period: "Feb 2026", status: "approved" },
];

const typeColors: Record<string, string> = {
  subscription: "bg-secondary/15 text-secondary",
  export: "bg-primary/15 text-primary",
  onboarding: "bg-success/15 text-success",
  referral: "bg-warning/15 text-warning-foreground",
  addon: "bg-accent text-accent-foreground",
};

const AdminRevenue = () => {
  const t = useT();
  const [period, setPeriod] = useState("6months");

  const totals = useMemo(() => {
    const latest = mockMonthlyRevenue[mockMonthlyRevenue.length - 1];
    const prev = mockMonthlyRevenue[mockMonthlyRevenue.length - 2];
    const growth = prev ? ((latest.total - prev.total) / prev.total * 100).toFixed(1) : "0";
    const totalSubs = mockSubscriptionBreakdown.reduce((s, b) => s + b.value, 0);
    return {
      mrr: latest.total,
      growth: parseFloat(growth),
      totalSubscribers: totalSubs,
      exportRevenue: latest.exports,
      referralPayouts: latest.referrals,
    };
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Revenue Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Financial overview and billing analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-1.5">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              Monthly Revenue
            </div>
            <p className="text-2xl font-bold">${totals.mrr.toLocaleString()}</p>
            <div className={`flex items-center gap-0.5 text-xs mt-1 ${totals.growth > 0 ? "text-success" : "text-destructive"}`}>
              {totals.growth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(totals.growth)}% vs last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3.5 h-3.5" />
              Active Subscribers
            </div>
            <p className="text-2xl font-bold">{totals.totalSubscribers}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all tiers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileDown className="w-3.5 h-3.5" />
              Export Revenue
            </div>
            <p className="text-2xl font-bold">${totals.exportRevenue}</p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Gift className="w-3.5 h-3.5" />
              Referral Payouts
            </div>
            <p className="text-2xl font-bold">${totals.referralPayouts}</p>
            <p className="text-xs text-muted-foreground mt-1">Commissions due</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Net Revenue
            </div>
            <p className="text-2xl font-bold">${(totals.mrr - totals.referralPayouts).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">After payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Revenue Trend</CardTitle>
            <CardDescription className="text-xs">Monthly breakdown by revenue stream</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockMonthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number) => [`$${value}`, ""]} />
                  <Legend />
                  <Area type="monotone" dataKey="subscriptions" stackId="1" fill="hsl(22, 76%, 53%)" fillOpacity={0.6} stroke="hsl(22, 76%, 53%)" name="Subscriptions" />
                  <Area type="monotone" dataKey="exports" stackId="1" fill="hsl(218, 41%, 21%)" fillOpacity={0.6} stroke="hsl(218, 41%, 21%)" name="Exports" />
                  <Area type="monotone" dataKey="consultations" stackId="1" fill="hsl(142, 71%, 45%)" fillOpacity={0.6} stroke="hsl(142, 71%, 45%)" name="Consultations" />
                  <Area type="monotone" dataKey="referrals" stackId="1" fill="hsl(38, 92%, 50%)" fillOpacity={0.4} stroke="hsl(38, 92%, 50%)" name="Referrals" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Plan Distribution</CardTitle>
            <CardDescription className="text-xs">Subscribers by tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mockSubscriptionBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}`}>
                    {mockSubscriptionBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {mockSubscriptionBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 text-muted-foreground truncate">{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions & Payouts */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="transactions" className="gap-1.5">
            <CreditCard className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-1.5">
            <Gift className="w-4 h-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="tiers" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Tiers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 text-left font-medium text-muted-foreground">User</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Plan</th>
                      <th className="p-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="p-3 text-center font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecentPayments.map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="p-3 font-medium">{payment.user}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] border-0 ${typeColors[payment.type] || ""}`}>
                            {payment.type}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{payment.plan}</td>
                        <td className={`p-3 text-right font-medium ${payment.amount < 0 ? "text-destructive" : ""}`}>
                          {payment.amount < 0 ? `-$${Math.abs(payment.amount)}` : `$${payment.amount}`}
                        </td>
                        <td className="p-3 text-muted-foreground">{payment.date}</td>
                        <td className="p-3 text-center">
                          <Badge className="bg-success/15 text-success text-[10px] border-0">Paid</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">Affiliate Payout Queue</CardTitle>
                <Button size="sm" className="gap-1.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Process Payouts
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 text-left font-medium text-muted-foreground">Affiliate</th>
                      <th className="p-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Period</th>
                      <th className="p-3 text-center font-medium text-muted-foreground">Status</th>
                      <th className="p-3 text-center font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPayoutQueue.map((payout, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="p-3 font-medium">{payout.affiliate}</td>
                        <td className="p-3 text-right font-medium">${payout.amount.toFixed(2)}</td>
                        <td className="p-3 text-muted-foreground">{payout.period}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className={`text-[10px] border-0 ${payout.status === "approved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>
                            {payout.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Button variant="ghost" size="sm">Review</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">Revenue by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { tier: "Standard", revenue: 1260, count: 420 },
                    { tier: "Pro", revenue: 1020, count: 85 },
                    { tier: "Atty Starter", revenue: 1568, count: 32 },
                    { tier: "Atty Pro", revenue: 1782, count: 18 },
                    { tier: "Nonprofit", revenue: 300, count: 12 },
                    { tier: "Enterprise", revenue: 1495, count: 5 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="tier" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value: number, name: string) => [name === "revenue" ? `$${value}` : value, name === "revenue" ? "Revenue" : "Subscribers"]} />
                    <Bar dataKey="revenue" fill="hsl(22, 76%, 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRevenue;
