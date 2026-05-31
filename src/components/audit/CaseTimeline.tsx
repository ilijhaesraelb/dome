import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, Upload, Send, Shield, UserCheck, FileDown,
  AlertTriangle, CheckCircle2, Edit, Clock, Users, Lock,
  Unlock, Eye, CreditCard, MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

const ACTION_ICONS: Record<string, typeof FileText> = {
  case_created: FileText,
  case_updated: Edit,
  case_assigned: Users,
  case_transferred: Users,
  case_closed: Lock,
  case_reopened: Unlock,
  form_created: FileText,
  section_saved: Edit,
  field_changed: Edit,
  form_submitted_for_review: Send,
  form_approved: CheckCircle2,
  form_returned: AlertTriangle,
  form_export_requested: FileDown,
  form_export_completed: FileDown,
  form_export_failed: AlertTriangle,
  file_uploaded: Upload,
  file_replaced: Upload,
  file_deleted: AlertTriangle,
  signature_created: Shield,
  signature_attached: Shield,
  id_uploaded: UserCheck,
  id_verified: UserCheck,
  payment_succeeded: CreditCard,
  payment_failed: AlertTriangle,
  record_finalized: Lock,
  record_reopened: Unlock,
  record_lock_changed: Lock,
  message_sent: MessageSquare,
  request_created: Send,
};

const MODULE_COLORS: Record<string, string> = {
  auth: "bg-muted text-muted-foreground",
  cases: "bg-primary/10 text-primary",
  forms: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  documents: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  signatures: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  identity: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  payments: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  exports: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
};

interface CaseTimelineProps {
  caseId: string;
  maxItems?: number;
}

export default function CaseTimeline({ caseId, maxItems = 50 }: CaseTimelineProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ["audit-timeline", caseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("audit_events")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(maxItems);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Case Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!events?.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Case Timeline</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No events recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" /> Case Timeline
          <Badge variant="secondary" className="ml-auto">{events.length} events</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative pl-6 border-l-2 border-border space-y-4">
            {events.map((event: any) => {
              const Icon = ACTION_ICONS[event.action_type] || Eye;
              const moduleColor = MODULE_COLORS[event.module] || "bg-muted text-muted-foreground";
              return (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <Icon className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-card border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{event.human_label || event.action_type}</p>
                      {!event.success && (
                        <Badge variant="destructive" className="text-[10px] shrink-0">Failed</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge className={`${moduleColor} text-[10px]`}>{event.module}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(event.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      {event.user_role && (
                        <span className="text-[10px] text-muted-foreground">· {event.user_role}</span>
                      )}
                    </div>
                    {event.error_details && (
                      <p className="text-xs text-destructive mt-1">{event.error_details}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
