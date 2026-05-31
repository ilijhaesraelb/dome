import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useT } from "@/hooks/useT";

type ParticipantStatus = "onboarding" | "active" | "waiting_on_documents" | "ready_for_review" | "referred_out" | "completed" | "inactive";

const statusColors: Record<ParticipantStatus, string> = {
  onboarding: "bg-blue-100 text-blue-700", active: "bg-green-100 text-green-700", waiting_on_documents: "bg-yellow-100 text-yellow-700",
  ready_for_review: "bg-purple-100 text-purple-700", referred_out: "bg-orange-100 text-orange-700", completed: "bg-emerald-100 text-emerald-700", inactive: "bg-gray-100 text-gray-500",
};

const mockParticipants = [
  { id: "1", first_name: "Maria", last_name: "Garcia", preferred_language: "es", status: "active" as ParticipantStatus, readiness_score: 72, documents_uploaded: 8, documents_required: 12, next_milestone: "Civics Test Prep", tags: ["citizenship"] },
  { id: "2", first_name: "Carlos", last_name: "Rodriguez", preferred_language: "es", status: "waiting_on_documents" as ParticipantStatus, readiness_score: 45, documents_uploaded: 3, documents_required: 10, next_milestone: "Document Collection", tags: ["integration"] },
  { id: "3", first_name: "Fatima", last_name: "Al-Rashid", preferred_language: "ar", status: "ready_for_review" as ParticipantStatus, readiness_score: 88, documents_uploaded: 11, documents_required: 12, next_milestone: "Final Review", tags: ["citizenship", "legal-orientation"] },
  { id: "4", first_name: "Wei", last_name: "Chen", preferred_language: "zh", status: "onboarding" as ParticipantStatus, readiness_score: 15, documents_uploaded: 1, documents_required: 8, next_milestone: "Intake Complete", tags: ["entrepreneurship"] },
  { id: "5", first_name: "Jean-Pierre", last_name: "Duval", preferred_language: "fr", status: "completed" as ParticipantStatus, readiness_score: 100, documents_uploaded: 12, documents_required: 12, next_milestone: "Completed", tags: ["citizenship"] },
  { id: "6", first_name: "Ana", last_name: "Santos", preferred_language: "pt", status: "active" as ParticipantStatus, readiness_score: 61, documents_uploaded: 6, documents_required: 10, next_milestone: "Interview Prep", tags: ["integration", "entrepreneurship"] },
];

const langLabels: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", fr: "French", zh: "Mandarin", ar: "Arabic", ht: "Haitian Creole" };

const ParticipantManagement = () => {
  const t = useT();
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center gap-3">
        <Users className="w-5 h-5 text-warning" />
        <div>
          <p className="font-semibold text-sm">Preview Mode — Coming Soon</p>
          <p className="text-xs text-muted-foreground">This screen shows sample data for demonstration. Live participant management will be connected in an upcoming release.</p>
        </div>
      </div>
      <ParticipantManagementInner />
    </div>
  );
};

const ParticipantManagementInner = () => {
  const t = useT();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = mockParticipants.filter((p) => {
    const matchSearch = `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("govParts.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("govParts.subtitle")}</p>
        </div>
        <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"><Plus className="w-4 h-4" />{t("govParts.addParticipant")}</Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("govParts.searchPlaceholder")} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder={t("govParts.filterByStatus")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("govParts.allStatuses")}</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="waiting_on_documents">Waiting on Documents</SelectItem>
              <SelectItem value="ready_for_review">Ready for Review</SelectItem><SelectItem value="referred_out">Referred Out</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("govParts.participant")}</TableHead><TableHead>{t("govParts.language")}</TableHead><TableHead>{t("govParts.status")}</TableHead>
                <TableHead>{t("govParts.readiness")}</TableHead><TableHead>{t("govParts.documents")}</TableHead><TableHead>{t("govParts.nextMilestone")}</TableHead><TableHead>{t("govParts.tags")}</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{langLabels[p.preferred_language] ?? p.preferred_language}</Badge></TableCell>
                  <TableCell><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[p.status]}`}>{p.status.replace(/_/g, " ")}</span></TableCell>
                  <TableCell><div className="flex items-center gap-2 min-w-[100px]"><Progress value={p.readiness_score} className="h-2 flex-1" /><span className="text-xs text-muted-foreground">{p.readiness_score}%</span></div></TableCell>
                  <TableCell className="text-sm">{p.documents_uploaded}/{p.documents_required}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.next_milestone}</TableCell>
                  <TableCell><div className="flex gap-1">{p.tags.map((tg) => (<Badge key={tg} variant="secondary" className="text-[10px]">{tg}</Badge>))}</div></TableCell>
                  <TableCell><Button size="sm" variant="ghost" className="text-xs h-7">{t("govParts.view")}</Button></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t("govParts.noParticipants")}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-[11px] text-muted-foreground text-center py-3">{t("gov.disclaimerLong")}</div>
    </div>
  );
};

export default ParticipantManagement;
