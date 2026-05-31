import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Lock, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface PostFinalizationWarningProps {
  open: boolean;
  onClose: () => void;
  onConfirmReopen: (reason: string) => void;
  recordType: string;
  finalizedDate?: string;
  finalizedBy?: string;
}

export default function PostFinalizationWarning({
  open,
  onClose,
  onConfirmReopen,
  recordType,
  finalizedDate,
  finalizedBy,
}: PostFinalizationWarningProps) {
  const [reason, setReason] = useState("");

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Lock className="w-5 h-5" /> Finalized Record
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  This {recordType} was finalized
                  {finalizedDate && ` on ${finalizedDate}`}
                  {finalizedBy && ` by ${finalizedBy}`}.
                  Any reopening or changes will be <strong>permanently logged</strong> in the audit trail.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Reason for reopening *</label>
                <Textarea
                  placeholder="Explain why this record needs to be reopened..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 text-sm"
                  rows={3}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => { onConfirmReopen(reason); setReason(""); }}
            disabled={!reason.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Request Unlock / Reopen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
