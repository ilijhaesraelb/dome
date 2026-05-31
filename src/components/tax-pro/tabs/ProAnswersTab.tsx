import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const ProAnswersTab = ({ fileId }: { fileId: string; caps?: any }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tax_field_values")
        .select("id, field_key, value, source_type, review_status, section_key")
        .eq("tax_file_id", fileId)
        .order("section_key");
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [fileId]);

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  const filtered = rows.filter((r) => !q || r.field_key.toLowerCase().includes(q.toLowerCase()));
  const grouped = new Map<string, any[]>();
  filtered.forEach((r) => {
    const k = r.section_key ?? "uncategorized";
    grouped.set(k, [...(grouped.get(k) ?? []), r]);
  });

  return (
    <div className="space-y-3">
      <Input placeholder="Filter by field key…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 max-w-sm" />
      {Array.from(grouped.entries()).map(([section, items]) => (
        <Card key={section}>
          <CardContent className="p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section}</p>
            <div className="space-y-1">
              {items.map((r) => (
                <div key={r.id} className="grid grid-cols-12 items-center gap-2 border-b border-border/40 py-1 text-xs last:border-0">
                  <code className="col-span-5 truncate font-mono">{r.field_key}</code>
                  <span className="col-span-4 truncate font-medium">{r.value ?? "—"}</span>
                  <Badge variant="outline" className="col-span-2 justify-self-center text-[10px] capitalize">{r.source_type?.replace(/_/g, " ")}</Badge>
                  <Badge variant="secondary" className="col-span-1 justify-self-end text-[9px] capitalize">{(r.review_status ?? "—").replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
export default ProAnswersTab;