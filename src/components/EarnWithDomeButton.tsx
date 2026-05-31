import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import { useT } from "@/hooks/useT";

const EarnWithDomeButton = () => {
  const t = useT();

  return (
    <Link
      to="/affiliate"
      className="fixed bottom-6 left-6 z-50 group"
      title={t("earnWithDome.tooltip")}
    >
      <div className="relative flex items-center gap-2 bg-gradient-to-r from-warning to-secondary text-secondary-foreground px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-warning to-secondary opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-500 animate-pulse" />
        <Rocket className="w-4 h-4 relative z-10" />
        <span className="text-sm font-semibold relative z-10 whitespace-nowrap">{t("earnWithDome.label")}</span>
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-warning/50 to-secondary/50 animate-[pulse_3s_ease-in-out_infinite] -z-10 blur-sm" />
      </div>
    </Link>
  );
};

export default EarnWithDomeButton;
