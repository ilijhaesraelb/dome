import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import MessageToolbar from "./MessageToolbar";
import { cn } from "@/lib/utils";

interface TranslatedTaskCardProps {
  title: string;
  description: string;
  type: "checklist" | "reminder" | "instruction" | "status_update";
  completed?: boolean;
  sourceLang?: string;
  viewerLang: string;
  onToggle?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  checklist: "Checklist",
  reminder: "Reminder",
  instruction: "Instruction",
  status_update: "Status Update",
};

const TranslatedTaskCard = ({
  title,
  description,
  type,
  completed = false,
  sourceLang = "en",
  viewerLang,
  onToggle,
}: TranslatedTaskCardProps) => {
  const needsTranslation = sourceLang !== viewerLang;

  return (
    <Card className={cn(completed && "opacity-60")}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start gap-3">
          {type === "checklist" && (
            <Checkbox checked={completed} onCheckedChange={() => onToggle?.()} className="mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className={cn("text-sm font-semibold", completed && "line-through")}>{title}</h4>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                {TYPE_LABELS[type] || type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {needsTranslation && (
          <MessageToolbar
            text={`${title}. ${description}`}
            sourceLang={sourceLang}
            targetLang={viewerLang}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TranslatedTaskCard;
