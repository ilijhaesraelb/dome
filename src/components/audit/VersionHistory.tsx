import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, Eye, ArrowLeftRight, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface VersionHistoryProps {
  recordType: string;
  recordId: string;
  onRestore?: (version: any) => void;
  allowRestore?: boolean;
}

export default function VersionHistory({
  recordType,
  recordId,
  onRestore,
  allowRestore = false,
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [compareVersions, setCompareVersions] = useState<[any, any] | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["record-versions", recordType, recordId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("record_versions")
        .select("*")
        .eq("record_type", recordType)
        .eq("record_id", recordId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!recordType && !!recordId,
  });

  const handleCompare = (v1: any, v2: any) => {
    setCompareVersions([v1, v2]);
  };

  if (isLoading) return null;
  if (!versions?.length) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <History className="w-3.5 h-3.5" /> No version history available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="w-4 h-4" /> Version History
            <Badge variant="secondary" className="ml-auto">{versions.length} versions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {versions.map((v: any, idx: number) => (
                <div
                  key={v.id}
                  className={`border rounded-lg p-2.5 ${v.is_current ? "border-primary bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.is_current ? "default" : "outline"} className="text-[10px]">
                        v{v.version_number}
                      </Badge>
                      {v.is_current && <Badge className="text-[10px] bg-green-100 text-green-800">Current</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedVersion(v)}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      {idx < versions.length - 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleCompare(v, versions[idx + 1])}
                          title="Compare with previous"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                        </Button>
                      )}
                      {allowRestore && !v.is_current && onRestore && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => onRestore(v)}
                          title="Restore this version"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(v.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  {v.fields_changed?.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Changed: {v.fields_changed.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Version Detail */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Version {selectedVersion?.version_number} Details</DialogTitle>
          </DialogHeader>
          {selectedVersion && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedVersion.created_at), "PPpp")}
              </p>
              {selectedVersion.fields_changed?.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">Fields Changed:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedVersion.fields_changed.map((f: string) => (
                      <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-medium mb-1">Snapshot:</p>
                <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(selectedVersion.snapshot, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={!!compareVersions} onOpenChange={() => setCompareVersions(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Compare v{compareVersions?.[1]?.version_number} → v{compareVersions?.[0]?.version_number}
            </DialogTitle>
          </DialogHeader>
          {compareVersions && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium mb-1">v{compareVersions[1].version_number} (Before)</p>
                <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(compareVersions[1].snapshot, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">v{compareVersions[0].version_number} (After)</p>
                <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(compareVersions[0].snapshot, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
