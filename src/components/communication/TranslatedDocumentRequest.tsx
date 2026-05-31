import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, Calendar } from "lucide-react";
import MessageToolbar from "./MessageToolbar";

interface TranslatedDocumentRequestProps {
  documentName: string;
  description: string;
  simpleExplanation?: string;
  deadline?: string;
  sourceLang?: string;
  viewerLang: string;
  onUpload?: () => void;
}

const TranslatedDocumentRequest = ({
  documentName,
  description,
  simpleExplanation,
  deadline,
  sourceLang = "en",
  viewerLang,
  onUpload,
}: TranslatedDocumentRequestProps) => {
  const needsTranslation = sourceLang !== viewerLang;

  return (
    <Card className="border-l-4 border-l-secondary">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="secondary" className="text-[10px] mb-1.5">Document Request</Badge>
            <h4 className="font-semibold text-sm">{documentName}</h4>
          </div>
          {deadline && (
            <Badge variant="outline" className="gap-1 text-[10px] shrink-0">
              <Calendar className="w-3 h-3" />
              {deadline}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{description}</p>

        {simpleExplanation && (
          <div className="bg-accent/50 rounded-lg p-2.5 text-sm border-l-2 border-primary">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">Simple Explanation</p>
            <p>{simpleExplanation}</p>
          </div>
        )}

        {needsTranslation && (
          <MessageToolbar
            text={description}
            sourceLang={sourceLang}
            targetLang={viewerLang}
          />
        )}

        <Button onClick={onUpload} className="w-full gap-2" size="sm">
          <Upload className="w-4 h-4" /> Upload Document
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Translations are provided for communication support only.
        </p>
      </CardContent>
    </Card>
  );
};

export default TranslatedDocumentRequest;
