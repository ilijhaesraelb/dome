import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Languages, BarChart3, Volume2, Mic, Lightbulb, Headphones,
  TrendingUp, Globe, Loader2, CheckCircle2, Clock, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES, getLangLabel, getLangFlag } from "@/hooks/useTranslation";
import { useT } from "@/hooks/useT";

interface AnalyticsData {
  totalTranslations: number;
  totalVoiceMessages: number;
  totalExplanations: number;
  totalSupportRequests: number;
  languageBreakdown: Record<string, number>;
  pendingSupportRequests: any[];
}

const TranslationAnalytics = () => {
  const t = useT();
  const [data, setData] = useState<AnalyticsData>({
    totalTranslations: 0,
    totalVoiceMessages: 0,
    totalExplanations: 0,
    totalSupportRequests: 0,
    languageBreakdown: {},
    pendingSupportRequests: [],
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadAnalytics = async () => {
      const [analyticsRes, supportRes] = await Promise.all([
        supabase.from("translation_analytics" as any).select("*"),
        supabase.from("language_support_requests" as any).select("*").order("created_at", { ascending: false }),
      ]);

      const analytics = (analyticsRes.data || []) as any[];
      const support = (supportRes.data || []) as any[];

      const langBreakdown: Record<string, number> = {};
      let translations = 0, voice = 0, explanations = 0;

      for (const row of analytics) {
        if (row.event_type === "translation") translations++;
        else if (row.event_type === "voice_message") voice++;
        else if (row.event_type === "simple_explanation") explanations++;

        const lang = row.target_language || "unknown";
        langBreakdown[lang] = (langBreakdown[lang] || 0) + 1;
      }

      setData({
        totalTranslations: translations,
        totalVoiceMessages: voice,
        totalExplanations: explanations,
        totalSupportRequests: support.length,
        languageBreakdown: langBreakdown,
        pendingSupportRequests: support,
      });
      setLoading(false);
    };
    loadAnalytics();
  }, []);

  const handleResolve = async (id: string) => {
    await supabase
      .from("language_support_requests" as any)
      .update({ status: "resolved", resolved_at: new Date().toISOString() } as any)
      .eq("id", id);
    setData((prev) => ({
      ...prev,
      pendingSupportRequests: prev.pendingSupportRequests.map((r: any) =>
        r.id === id ? { ...r, status: "resolved" } : r
      ),
    }));
  };

  const filteredRequests = data.pendingSupportRequests.filter(
    (r: any) => statusFilter === "all" || r.status === statusFilter
  );

  const sortedLangs = Object.entries(data.languageBreakdown).sort(([, a], [, b]) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-primary rounded-xl p-5 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" /> Translation Analytics
        </h1>
        <p className="text-primary-foreground/70 text-sm mt-1">
          Monitor language usage and support requests across the platform
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Languages className="w-6 h-6 mx-auto text-secondary mb-1" />
            <p className="text-2xl font-bold">{data.totalTranslations}</p>
            <p className="text-xs text-muted-foreground">Translations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Mic className="w-6 h-6 mx-auto text-secondary mb-1" />
            <p className="text-2xl font-bold">{data.totalVoiceMessages}</p>
            <p className="text-xs text-muted-foreground">Voice Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Lightbulb className="w-6 h-6 mx-auto text-secondary mb-1" />
            <p className="text-2xl font-bold">{data.totalExplanations}</p>
            <p className="text-xs text-muted-foreground">Simple Explanations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Headphones className="w-6 h-6 mx-auto text-secondary mb-1" />
            <p className="text-2xl font-bold">{data.totalSupportRequests}</p>
            <p className="text-xs text-muted-foreground">Support Requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Language breakdown */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-display font-bold text-base flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-secondary" /> Most Used Languages
          </h2>
          {sortedLangs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No translation data yet.</p>
          ) : (
            <div className="space-y-3">
              {sortedLangs.map(([code, count]) => {
                const max = sortedLangs[0][1];
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={code} className="flex items-center gap-3">
                    <span className="text-lg">{getLangFlag(code)}</span>
                    <span className="text-sm font-medium w-28 shrink-0">{getLangLabel(code)}</span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-secondary h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-muted-foreground w-10 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language Support Requests */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <Headphones className="w-4 h-4 text-secondary" /> Language Support Requests
            </h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No support requests found.</p>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req: any) => (
                <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    {req.status === "pending" ? (
                      <Clock className="w-4 h-4 text-orange-500" />
                    ) : req.status === "resolved" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold capitalize">{req.request_type.replace("_", " ")}</p>
                      <Badge variant={req.status === "pending" ? "secondary" : req.status === "resolved" ? "default" : "outline"} className="text-[9px]">
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getLangFlag(req.preferred_language)} {getLangLabel(req.preferred_language)} · {new Date(req.created_at).toLocaleDateString()}
                    </p>
                    {req.description && <p className="text-xs mt-1">{req.description}</p>}
                  </div>
                  {req.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => handleResolve(req.id)} className="text-xs shrink-0">
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationAnalytics;
