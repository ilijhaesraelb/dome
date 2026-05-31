import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";

const ProAuditTab = ({ fileId }: { fileId: string }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tax_lifecycle_events").select("*").eq("tax_file_id", fileId).order("created_at", { ascending: false }).limit(200);
      setRows(data ?? []); setLoading(false);
    })();
  }, [fileId]);
  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;
  if (!rows.length) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No audit events yet.</CardContent></Card>;
  return (
    <Card><CardContent className="p-3 space-y-1.5">
      {rows.map((e) => (
        <div key={e.id} className="flex items-start gap-3 border-b border-border/40 py-2 text-xs last:border-0">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] capitalize">{String(e.event_type).replace(/_/g, " ")}</Badge>
              <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
            </div>
            {e.metadata && Object.keys(e.metadata).length > 0 && (
              <pre className="mt-1 overflow-auto rounded bg-muted/40 p-1.5 font-mono text-[10px]">{JSON.stringify(e.metadata, null, 2)}</pre>
            )}
          </div>
        </div>
      ))}
    </CardContent></Card>
  );
};
export default ProAuditTab;