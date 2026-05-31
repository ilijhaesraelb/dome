import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";

const ProDocumentsTab = ({ fileId }: { fileId: string; clientId?: string }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("tax_documents") as any)
        .select("*, tax_document_analysis ( detected_form_type, detected_tax_year, confidence_score, analysis_status )")
        .eq("tax_file_id", fileId)
        .order("created_at", { ascending: false });
      setDocs(data ?? []);
      setLoading(false);
    })();
  }, [fileId]);

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;
  if (!docs.length) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No documents uploaded yet.</CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Uploaded documents</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {docs.map((d) => {
          const ana = Array.isArray(d.tax_document_analysis) ? d.tax_document_analysis[0] : d.tax_document_analysis;
          return (
            <div key={d.id} className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.source_filename || d.document_type}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{d.document_type ?? "unknown"}</Badge>
                  {d.tax_year && <span>· TY {d.tax_year}</span>}
                  {ana?.detected_form_type && <span>· detected {ana.detected_form_type}</span>}
                  {typeof ana?.confidence_score === "number" && <span>· {Math.round(ana.confidence_score * 100)}%</span>}
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] capitalize">{ana?.analysis_status ?? d.upload_status ?? "pending"}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
export default ProDocumentsTab;