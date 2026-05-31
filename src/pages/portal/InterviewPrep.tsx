import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClipboardList, Mic, BookOpen, FileCheck, ChevronRight,
  Lightbulb, Handshake, HelpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/hooks/useT";

const InterviewPrep = () => {
  const t = useT();
  const { toast } = useToast();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const menuItems = [
    { icon: ClipboardList, title: t("interview.practiceQuestions"), subtitle: t("interview.commonQuestions"), iconBg: "bg-primary/10", iconColor: "text-primary" },
    { icon: Mic, title: t("interview.mockSim"), subtitle: t("interview.realisticPractice"), iconBg: "bg-secondary/10", iconColor: "text-secondary" },
    { icon: BookOpen, title: t("interview.dosDonts"), subtitle: t("interview.guidelines"), iconBg: "bg-accent/20", iconColor: "text-accent-foreground" },
    { icon: FileCheck, title: t("interview.docChecklist"), subtitle: t("interview.prepDocs"), iconBg: "bg-primary/10", iconColor: "text-primary" },
  ];

  const guidanceItems = [
    { icon: Lightbulb, text: t("interview.guidanceTip1"), iconColor: "text-secondary" },
    { icon: Handshake, text: t("interview.guidanceTip2"), iconColor: "text-secondary" },
    { icon: HelpCircle, text: t("interview.guidanceTip3"), iconColor: "text-secondary" },
  ];

  const handleBegin = () => {
    toast({ title: t("interview.comingSoon"), description: t("interview.comingSoonDesc") });
  };

  return (
    <div className="px-4 py-2 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-display font-bold text-foreground">{t("interview.title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("interview.subtitle")}</p>
      </div>

      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm p-4 flex items-center gap-3">
        <Avatar className="w-12 h-12 ring-2 ring-secondary/20">
          <AvatarFallback className="bg-secondary/10 text-secondary font-bold text-base">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">{t("interview.prepTools")}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {menuItems.map((item) => (
          <button key={item.title} onClick={handleBegin} className="w-full bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm p-4 flex items-center gap-3.5 hover:bg-muted/40 transition-all text-left group">
            <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
              <item.icon className={`w-5 h-5 ${item.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>

      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-base font-display font-bold text-foreground">{t("interview.guidance")}</h2>
        </div>
        <div className="divide-y divide-border/50">
          {guidanceItems.map((item, i) => (
            <button key={i} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left group">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <p className="text-sm text-foreground flex-1 leading-snug">{item.text}</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      <div className="pb-4 pt-1">
        <Button onClick={handleBegin} className="w-full h-12 text-base font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-2xl shadow-lg shadow-secondary/20">
          {t("interview.beginPractice")}
        </Button>
        <p className="text-[10px] text-muted-foreground/60 text-center mt-3">{t("common.disclaimer")}</p>
      </div>
    </div>
  );
};

export default InterviewPrep;
