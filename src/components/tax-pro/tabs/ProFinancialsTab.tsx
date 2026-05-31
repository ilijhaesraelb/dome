import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil } from "lucide-react";
import FinancialsEditor from "@/components/tax-pro/FinancialsEditor";

const ProFinancialsTab = ({ fileId, caps }: { fileId: string; caps: any }) => {
  const [stmts, setStmts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tax_financial_statements")
      .select("*")
      .eq("tax_file_id", fileId)
      .order("statement_year", { ascending: false });
    setStmts(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [fileId]);

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  const summarize = (s: any) => {
    const lines = Array.isArray(s.statement_data_json?.lines) ? s.statement_data_json.lines : [];
    const totals = (s.statement_data_json?.totals ?? {}) as Record<string, number>;
    return { lineCount: lines.length, totals };
  };

  return (
    <div className="space-y-3">
      {stmts.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No financial statements generated yet.</CardContent></Card>}
      {stmts.map((s) => {
        const { lineCount, totals } = summarize(s);
        return (
          <Card key={s.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base capitalize">
                {String(s.statement_type).replace(/_/g, " ")} · {s.statement_year}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] capitalize">{s.status}</Badge>
                {caps.canReview && (
                  <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat k="Lines" v={String(lineCount)} />
                {Object.entries(totals).slice(0, 3).map(([k, v]) => (
                  <Stat key={k} k={k.replace(/_/g, " ")} v={`$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {editing && (
        <FinancialsEditor
          open={!!editing}
          onClose={() => setEditing(null)}
          statement={editing}
          caps={caps}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
};

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div className="rounded-md border border-border bg-muted/30 p-2">
    <p className="text-[10px] uppercase text-muted-foreground">{k}</p>
    <p className="text-sm font-semibold">{v}</p>
  </div>
);

export default ProFinancialsTab;