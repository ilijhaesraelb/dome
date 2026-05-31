import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Upload, CheckCircle2, AlertTriangle, Eye, Loader2,
  Settings, Database, RefreshCw, Power, PowerOff, Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TEMPLATE_REGISTRY, extractPdfFieldNames, FORM_FIELD_MAPPINGS } from "@/lib/pdf-template-engine";
import BackButton from "@/components/BackButton";

type TemplateInfo = {
  formCode: string;
  formTitle: string;
  editionDate: string;
  totalPages: number;
  isActive: boolean;
  fieldCount: number;
  mappedCount: number;
  completeness: number;
  detectedFields: Array<{ name: string; type: string; value?: string }>;
};

const TemplateManager = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchField, setSearchField] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const results: TemplateInfo[] = [];

    for (const [code, info] of Object.entries(TEMPLATE_REGISTRY)) {
      const mappings = FORM_FIELD_MAPPINGS[code] || [];
      let fieldCount = 0;
      let detectedFields: Array<{ name: string; type: string; value?: string }> = [];

      try {
        const analysis = await extractPdfFieldNames(code);
        fieldCount = analysis.fields.length;
        detectedFields = analysis.fields;
      } catch {
        // Template file may not be accessible
      }

      const mappedCount = mappings.length;
      const completeness = fieldCount > 0 ? Math.round((mappedCount / fieldCount) * 100) : 0;

      results.push({
        formCode: code,
        formTitle: info.formTitle,
        editionDate: info.editionDate,
        totalPages: info.totalPages,
        isActive: true,
        fieldCount,
        mappedCount,
        completeness: Math.min(completeness, 100),
        detectedFields,
      });
    }

    setTemplates(results);
    setLoading(false);
  };

  const handleAnalyze = async (formCode: string) => {
    setAnalyzing(formCode);
    try {
      const analysis = await extractPdfFieldNames(formCode);
      setTemplates(prev =>
        prev.map(t =>
          t.formCode === formCode
            ? { ...t, fieldCount: analysis.fields.length, detectedFields: analysis.fields }
            : t
        )
      );
      setSelectedTemplate(formCode);
      toast({ title: "Analysis Complete", description: `Found ${analysis.fields.length} PDF fields in ${formCode}.` });
    } catch (err) {
      toast({ title: "Analysis Failed", description: "Could not read PDF template fields.", variant: "destructive" });
    } finally {
      setAnalyzing(null);
    }
  };

  const selected = templates.find(t => t.formCode === selectedTemplate);
  const filteredFields = selected?.detectedFields.filter(f =>
    !searchField || f.name.toLowerCase().includes(searchField.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <BackButton />
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          USCIS Template Manager
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage uploaded USCIS form templates, view field mappings, and test export generation.
        </p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="fields" disabled={!selectedTemplate}>
            Field Inspector {selectedTemplate && `(${selectedTemplate})`}
          </TabsTrigger>
          <TabsTrigger value="audit">Audit Report</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map(t => (
                <Card key={t.formCode} className={!t.isActive ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          {t.formCode}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{t.formTitle}</p>
                      </div>
                      <Badge variant={t.isActive ? "default" : "secondary"} className="text-xs">
                        {t.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 rounded bg-muted/50">
                        <p className="font-medium text-foreground">{t.editionDate}</p>
                        <p className="text-muted-foreground">Edition</p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <p className="font-medium text-foreground">{t.totalPages}</p>
                        <p className="text-muted-foreground">Pages</p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <p className="font-medium text-foreground">{t.fieldCount}</p>
                        <p className="text-muted-foreground">PDF Fields</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Mapping: {t.mappedCount} / {t.fieldCount} fields</span>
                        <span>{t.completeness}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            t.completeness >= 80 ? "bg-green-500" :
                            t.completeness >= 40 ? "bg-yellow-500" : "bg-destructive"
                          }`}
                          style={{ width: `${t.completeness}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleAnalyze(t.formCode)}
                        disabled={analyzing === t.formCode}
                      >
                        {analyzing === t.formCode ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Search className="w-3 h-3 mr-1" />
                        )}
                        Analyze Fields
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => window.open(TEMPLATE_REGISTRY[t.formCode].path, "_blank")}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fields" className="space-y-4 mt-4">
          {selected && (
            <>
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search fields..."
                  value={searchField}
                  onChange={e => setSearchField(e.target.value)}
                  className="max-w-sm"
                />
                <Badge variant="outline">{filteredFields.length} fields</Badge>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">PDF Field Name</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Mapped To</th>
                      <th className="text-left p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFields.map((field, i) => {
                      const mapping = (FORM_FIELD_MAPPINGS[selected.formCode] || [])
                        .find(m => m.pdfFieldName === field.name);
                      return (
                        <tr key={i} className="border-t hover:bg-muted/30">
                          <td className="p-2 font-mono text-[10px] max-w-xs truncate">{field.name}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-[10px]">{field.type}</Badge>
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {mapping ? mapping.internalPath : "—"}
                          </td>
                          <td className="p-2">
                            {mapping ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Audit Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map(t => (
                  <div key={t.formCode} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{t.formCode}</span>
                        <Badge variant="outline" className="text-[10px]">
                          Edition {t.editionDate}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t.formTitle}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p>{t.mappedCount} / {t.fieldCount} mapped</p>
                      <p className={
                        t.completeness >= 80 ? "text-green-600" :
                        t.completeness >= 40 ? "text-yellow-600" : "text-destructive"
                      }>
                        {t.completeness >= 80 ? "Production Ready" :
                         t.completeness >= 40 ? "Partial Coverage" : "Needs Mapping"}
                      </p>
                    </div>
                    <Badge className={
                      t.completeness >= 80 ? "bg-green-100 text-green-800" :
                      t.completeness >= 40 ? "bg-yellow-100 text-yellow-800" :
                      "bg-destructive/10 text-destructive"
                    }>
                      {t.completeness}%
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg border bg-muted/20 text-xs space-y-2">
                <p className="font-medium text-sm">Summary</p>
                <p>• Forms detected: {templates.length}</p>
                <p>• Templates with fillable fields: {templates.filter(t => t.fieldCount > 0).length}</p>
                <p>• Average mapping completeness: {templates.length > 0 ? Math.round(templates.reduce((a, t) => a + t.completeness, 0) / templates.length) : 0}%</p>
                <p>• Production-ready forms: {templates.filter(t => t.completeness >= 80).length}</p>
                <p>• Forms needing additional mapping: {templates.filter(t => t.completeness < 80).length}</p>
                <p className="text-muted-foreground mt-2">
                  Note: Some PDF fields may use internal Adobe field names that differ from the mapping keys.
                  Use the Field Inspector to verify exact field names for each template.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplateManager;
