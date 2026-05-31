import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, CheckCircle, XCircle, UserPlus, Loader2, Clock, Globe } from "lucide-react";
import { useIntakeRequests, useUpdateIntakeStatus, useFirmMembers, useFirm } from "@/hooks/useFirm";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  new: "bg-secondary/15 text-secondary",
  reviewing: "bg-primary/10 text-primary",
  accepted: "bg-green-100 text-green-700",
  assigned: "bg-blue-100 text-blue-700",
  declined: "bg-destructive/10 text-destructive",
  consultation_scheduled: "bg-purple-100 text-purple-700",
  needs_info: "bg-amber-100 text-amber-700",
};

const urgencyColors: Record<string, string> = {
  low: "text-muted-foreground",
  normal: "text-foreground",
  high: "text-amber-600",
  urgent: "text-destructive font-bold",
};

const FirmIntakeQueue = () => {
  const { firmId } = useFirm();
  const { data: requests = [], isLoading } = useIntakeRequests(firmId);
  const { data: members = [] } = useFirmMembers(firmId);
  const updateStatus = useUpdateIntakeStatus();
  const { toast } = useToast();

  const handleAction = async (id: string, status: string, assignedTo?: string) => {
    try {
      await updateStatus.mutateAsync({ id, status, assigned_to: assignedTo });
      toast({ title: "Intake updated", description: `Status changed to ${status}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const newRequests = requests.filter(r => r.status === "new");
  const otherRequests = requests.filter(r => r.status !== "new");

  return (
    <div className="space-y-4">
      {/* New Requests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Inbox className="w-4 h-4 text-secondary" />
            New Requests ({newRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {newRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No new intake requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newRequests.map(req => (
                <div key={req.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{req.client_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {req.client_email && <span>{req.client_email}</span>}
                        {req.client_phone && <span>{req.client_phone}</span>}
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{req.preferred_language?.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={cn("text-[10px]", statusColors[req.status])}>{req.status}</Badge>
                      <p className={cn("text-xs mt-1", urgencyColors[req.urgency || "normal"])}>{req.urgency}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
                    <Badge variant="outline" className="text-[10px] ml-2">{req.case_type || "General"}</Badge>
                    <Badge variant="outline" className="text-[10px]">Source: {req.source}</Badge>
                  </div>

                  {req.notes && <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">{req.notes}</p>}

                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" className="text-xs gap-1" onClick={() => handleAction(req.id, "accepted")}>
                      <CheckCircle className="w-3 h-3" /> Accept
                    </Button>
                    <Select onValueChange={v => handleAction(req.id, "assigned", v)}>
                      <SelectTrigger className="h-8 text-xs w-40">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.user_id}>
                            {(m as any).profiles?.display_name || m.user_id.slice(0, 8)} ({m.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleAction(req.id, "needs_info")}>
                      Request Info
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-destructive gap-1" onClick={() => handleAction(req.id, "declined")}>
                      <XCircle className="w-3 h-3" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Requests */}
      {otherRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Previous Requests ({otherRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left">
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Client</th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Date</th>
                </tr></thead>
                <tbody className="divide-y divide-border/50">
                  {otherRequests.map(req => (
                    <tr key={req.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{req.client_name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{req.case_type || "General"}</td>
                      <td className="px-3 py-3"><Badge className={cn("text-[10px]", statusColors[req.status])}>{req.status}</Badge></td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">{format(new Date(req.created_at), "MMM d")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FirmIntakeQueue;
