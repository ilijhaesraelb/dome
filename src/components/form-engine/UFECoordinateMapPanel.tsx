/**
 * UFECoordinateMapPanel
 *
 * Review-screen panel that surfaces the coordinate-overlay positions
 * for every UFE question on the form. Lets the user see exactly where
 * each answer will land on the official PDF page, and which questions
 * are still unmapped (gap visibility for the rebuild).
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { iterateQuestions, type UFEForm } from "@/lib/ufe/schema";
import { I485_OVERLAY_FIELDS } from "@/lib/i485-overlay-coords";
import { TEMPLATE_OVERLAY_COORDS, type TemplateOverlayField } from "@/lib/pdf-template-coordinates";
import { validateMapping } from "@/lib/ufe/validator";

interface Props {
  form: UFEForm;
  values: Record<string, unknown>;
}

const i485OverlayIndex = new Map(I485_OVERLAY_FIELDS.map((f) => [f.name, f]));

/** Resolve a widget's page (1-indexed) and rect for both AcroForm and overlay forms. */
function resolveWidget(
  formCode: string,
  widgetName: string,
): { page: number; rect: [number, number, number, number] } | null {
  // I-485 uses the dedicated overlay table.
  if (formCode === "I-485") {
    const o = i485OverlayIndex.get(widgetName);
    return o ? { page: o.page + 1, rect: o.rect } : null;
  }
  // Everything else uses the shared AcroForm coordinate table.
  const table = TEMPLATE_OVERLAY_COORDS[formCode];
  const c: TemplateOverlayField | undefined = table?.[widgetName];
  return c ? { page: c.page + 1, rect: c.rect } : null;
}

const UFECoordinateMapPanel = ({ form, values }: Props) => {
  const [open, setOpen] = useState(false);
  const [showUnmapped, setShowUnmapped] = useState(false);

  const rows = useMemo(() => {
    const out: {
      key: string; label: string; part: number; item: string;
      page: number | null; rect: [number, number, number, number] | null;
      widgetName: string | null; mapped: boolean; answered: boolean;
      mappingKind: "overlay" | "acroform" | "unmapped";
    }[] = [];
    for (const q of iterateQuestions(form)) {
      const value = values[q.key];
      const answered = value !== undefined && value !== null && String(value).trim() !== "";
      if (q.mapping.kind === "overlay" || q.mapping.kind === "acroform") {
        const widgetName = q.mapping.kind === "overlay" ? q.mapping.coordKey : q.mapping.pdfFieldName;
        const w = resolveWidget(form.code, widgetName);
        out.push({
          key: q.key, label: q.label,
          part: q.officialRef.part, item: q.officialRef.item,
          page: w ? w.page : (q.officialRef.page || null),
          rect: w ? w.rect : null,
          widgetName,
          mapped: !!widgetName, answered,
          mappingKind: q.mapping.kind,
        });
      } else {
        out.push({
          key: q.key, label: q.label,
          part: q.officialRef.part, item: q.officialRef.item,
          page: null, rect: null, widgetName: null, mapped: false, answered,
          mappingKind: "unmapped",
        });
      }
    }
    return out;
  }, [form, values]);

  const report = useMemo(() => validateMapping(form, values), [form, values]);
  const visible = showUnmapped ? rows : rows.filter((r) => r.mapped);
  const grouped = useMemo(() => {
    const m = new Map<number, typeof visible>();
    for (const r of visible) {
      const key = r.part;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    return [...m.entries()].sort(([a], [b]) => a - b);
  }, [visible]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="py-3 px-5">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Official Form Coordinate Map ({form.code})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {report.mappedQuestions}/{report.totalQuestions} mapped
            </Badge>
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>
      </CardHeader>
      {open && (
        <CardContent className="px-5 pb-4 pt-0 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Each answered field will be stamped onto the official I-485 PDF
              at the position shown below.
            </span>
            <Button size="sm" variant="ghost" className="h-7 text-xs"
              onClick={() => setShowUnmapped(!showUnmapped)}>
              {showUnmapped ? "Hide unmapped" : "Show unmapped"}
            </Button>
          </div>

          {grouped.map(([partNum, items]) => (
            <div key={partNum} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/40 px-3 py-1.5 text-xs font-semibold">
                Part {partNum} <span className="text-muted-foreground font-normal">({items.length} fields)</span>
              </div>
              <div className="divide-y">
                {items.map((r) => (
                  <div key={r.key} className="px-3 py-2 grid grid-cols-12 gap-2 text-[11px] items-center">
                    <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                      {r.answered ? (
                        <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                      ) : (
                        <AlertCircle className={cn("w-3 h-3 shrink-0", r.mapped ? "text-muted-foreground/40" : "text-destructive/60")} />
                      )}
                      <span className="truncate">{r.label}</span>
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {r.mapped ? (
                        <span>
                          {r.page ? `Pg ${r.page}` : "Pg —"} · Item {r.item}
                          <Badge variant="outline" className="ml-1 px-1 py-0 text-[9px] uppercase">
                            {r.mappingKind === "overlay" ? "Overlay" : "AcroForm"}
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-destructive">Unmapped</span>
                      )}
                    </div>
                    <div className="col-span-3 font-mono text-[10px] text-muted-foreground truncate">
                      {r.widgetName ?? "—"}
                    </div>
                    <div className="col-span-2 font-mono text-[10px] text-muted-foreground">
                      {r.rect
                        ? `(${r.rect[0].toFixed(0)},${r.rect[1].toFixed(0)})`
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {report.unmappedRequired.length > 0 && (
            <div className="text-[11px] text-destructive bg-destructive/5 border border-destructive/20 rounded p-2">
              {report.unmappedRequired.length} required field
              {report.unmappedRequired.length === 1 ? "" : "s"} still need overlay coordinates
              before official-form export will be allowed.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default UFECoordinateMapPanel;