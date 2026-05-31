import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileText, Shield, BookOpen, CheckCircle2, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportPacketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseNumber: string;
  caseType: string;
  formsCount: number;
  docsCount: number;
}

const ExportPacketDialog = ({ open, onOpenChange, caseNumber, caseType, formsCount, docsCount }: ExportPacketDialogProps) => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    setProcessing(true);
    // Stripe placeholder
    await new Promise(r => setTimeout(r, 2000));
    toast({ title: "Payment coming soon", description: "Export will be available when Stripe is connected." });
    setProcessing(false);
  };

  const items = [
    { icon: FileText, label: "Completed forms", detail: `${formsCount} form(s)` },
    { icon: Shield, label: "Evidence index", detail: `${docsCount} document(s)` },
    { icon: BookOpen, label: "Cover letter", detail: "Auto-generated" },
    { icon: CheckCircle2, label: "USCIS filing instructions", detail: "Step-by-step" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Export Submission Packet
          </DialogTitle>
          <DialogDescription>
            {caseNumber} · {caseType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <item.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm flex-1">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.detail}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Export fee</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">$9.99</span>
              </div>
            </div>

            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-11 text-base font-semibold gap-2"
              onClick={handlePurchase}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Purchase & Download
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Stripe. Download available immediately after purchase.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportPacketDialog;
