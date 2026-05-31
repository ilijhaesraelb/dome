/**
 * Tax Document Upload & Organizer
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, CheckCircle2, X, FolderOpen, Shield,
  DollarSign, Home, Building2, TrendingUp, Users, Heart,
  AlertTriangle, File, BarChart3, Database, ScrollText,
} from "lucide-react";
import { TAX_DOCUMENT_CATEGORIES } from "@/data/taxFormSections";
import BackButton from "@/components/BackButton";

const ICONS: Record<string, any> = {
  FileText, DollarSign, Home, Building2, TrendingUp, Users, Heart,
  AlertTriangle, File, BarChart3, Database, ScrollText,
  Receipt: FileText, Award: Heart, FileSpreadsheet: BarChart3,
};

interface UploadedDoc {
  id: string;
  name: string;
  category: string;
  size: number;
  uploadedAt: Date;
}

const TaxDocuments = () => {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newDocs: UploadedDoc[] = Array.from(files).map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      category: selectedCategory || "other",
      size: f.size,
      uploadedAt: new Date(),
    }));
    setDocs(prev => [...prev, ...newDocs]);
    e.target.value = "";
  };

  const removeDoc = (id: string) => setDocs(prev => prev.filter(d => d.id !== id));

  const categoryLabel = (catId: string) => TAX_DOCUMENT_CATEGORIES.find(c => c.id === catId)?.label || catId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <BackButton />
      <div>
        <Badge className="bg-primary/10 text-primary border-0 mb-2">Tax Document Organizer</Badge>
        <h1 className="text-2xl font-display font-bold">Upload & Organize Tax Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Classify your documents so we can match them to the right sections.</p>
      </div>

      {/* Upload area */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {TAX_DOCUMENT_CATEGORIES.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="cursor-pointer">
              <Input type="file" className="hidden" multiple onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv" />
              <Button asChild className="gap-2 w-full sm:w-auto">
                <span><Upload className="w-4 h-4" /> Choose Files</span>
              </Button>
            </label>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            PDF, images, spreadsheets, or Word documents. Max 20MB each.
          </p>
        </CardContent>
      </Card>

      {/* Document categories */}
      <div>
        <h2 className="font-semibold text-lg mb-3">Document Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TAX_DOCUMENT_CATEGORIES.map(c => {
            const Icon = ICONS[c.icon] || FileText;
            const count = docs.filter(d => d.category === c.id).length;
            return (
              <Card key={c.id} className={count > 0 ? "border-success/30" : "border-dashed"}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground">{count} file{count !== 1 ? "s" : ""}</p>
                  </div>
                  {count > 0 && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Uploaded files list */}
      {docs.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-3">Uploaded Documents ({docs.length})</h2>
          <div className="space-y-2">
            {docs.map(d => (
              <Card key={d.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {categoryLabel(d.category)} • {Math.round(d.size / 1024)}KB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeDoc(d.id)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 text-muted-foreground/40 text-[10px] pt-4">
        <Shield className="w-3 h-3" /> <span>Encrypted • Secure • Private</span>
      </div>
    </div>
  );
};

export default TaxDocuments;
