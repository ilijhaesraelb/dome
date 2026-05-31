import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, FileDown, Eye, Clock, Shield } from "lucide-react";
import { format } from "date-fns";

interface AuditLogViewerProps {
  caseId?: string;
  userId?: string;
  showFilters?: boolean;
  maxItems?: number;
}

export default function AuditLogViewer({
  caseId,
  userId,
  showFilters = true,
  maxItems = 100,
}: AuditLogViewerProps) {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [view, setView] = useState<"table" | "timeline">("table");

  const { data: events, isLoading } = useQuery({
    queryKey: ["audit-log", caseId, userId, moduleFilter, actionFilter, searchTerm],
    queryFn: async () => {
      let query = (supabase as any)
        .from("audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(maxItems);

      if (caseId) query = query.eq("case_id", caseId);
      if (userId) query = query.eq("user_id", userId);
      if (moduleFilter !== "all") query = query.eq("module", moduleFilter);
      if (actionFilter !== "all") query = query.eq("action_type", actionFilter);
      if (searchTerm) query = query.ilike("human_label", `%${searchTerm}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleExportLog = () => {
    if (!events) return;
    const csv = [
      ["Timestamp", "Module", "Action", "Label", "Success", "User Role"].join(","),
      ...events.map((e: any) =>
        [
          e.created_at,
          e.module,
          e.action_type,
          `"${(e.human_label || "").replace(/"/g, '""')}"`,
          e.success,
          e.user_role || "",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" /> Audit Log
            {events && <Badge variant="secondary">{events.length}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="h-7">
                <TabsTrigger value="table" className="text-xs h-6 px-2">Table</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs h-6 px-2">Timeline</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleExportLog}>
              <FileDown className="w-3 h-3" /> Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {["auth","cases","forms","documents","signatures","identity","payments","exports","tax","nonprofit","affiliates","admin"].map(m =>
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="record_finalized">Finalized</SelectItem>
                <SelectItem value="record_reopened">Reopened</SelectItem>
                <SelectItem value="signature_created">Signatures</SelectItem>
                <SelectItem value="form_export_completed">Exports</SelectItem>
                <SelectItem value="payment_succeeded">Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {view === "table" ? (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Module</TableHead>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm py-8">Loading...</TableCell></TableRow>
                ) : !events?.length ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm py-8 text-muted-foreground">No audit events found</TableCell></TableRow>
                ) : (
                  events.map((event: any) => (
                    <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvent(event)}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{event.module}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[250px] truncate">
                        {event.human_label || event.action_type}
                      </TableCell>
                      <TableCell>
                        {event.success ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">OK</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Failed</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-6 w-6">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative pl-6 border-l-2 border-border space-y-3">
              {events?.map((event: any) => (
                <div key={event.id} className="relative cursor-pointer" onClick={() => setSelectedEvent(event)}>
                  <div className="absolute -left-[31px] top-1 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <Clock className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-card border rounded-lg p-2.5 hover:bg-muted/30 transition-colors">
                    <p className="text-xs font-medium">{event.human_label || event.action_type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{event.module}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(event.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Audit Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground text-xs">Event ID</span><p className="text-xs font-mono">{selectedEvent.id}</p></div>
                <div><span className="text-muted-foreground text-xs">Timestamp</span><p className="text-xs">{format(new Date(selectedEvent.created_at), "PPpp")}</p></div>
                <div><span className="text-muted-foreground text-xs">Module</span><p><Badge variant="outline" className="text-xs">{selectedEvent.module}</Badge></p></div>
                <div><span className="text-muted-foreground text-xs">Action</span><p className="text-xs">{selectedEvent.action_type}</p></div>
                <div><span className="text-muted-foreground text-xs">Role</span><p className="text-xs">{selectedEvent.user_role || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Status</span>
                  <p>{selectedEvent.success
                    ? <Badge className="bg-green-100 text-green-800 text-[10px]">Success</Badge>
                    : <Badge variant="destructive" className="text-[10px]">Failed</Badge>}</p>
                </div>
              </div>
              <div><span className="text-muted-foreground text-xs">Label</span><p className="text-xs">{selectedEvent.human_label}</p></div>
              {selectedEvent.error_details && (
                <div><span className="text-muted-foreground text-xs">Error</span><p className="text-xs text-destructive">{selectedEvent.error_details}</p></div>
              )}
              {selectedEvent.before_state && (
                <div><span className="text-muted-foreground text-xs">Before State</span>
                  <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(selectedEvent.before_state, null, 2)}</pre>
                </div>
              )}
              {selectedEvent.after_state && (
                <div><span className="text-muted-foreground text-xs">After State</span>
                  <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(selectedEvent.after_state, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
