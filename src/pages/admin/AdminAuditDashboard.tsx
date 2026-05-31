import AuditLogViewer from "@/components/audit/AuditLogViewer";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Activity, Lock, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const AdminAuditDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["audit-stats"],
    queryFn: async () => {
      const [eventsRes, lockRes, sigRes] = await Promise.all([
        (supabase as any).from("audit_events").select("id", { count: "exact", head: true }),
        (supabase as any).from("audit_events").select("id", { count: "exact", head: true }).eq("action_type", "record_finalized"),
        (supabase as any).from("audit_events").select("id", { count: "exact", head: true }).eq("action_type", "signature_created"),
      ]);
      return {
        total: eventsRes.count || 0,
        finalized: lockRes.count || 0,
        signatures: sigRes.count || 0,
      };
    },
  });

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div>
        <BackButton />
        <h1 className="text-2xl font-display font-bold mt-2 flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          Audit Trail Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and search all platform audit events, version history, and finalization records.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.finalized || 0}</p>
              <p className="text-xs text-muted-foreground">Finalized Records</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.signatures || 0}</p>
              <p className="text-xs text-muted-foreground">Signature Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Audit Log */}
      <AuditLogViewer showFilters={true} maxItems={200} />
    </div>
  );
};

export default AdminAuditDashboard;
