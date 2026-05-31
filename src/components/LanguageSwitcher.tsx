import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Locale, LOCALE_LABELS } from "@/i18n/pathwayTranslations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const FLAG_EMOJI: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  ht: "🇭🇹",
  ja: "🇯🇵",
  ur: "🇵🇰",
  hi: "🇮🇳",
  zh: "🇨🇳",
  de: "🇩🇪",
};

interface LanguageSwitcherProps {
  variant?: "default" | "compact" | "banner";
  className?: string;
}

const LanguageSwitcher = ({ variant = "default", className }: LanguageSwitcherProps) => {
  const { locale, setLocale } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-md transition-colors focus:outline-none",
            variant === "banner"
              ? "text-secondary-foreground/90 hover:text-secondary-foreground px-2 py-1 text-xs"
              : variant === "compact"
                ? "text-muted-foreground hover:text-foreground p-1.5"
                : "text-muted-foreground hover:text-foreground px-2 py-1.5 text-sm border border-border hover:bg-accent rounded-lg",
            className
          )}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium">{FLAG_EMOJI[locale]} {LOCALE_LABELS[locale]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={(e) => {
              e.preventDefault();
              setLocale(code);
            }}
            className={cn(
              "flex items-center gap-2 text-sm cursor-pointer",
              locale === code && "bg-accent font-semibold"
            )}
          >
            <span>{FLAG_EMOJI[code]}</span>
            <span>{LOCALE_LABELS[code]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
