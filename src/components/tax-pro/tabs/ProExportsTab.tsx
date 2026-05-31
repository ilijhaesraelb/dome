import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2 } from "lucide-react";

const ProExportsTab = ({ fileId, caps }: { fileId: string; caps: any }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tax_exports").select("*").eq("tax_file_id", fileId).order("created_at", { ascending: false });
      setRows(data ?? []); setLoading(false);
    })();
  }, [fileId]);
  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;
  return (
    <div className="space-y-2">
      {caps.canExport && (
        <Card><CardContent className="flex items-center justify-between p-3">
          <div><p className="text-sm font-medium">Generate professional export packet</p><p className="text-[11px] text-muted-foreground">Bundles all forms, supporting docs and audit trail.</p></div>
          <Button size="sm"><Download className="mr-1 h-3.5 w-3.5" /> Export</Button>
        </CardContent></Card>
      )}
      {rows.length === 0 && <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No exports yet.</CardContent></Card>}
      {rows.map((e) => (
        <Card key={e.id}><CardContent className="flex items-center justify-between p-3">
          <div>
            <p className="text-sm font-medium capitalize">{String(e.export_type).replace(/_/g, " ")}</p>
            <p className="text-[11px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
          </div>
          <Badge variant="secondary" className="text-[10px] capitalize">{e.export_status}</Badge>
        </CardContent></Card>
      ))}
    </div>
  );
};
export default ProExportsTab;