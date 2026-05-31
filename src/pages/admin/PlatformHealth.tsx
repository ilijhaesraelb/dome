import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle, CheckCircle2, XCircle, Activity, RefreshCw,
  Shield, Upload, FileDown, Save, Bell, Users, Loader2,
} from "lucide-react";
import { usePlatformErrors, useResolveError, usePlatformErrorStats } from "@/hooks/usePlatformErrors";
import { useAuth } from "@/contexts/AuthContext";
import BackButton from "@/components/BackButton";

const ERROR_TYPE_LABELS: Record<string, { label: string; icon: typeof Save }> = {
  save_failure: { label: "Save Failure", icon: Save },
  upload_failure: { label: "Upload Failure", icon: Upload },
  export_failure: { label: "Export Failure", icon: FileDown },
  ocr_failure: { label: "OCR Failure", icon: Activity },
  permission_denial: { label: "Permission Denied", icon: Shield },
  route_error: { label: "Route Error", icon: XCircle },
  notification_failure: { label: "Notification Failure", icon: Bell },
  case_creation_failure: { label: "Case Creation Failure", icon: Users },
  assignment_failure: { label: "Assignment Failure", icon: Users },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-muted text-muted-foreground",
};

const PlatformHealth = () => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);

  const { data: errors = [], isLoading, refetch } = usePlatformErrors({
    resolved: showResolved ? undefined : false,
    type: filterType !== "all" ? filterType : undefined,
    severity: filterSeverity !== "all" ? filterSeverity : undefined,
  });
  const { data: stats } = usePlatformErrorStats();
  const resolveError = useResolveError();

  const handleResolve = (errorId: string) => {
    if (!user) return;
    resolveError.mutate({ errorId, userId: user.id });
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div>
        <BackButton />
        <h1 className="text-2xl font-display font-bold mt-2 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Platform Health Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and resolve platform errors across all systems
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-destructive">{stats?.critical || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-500">{stats?.high || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">High</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-foreground">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Unresolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">
              {stats?.total === 0 ? "✓" : Object.keys(stats?.byType || {}).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total === 0 ? "All Clear" : "Affected Systems"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Breakdown by Type */}
      {stats && Object.keys(stats.byType).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Errors by System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => {
                const config = ERROR_TYPE_LABELS[type] || { label: type, icon: XCircle };
                return (
                  <Badge key={type} variant="outline" className="gap-1.5 py-1.5 px-3">
                    <config.icon className="w-3.5 h-3.5" />
                    {config.label}: {count}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Error type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(ERROR_TYPE_LABELS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showResolved ? "default" : "outline"}
          size="sm"
          onClick={() => setShowResolved(!showResolved)}
        >
          {showResolved ? "Showing All" : "Hide Resolved"}
        </Button>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Error List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Error Log ({errors.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-primary" />
              <p className="font-medium">All Systems Operational</p>
              <p className="text-sm mt-1">No unresolved errors found.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="divide-y">
                {errors.map((err: any) => {
                  const config = ERROR_TYPE_LABELS[err.error_type] || { label: err.error_type, icon: XCircle };
                  const ErrorIcon = config.icon;
                  return (
                    <div key={err.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <ErrorIcon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={SEVERITY_COLORS[err.severity] || ""} variant="secondary">
                                {err.severity}
                              </Badge>
                              <Badge variant="outline">{config.label}</Badge>
                              {err.resolved && (
                                <Badge variant="outline" className="bg-primary/10 text-primary">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mt-1.5">{err.message}</p>
                            {err.route && (
                              <p className="text-xs text-muted-foreground mt-0.5">Route: {err.route}</p>
                            )}
                            {err.case_id && (
                              <p className="text-xs text-muted-foreground">Case: {err.case_id.slice(0, 8)}…</p>
                            )}
                            {err.details && Object.keys(err.details).length > 0 && (
                              <pre className="text-[10px] bg-muted/50 rounded p-2 mt-2 overflow-x-auto max-w-full">
                                {JSON.stringify(err.details, null, 2)}
                              </pre>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(err.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!err.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(err.id)}
                            disabled={resolveError.isPending}
                            className="shrink-0"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformHealth;
