/**
 * FieldDrilldownDialog
 *
 * Click-through drilldown for a single verification-flagged field.
 * Visualises the official widget rect, the estimated stamp rect produced
 * by the renderer, and lists every other widget on the same PDF page so
 * the operator can see the surrounding coordinate-map context.
 */
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { I485_OVERLAY_FIELDS } from "@/lib/i485-overlay-coords";
import { TEMPLATE_OVERLAY_COORDS } from "@/lib/pdf-template-coordinates";
import type {
  Rect,
  VerificationField,
} from "@/lib/ufe/export-verification";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formCode: string | null;
  field: VerificationField | null;
}

/** Standard US-Letter PDF media box (USCIS forms). */
const PAGE_W = 612;
const PAGE_H = 792;
/** Visual canvas size in CSS px. */
const CANVAS_W = 520;
const CANVAS_H = (PAGE_H / PAGE_W) * CANVAS_W;

interface PageWidget {
  name: string;
  rect: Rect;
  page0: number;
}

function widgetsForPage(
  formCode: string,
  page0: number,
): PageWidget[] {
  if (formCode === "I-485") {
    return I485_OVERLAY_FIELDS.filter((f) => f.page === page0).map((f) => ({
      name: f.name,
      rect: f.rect as Rect,
      page0: f.page,
    }));
  }
  const table = TEMPLATE_OVERLAY_COORDS[formCode];
  if (!table) return [];
  return Object.entries(table)
    .filter(([, c]) => c.page === page0)
    .map(([name, c]) => ({ name, rect: c.rect as Rect, page0: c.page }));
}

/** Convert PDF user-space (lower-left origin) → CSS px (top-left origin). */
function toCss(rect: Rect) {
  const [x0, y0, x1, y1] = rect;
  const sx = CANVAS_W / PAGE_W;
  const sy = CANVAS_H / PAGE_H;
  return {
    left: x0 * sx,
    top: (PAGE_H - y1) * sy,
    width: (x1 - x0) * sx,
    height: (y1 - y0) * sy,
  };
}

const STATUS_BADGE: Record<VerificationField["status"], string> = {
  ok: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  error: "bg-destructive/10 text-destructive border-destructive/30",
  unmapped: "bg-muted text-muted-foreground border-border",
};

const FieldDrilldownDialog = ({ open, onOpenChange, formCode, field }: Props) => {
  const page0 = field?.page != null ? field.page - 1 : null;

  const pageWidgets = useMemo(() => {
    if (!formCode || page0 == null) return [];
    return widgetsForPage(formCode, page0);
  }, [formCode, page0]);

  if (!field || !formCode) return null;

  const widget = field.widgetRect;
  const stamp = field.stampRect;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="truncate">{field.label}</span>
            <Badge
              variant="outline"
              className={cn("text-[10px] uppercase", STATUS_BADGE[field.status])}
            >
              {field.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {formCode} · {field.page ? `Page ${field.page}` : "Page —"} ·{" "}
            <span className="font-mono">{field.widgetName ?? "unmapped"}</span>
            {" — "}
            {field.message}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-2">
            {/* Numeric details */}
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="border rounded-md p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  Widget rect (official)
                </div>
                <div className="font-mono text-xs">
                  {widget
                    ? `[${widget[0].toFixed(1)}, ${widget[1].toFixed(1)}, ${widget[2].toFixed(1)}, ${widget[3].toFixed(1)}]`
                    : "—"}
                </div>
                {widget && (
                  <div className="mt-1 text-muted-foreground">
                    {(widget[2] - widget[0]).toFixed(1)} ×{" "}
                    {(widget[3] - widget[1]).toFixed(1)} pt
                  </div>
                )}
              </div>
              <div className="border rounded-md p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  Stamp rect (estimated)
                </div>
                <div className="font-mono text-xs">
                  {stamp
                    ? `[${stamp[0].toFixed(1)}, ${stamp[1].toFixed(1)}, ${stamp[2].toFixed(1)}, ${stamp[3].toFixed(1)}]`
                    : "—"}
                </div>
                {stamp && (
                  <div className="mt-1 text-muted-foreground">
                    {(stamp[2] - stamp[0]).toFixed(1)} ×{" "}
                    {(stamp[3] - stamp[1]).toFixed(1)} pt
                  </div>
                )}
              </div>
            </div>

            {/* Overflow breakdown */}
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              {(["left", "right", "top", "bottom"] as const).map((side) => {
                const v = field.overflow[side];
                return (
                  <div
                    key={side}
                    className={cn(
                      "border rounded-md p-2 text-center",
                      v > 0
                        ? "border-destructive/40 bg-destructive/5"
                        : "bg-muted/20",
                    )}
                  >
                    <div className="text-[9px] uppercase text-muted-foreground">
                      {side}
                    </div>
                    <div className="font-mono">{v.toFixed(2)}pt</div>
                  </div>
                );
              })}
            </div>

            {/* Visual page context */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                Page context — {pageWidgets.length} widget
                {pageWidgets.length === 1 ? "" : "s"} on this page
              </div>
              <div
                className="relative mx-auto border rounded-md bg-background shadow-inner"
                style={{ width: CANVAS_W, height: CANVAS_H }}
              >
                {pageWidgets.map((w) => {
                  const css = toCss(w.rect);
                  const isSelected = w.name === field.widgetName;
                  return (
                    <div
                      key={w.name}
                      title={w.name}
                      className={cn(
                        "absolute border",
                        isSelected
                          ? "border-primary bg-primary/20 z-10"
                          : "border-muted-foreground/20 bg-muted-foreground/5",
                      )}
                      style={css}
                    />
                  );
                })}
                {widget && stamp && (
                  <div
                    className="absolute border border-dashed border-destructive bg-destructive/30 z-20 pointer-events-none"
                    style={toCss(stamp)}
                  />
                )}
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-2 border border-primary bg-primary/20" />
                  Selected widget
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-2 border border-dashed border-destructive bg-destructive/30" />
                  Estimated stamp
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-2 border border-muted-foreground/20 bg-muted-foreground/5" />
                  Other widgets
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FieldDrilldownDialog;