import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UploadedFile {
  id: string;
  name: string;
  type?: string;
  status: "uploading" | "done" | "error";
  progress?: number;
}

export interface FileUploadZoneProps {
  files?: UploadedFile[];
  onFiles?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}

export function FileUploadZone({
  files = [], onFiles, onRemove, accept, multiple = true,
  label = "Drag & drop files or click to upload", hint, className,
}: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files.length) onFiles?.(Array.from(e.dataTransfer.files));
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) onFiles?.(Array.from(e.target.files));
    e.target.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30",
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        <input ref={inputRef} type="file" className="hidden" accept={accept} multiple={multiple} onChange={handleChange} />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map(f => (
            <li key={f.id} className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm">
              {f.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
              {f.status === "done" && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
              {f.status === "error" && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{f.name}</span>
              {f.type && <span className="text-xs text-muted-foreground shrink-0">{f.type}</span>}
              {onRemove && (
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemove(f.id)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
