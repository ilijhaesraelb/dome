import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/hooks/useT";

const DonationBanner = () => {
  const t = useT();

  return (
    <div className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 justify-center">
          <Heart className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">{t("banner.supportMission")}</span>
          <Button
            size="sm"
            variant="outline"
            className="bg-background/10 border-background/30 hover:bg-background/20 text-secondary-foreground h-7 px-3 text-xs font-semibold"
            onClick={() => window.open("/contribution", "_self")}
          >
            {t("common.donate")}
          </Button>
        </div>
        <LanguageSwitcher variant="banner" />
      </div>
    </div>
  );
};

export default DonationBanner;
