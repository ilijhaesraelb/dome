import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Camera, Image, FileText, Upload, Mic, MicOff,
  Lock, ShieldCheck, UserCheck, CheckCircle2, Loader2, X, Trash2,
  RefreshCw, Eye, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEnsureCase } from "@/hooks/useEnsureCase";
import { useT } from "@/hooks/useT";
import { logPlatformError } from "@/lib/error-logger";

const DOC_CATEGORIES = [
  { value: "identity", label: "Identity Documents" },
  { value: "immigration", label: "Immigration Records" },
  { value: "family", label: "Family Evidence" },
  { value: "employment", label: "Employment Evidence" },
  { value: "financial", label: "Financial Evidence" },
  { value: "supporting", label: "Supporting Documents" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  needs_revision: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const PortalDocuments = () => {
  const t = useT();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { caseId, loading: caseLoading } = useEnsureCase();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("identity");
  const [editingLabel, setEditingLabel] = useState(false);
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewingDoc, setPreviewingDoc] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isVoiceSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Fetch documents
  const { data: uploadedDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ["my-documents", caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setDocName(file.name.replace(/\.[^/.]+$/, ""));
      setEditingLabel(true);
    }
  };

  const startVoiceLabel = useCallback(() => {
    if (!isVoiceSupported) return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setDocName(text.trim());
      toast({ title: t("portalDocs.voiceCaptured"), description: `"${text.trim()}"` });
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [isVoiceSupported, toast]);

  const stopVoiceLabel = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !docName.trim() || !user || !caseId) {
      toast({ title: t("portalDocs.missingInfo"), description: t("portalDocs.missingInfoDesc"), variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: storageErr } = await supabase.storage
        .from("case-documents")
        .upload(filePath, selectedFile);

      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase.from("documents").insert({
        case_id: caseId,
        name: docName,
        category: docCategory,
        file_path: filePath,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        uploaded_by: user.id,
        status: "pending" as any,
      });

      if (dbErr) throw dbErr;

      toast({ title: t("portalDocs.uploaded"), description: t("portalDocs.uploadedDesc", { name: docName }) });
      queryClient.invalidateQueries({ queryKey: ["my-documents", caseId] });
      resetCapture();
    } catch (err: any) {
      toast({ title: t("portalDocs.uploadFailed"), description: err.message, variant: "destructive" });
      await logPlatformError({
        type: "upload_failure",
        severity: "high",
        message: err.message || "Document upload failed",
        caseId: caseId || undefined,
        details: { fileName: selectedFile?.name, fileSize: selectedFile?.size },
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, filePath: string | null) => {
    try {
      if (filePath) {
        await supabase.storage.from("case-documents").remove([filePath]);
      }
      const { error } = await supabase.from("documents").delete().eq("id", docId);
      if (error) throw error;
      toast({ title: t("portalDocs.deleted") });
      queryClient.invalidateQueries({ queryKey: ["my-documents", caseId] });
    } catch (err: any) {
      toast({ title: t("portalDocs.deleteFailed"), description: err.message, variant: "destructive" });
    }
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !replacingDocId) return;

    setUploading(true);
    try {
      const doc = uploadedDocs.find(d => d.id === replacingDocId);
      // Remove old file
      if (doc?.file_path) {
        await supabase.storage.from("case-documents").remove([doc.file_path]);
      }
      // Upload new file
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: storageErr } = await supabase.storage.from("case-documents").upload(filePath, file);
      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase.from("documents").update({
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        status: "pending" as any,
      }).eq("id", replacingDocId);
      if (dbErr) throw dbErr;

      toast({ title: t("portalDocs.replaced") });
      queryClient.invalidateQueries({ queryKey: ["my-documents", caseId] });
    } catch (err: any) {
      toast({ title: t("portalDocs.replaceFailed"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setReplacingDocId(null);
    }
  };

  const handlePreview = async (filePath: string | null, docId: string) => {
    if (!filePath) return;
    try {
      const { data } = await supabase.storage.from("case-documents").createSignedUrl(filePath, 300);
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setPreviewingDoc(docId);
      }
    } catch {
      toast({ title: t("portalDocs.previewFailed"), variant: "destructive" });
    }
  };

  const resetCapture = () => {
    setPreview(null);
    setSelectedFile(null);
    setDocName("");
    setDocCategory("identity");
    setEditingLabel(false);
  };

  // Group docs by category
  const groupedDocs = DOC_CATEGORIES.map(cat => ({
    ...cat,
    docs: uploadedDocs.filter(d => d.category === cat.value),
  })).filter(g => g.docs.length > 0);

  const uncategorized = uploadedDocs.filter(d => !DOC_CATEGORIES.some(c => c.value === d.category));

  if (caseLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("portalDocs.title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t("portalDocs.subtitle")}</p>
      </div>

      {/* Upload Area */}
      {!editingLabel ? (
        <Card className="border-dashed border-2 hover:border-secondary/40 transition-colors">
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("portalDocs.tapUpload")}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                <Camera className="w-4 h-4" /> {t("portalDocs.scanPhoto")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                <Image className="w-4 h-4" /> {t("portalDocs.browseFiles")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-3">
            {preview && (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                <button onClick={resetCapture} className="absolute top-2 right-2 w-7 h-7 bg-destructive/80 text-destructive-foreground rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <h3 className="font-display font-bold text-sm">{t("portalDocs.labelDoc")}</h3>
            <div className="flex items-center gap-2">
              {isVoiceSupported && (
                <Button size="sm" variant={listening ? "destructive" : "outline"} onClick={listening ? stopVoiceLabel : startVoiceLabel} className="gap-1.5">
                  {listening ? <><MicOff className="w-3.5 h-3.5" /> {t("portalDocs.stop")}</> : <><Mic className="w-3.5 h-3.5" /> {t("portalDocs.voice")}</>}
                </Button>
              )}
              {listening && <span className="text-xs text-destructive">{t("portalDocs.listening")}</span>}
            </div>
            <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder={t("portalDocs.docName")} className="h-10" />
            <Select value={docCategory} onValueChange={setDocCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {DOC_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleUpload} disabled={uploading || !docName.trim()} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 h-11">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> {t("portalDocs.uploadDoc")}</>}
            </Button>
          </CardContent>
        </Card>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={handleFileSelect} />
      <input ref={replaceInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReplace} />

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => { setPreviewUrl(null); setPreviewingDoc(null); }}>
          <div className="max-w-2xl max-h-[80vh] bg-card rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-semibold">{t("portalDocs.docPreview")}</span>
              <button onClick={() => { setPreviewUrl(null); setPreviewingDoc(null); }} className="p-1 hover:bg-muted rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 max-h-[70vh] overflow-auto">
              {previewUrl.match(/\.pdf/i) ? (
                <iframe src={previewUrl} className="w-full h-[60vh]" title="PDF Preview" />
              ) : (
                <img src={previewUrl} alt="Document" className="w-full h-auto" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents by Category */}
      {docsLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : uploadedDocs.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          {t("portalDocs.noDocsYet")}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedDocs.map(group => (
            <Card key={group.value}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm">{group.label}</h3>
                  <Badge variant="outline" className="text-xs">{group.docs.length}</Badge>
                </div>
                <div className="divide-y divide-border">
                  {group.docs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 py-2.5">
                      <CheckCircle2 className={cn("w-4 h-4 shrink-0", doc.status === "approved" ? "text-green-500" : "text-muted-foreground")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] border-0", statusColors[doc.status || "pending"] || "")}>
                        {(doc.status || "pending").replace(/_/g, " ")}
                      </Badge>
                      <div className="flex gap-1">
                        <button onClick={() => handlePreview(doc.file_path, doc.id)} className="p-1 hover:bg-muted rounded" title="Preview">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => { setReplacingDocId(doc.id); replaceInputRef.current?.click(); }} className="p-1 hover:bg-muted rounded" title="Replace">
                          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1 hover:bg-destructive/10 rounded" title="Delete">
                              <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("portalDocs.deleteDoc")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("portalDocs.deleteConfirm", { name: doc.name })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(doc.id, doc.file_path)} className="bg-destructive text-destructive-foreground">
                                {t("common.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Uncategorized docs */}
          {uncategorized.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-display font-bold text-sm">{t("portalDocs.otherDocs")}</h3>
                <div className="divide-y divide-border">
                  {uncategorized.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 py-2.5">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.category}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{doc.status}</Badge>
                      <div className="flex gap-1">
                        <button onClick={() => handlePreview(doc.file_path, doc.id)} className="p-1 hover:bg-muted rounded">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1 hover:bg-destructive/10 rounded">
                              <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("portalDocs.deleteDoc")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("portalDocs.deleteConfirm", { name: doc.name })}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(doc.id, doc.file_path)} className="bg-destructive text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Security */}
      <div className="flex justify-center gap-6 pt-2 pb-2">
        <div className="flex flex-col items-center gap-1">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-[10px] text-muted-foreground">{t("common.encrypted")}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[10px] text-muted-foreground">{t("portalDocs.permissionBased")}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <UserCheck className="w-4 h-4 text-primary" />
          <span className="text-[10px] text-muted-foreground">{t("common.private")}</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">{t("common.disclaimer")}</p>
    </div>
  );
};

export default PortalDocuments;
