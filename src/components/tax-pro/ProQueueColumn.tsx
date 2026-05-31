/**
 * ProQueueColumn — single column in the Drake-style intake queue board.
 */
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, FileText, User } from "lucide-react";
import type { ProTaxFile } from "@/hooks/useProTaxFiles";

interface Props {
  title: string;
  description: string;
  files: ProTaxFile[];
  tone?: "default" | "warn" | "ok";
}

const toneClasses = {
  default: "border-border",
  warn: "border-amber-500/40 bg-amber-500/5",
  ok: "border-emerald-500/40 bg-emerald-500/5",
};

const ProQueueColumn = ({ title, description, files, tone = "default" }: Props) => (
  <div className={`flex h-full flex-col rounded-lg border ${toneClasses[tone]} bg-card`}>
    <div className="border-b border-border p-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary" className="text-[10px]">{files.length}</Badge>
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
    </div>
    <ScrollArea className="flex-1">
      <div className="space-y-2 p-2">
        {files.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No files</p>
        )}
        {files.map((f) => (
          <Link
            key={f.id}
            to={`/tax/pro/file/${f.id}`}
            className="block rounded-md border border-border bg-background p-2.5 hover:border-primary/50 hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{f.client_name}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="capitalize">{f.client_type ?? "—"}</span>
                  <span>·</span>
                  <span>{f.filing_year ?? "—"}</span>
                </div>
              </div>
              {f.blockers > 0 && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" /> {f.blockers}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {f.forms.slice(0, 3).map((fc) => (
                <Badge key={fc} variant="outline" className="text-[10px] gap-1">
                  <FileText className="h-2.5 w-2.5" /> {fc.toUpperCase()}
                </Badge>
              ))}
              {f.forms.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{f.forms.length - 3}</span>
              )}
              {f.readiness_score != null && (
                <span className="ml-auto text-[10px] text-muted-foreground">{f.readiness_score}%</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </ScrollArea>
  </div>
);

export default ProQueueColumn;