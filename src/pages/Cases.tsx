import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import { useCases, useCreateCase } from "@/hooks/useCases";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/hooks/useT";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground", medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning", urgent: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  draft: "Draft", in_progress: "In Progress", waiting_client: "Waiting Client",
  ready_for_review: "Ready for Review", submitted: "Submitted", approved: "Approved",
  denied: "Denied", closed: "Closed", rfe_issued: "RFE Issued", rfe_response_sent: "RFE Sent",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", in_progress: "bg-primary/10 text-primary",
  waiting_client: "bg-warning/10 text-warning", ready_for_review: "bg-accent text-accent-foreground",
  submitted: "bg-primary/10 text-primary", approved: "bg-success/10 text-success",
  denied: "bg-destructive/10 text-destructive", closed: "bg-muted text-muted-foreground",
  rfe_issued: "bg-warning/10 text-warning", rfe_response_sent: "bg-primary/10 text-primary",
};

const Cases = () => {
  const t = useT();
  const [search, setSearch] = useState("");
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [newCaseType, setNewCaseType] = useState("Adjustment of Status");
  const [newVisaType, setNewVisaType] = useState("Family-Based");
  const [newPriority, setNewPriority] = useState<string>("medium");
  const { data: cases, isLoading } = useCases();
  const createCase = useCreateCase();
  const { toast } = useToast();

  const filtered = (cases || []).filter(c =>
    c.case_number.toLowerCase().includes(search.toLowerCase()) ||
    c.case_type.toLowerCase().includes(search.toLowerCase()) ||
    (c.visa_type || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateCase = async () => {
    try {
      await createCase.mutateAsync({
        case_type: newCaseType,
        visa_type: newVisaType,
        priority: newPriority as any,
      });
      toast({ title: "Case created successfully" });
      setNewCaseOpen(false);
    } catch (err: any) {
      toast({ title: "Error creating case", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{t("cases.title")}</h1>
          <p className="text-muted-foreground mt-1">{cases?.length || 0} total cases</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setNewCaseOpen(true)}>
          <Plus className="w-4 h-4" /> New Case
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by case number or type..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2 hidden sm:flex"><Filter className="w-4 h-4" /> Filters</Button>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {search ? "No cases match your search." : "No cases yet. Create your first case to get started."}
            </CardContent>
          </Card>
        ) : filtered.map((c) => (
          <Link key={c.id} to={`/cases/${c.id}`}>
            <Card className="hover:shadow-md transition-all hover:border-primary/20">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground shrink-0">
                    {c.case_number.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.case_number}</p>
                    <p className="text-sm text-muted-foreground truncate">{c.case_type} · {c.visa_type || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {c.deadline && <span className="text-sm text-muted-foreground hidden lg:block">Due {c.deadline}</span>}
                  <Badge variant="outline" className={priorityColors[c.priority]}>{c.priority}</Badge>
                  <Badge variant="outline" className={statusColors[c.status] || ""}>{statusLabels[c.status] || c.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* New Case Dialog */}
      <Dialog open={newCaseOpen} onOpenChange={setNewCaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Create New Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Case Type</Label>
              <Select value={newCaseType} onValueChange={setNewCaseType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adjustment of Status">Adjustment of Status</SelectItem>
                  <SelectItem value="National Interest Waiver">National Interest Waiver</SelectItem>
                  <SelectItem value="Extraordinary Ability">Extraordinary Ability</SelectItem>
                  <SelectItem value="H-1B Specialty Occupation">H-1B Specialty Occupation</SelectItem>
                  <SelectItem value="Intracompany Transferee">Intracompany Transferee</SelectItem>
                  <SelectItem value="Naturalization">Naturalization</SelectItem>
                  <SelectItem value="Family-Based Petition">Family-Based Petition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visa Type</Label>
              <Input value={newVisaType} onChange={(e) => setNewVisaType(e.target.value)} placeholder="e.g. Family-Based, EB-2 NIW" />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCaseOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCase} disabled={createCase.isPending}>
              {createCase.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cases;
