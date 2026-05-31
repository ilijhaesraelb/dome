import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileCheck, AlertTriangle, Eye, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { useCases } from "@/hooks/useCases";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const FirmReviewCenter = () => {
  const navigate = useNavigate();
  const { data: cases = [], isLoading: loadingCases } = useCases();

  // Get all form instances across cases
  const caseIds = cases.map(c => c.id);
  const { data: formInstances = [], isLoading: loadingForms } = useQuery({
    queryKey: ["firm-form-instances", caseIds],
    enabled: caseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_instances")
        .select("*, cases(case_number, case_type)")
        .in("case_id", caseIds)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Get documents across cases
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["firm-documents", caseIds],
    enabled: caseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, cases:case_id(case_number)")
        .in("case_id", caseIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const formsNeedingReview = formInstances.filter(f => f.status === "completed" || (f.progress || 0) >= 80);
  const incompleteForms = formInstances.filter(f => f.status !== "completed" && (f.progress || 0) < 80);
  const pendingDocs = documents.filter(d => !d.status || d.status === "pending");
  const approvedDocs = documents.filter(d => d.status === "approved");

  const isLoading = loadingCases || loadingForms || loadingDocs;

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Tabs defaultValue="forms" className="space-y-4">
      <TabsList>
        <TabsTrigger value="forms" className="gap-1">
          <FileText className="w-3.5 h-3.5" /> Forms ({formInstances.length})
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-1">
          <FileCheck className="w-3.5 h-3.5" /> Documents ({documents.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="forms" className="space-y-4">
        {/* Forms Ready for Review */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Ready for Review ({formsNeedingReview.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formsNeedingReview.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No forms pending review</p>
            ) : (
              <div className="space-y-2">
                {formsNeedingReview.map(form => (
                  <div key={form.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{form.form_type} — {form.form_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Case: {(form as any).cases?.case_number} · {(form as any).cases?.case_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${form.progress || 0}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{form.progress || 0}%</span>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => navigate(`/portal/forms/${form.id}`)}>
                        <Eye className="w-3 h-3" /> Review
                      </Button>
                      <Button size="sm" className="text-xs gap-1">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incomplete Forms */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              In Progress ({incompleteForms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incompleteForms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No forms in progress</p>
            ) : (
              <div className="space-y-2">
                {incompleteForms.slice(0, 10).map(form => (
                  <div key={form.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{form.form_type} — {form.form_name}</p>
                        <p className="text-xs text-muted-foreground">Case: {(form as any).cases?.case_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${form.progress || 0}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{form.progress || 0}%</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{form.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Pending Document Review ({pendingDocs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No documents pending review</p>
            ) : (
              <div className="space-y-2">
                {pendingDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.category} · Case: {(doc as any).cases?.case_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{doc.status || "pending"}</Badge>
                      <Button size="sm" variant="outline" className="text-xs">View</Button>
                      <Button size="sm" className="text-xs">Approve</Button>
                      <Button size="sm" variant="ghost" className="text-xs text-destructive">Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default FirmReviewCenter;
