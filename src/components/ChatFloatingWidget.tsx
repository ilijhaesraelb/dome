import { lazy, Suspense } from "react";
import { MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

const AIAssistant = lazy(() => import("@/pages/portal/AIAssistant"));

const ChatFloatingWidget = () => {
  const { session, loading } = useAuth();

  if (loading || !session) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed right-4 bottom-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[0_20px_60px_rgba(15,23,42,0.2)] transition hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          aria-label="Open D.O.M.E. AI chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </DialogTrigger>

      <DialogContent className="h-[calc(100vh-100px)] max-w-4xl p-0 overflow-hidden">
        <Suspense fallback={<div className="flex h-full items-center justify-center bg-background p-6 text-sm text-muted-foreground">Loading D.O.M.E. AI…</div>}>
          <AIAssistant panelMode />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};

export default ChatFloatingWidget;
