import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MessageToolbar from "./MessageToolbar";
import { getLangFlag } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface TranslatedMessageBubbleProps {
  senderName: string;
  senderRole: string;
  content: string;
  sourceLang?: string;
  viewerLang: string;
  timestamp: string;
  isOwn?: boolean;
  onReply?: (text: string) => void;
}

const TranslatedMessageBubble = ({
  senderName,
  senderRole,
  content,
  sourceLang = "en",
  viewerLang,
  timestamp,
  isOwn = false,
  onReply,
}: TranslatedMessageBubbleProps) => {
  const initials = senderName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const needsTranslation = sourceLang !== viewerLang;

  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className="text-xs bg-secondary/10 text-secondary">{initials}</AvatarFallback>
      </Avatar>

      <div className={cn("max-w-[80%] space-y-1", isOwn && "items-end")}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{senderName}</span>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            {senderRole}
          </Badge>
          {needsTranslation && (
            <span className="text-[10px] text-muted-foreground">
              {getLangFlag(sourceLang)}
            </span>
          )}
        </div>

        <Card className={cn("shadow-sm", isOwn ? "bg-secondary/10" : "bg-card")}>
          <CardContent className="p-3 space-y-2">
            <p className="text-sm">{content}</p>

            {needsTranslation && (
              <MessageToolbar
                text={content}
                sourceLang={sourceLang}
                targetLang={viewerLang}
                showVoiceReply={!isOwn}
                onVoiceReply={onReply}
              />
            )}
          </CardContent>
        </Card>

        <span className="text-[10px] text-muted-foreground">{timestamp}</span>
      </div>
    </div>
  );
};

export default TranslatedMessageBubble;
