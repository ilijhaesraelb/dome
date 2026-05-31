import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const ProPaymentsTab = ({ fileId }: { fileId: string }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tax_payments").select("*").eq("tax_file_id", fileId).order("created_at", { ascending: false });
      setRows(data ?? []); setLoading(false);
    })();
  }, [fileId]);
  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;
  if (!rows.length) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No payments yet.</CardContent></Card>;
  return (
    <Card><CardContent className="p-3 space-y-2">
      {rows.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-sm">
          <div>
            <p className="font-medium">{p.service_code ?? "Service"}</p>
            <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold tabular-nums">${((p.amount_cents ?? 0) / 100).toFixed(2)} {p.currency ?? "USD"}</p>
            <Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge>
          </div>
        </div>
      ))}
    </CardContent></Card>
  );
};
export default ProPaymentsTab;