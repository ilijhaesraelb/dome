/**
 * ClientCommDialog — quick templated message to the client tied to a tax file.
 * Templates: missing-doc, clarification, ready-for-review, payment-due, completion.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { recordLifecycleEvent } from "@/lib/tax-pro/lifecycle";

const TEMPLATES: { key: string; label: string; body: (n: string) => string }[] = [
  { key: "missing_docs", label: "Missing documents", body: (n) => `Hi ${n}, we need a few more documents to continue your tax file. Please upload them at your earliest convenience.` },
  { key: "clarification", label: "Clarification needed", body: (n) => `Hi ${n}, we have a quick question about one of your entries before we proceed.` },
  { key: "ready_review", label: "Ready for your review", body: (n) => `Hi ${n}, your return is ready for your review. Please verify and confirm.` },
  { key: "payment_due", label: "Payment due", body: (n) => `Hi ${n}, your tax file is ready and payment is due to proceed with filing.` },
  { key: "complete", label: "Filing complete", body: (n) => `Hi ${n}, great news — your tax filing is complete. A copy is available in your portal.` },
];

const ClientCommDialog = ({ open, onClose, fileId, clientName }: { open: boolean; onClose: () => void; fileId: string; clientName: string }) => {
  const [tpl, setTpl] = useState<string>("missing_docs");
  const [body, setBody] = useState(TEMPLATES[0].body(clientName));
  const [sending, setSending] = useState(false);

  const pick = (k: string) => {
    setTpl(k);
    const t = TEMPLATES.find((x) => x.key === k)!;
    setBody(t.body(clientName));
  };

  const send = async () => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("case_messages").insert({
        case_id: fileId, // tax-file scoped message; reuses messaging table
        content: body,
        sender_id: user?.id,
        sender_name: user?.email ?? "Tax staff",
        sender_role: "practitioner",
      } as any);
      if (error) throw error;
      await recordLifecycleEvent(fileId, "client_message_sent", { template: tpl });
      toast.success("Message sent to client");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Could not send message");
    } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Message client</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <Button key={t.key} size="sm" variant={tpl === t.key ? "default" : "outline"} onClick={() => pick(t.key)}>{t.label}</Button>
            ))}
          </div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={send} disabled={sending || !body.trim()}>{sending ? "Sending…" : "Send"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default ClientCommDialog;