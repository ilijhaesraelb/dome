import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Languages, Volume2, Mic } from "lucide-react";
import { useLanguagePreferences } from "@/hooks/useLanguagePreferences";
import { SUPPORTED_LANGUAGES } from "@/hooks/useTranslation";

const LanguagePreferencesCard = () => {
  const { prefs, loading, updatePrefs } = useLanguagePreferences();

  if (loading) return null;

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <h2 className="font-display font-bold text-base flex items-center gap-2">
          <Languages className="w-4 h-4 text-secondary" /> Language & Communication
        </h2>

        {/* Preferred Language */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Preferred Language</Label>
          <Select
            value={prefs.preferred_language}
            onValueChange={(v) => updatePrefs({ preferred_language: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span> {l.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Messages will be translated into this language</p>
        </div>

        {/* Secondary Language */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Secondary Language (optional)</Label>
          <Select
            value={prefs.secondary_language || "none"}
            onValueChange={(v) => updatePrefs({ secondary_language: v === "none" ? null : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {SUPPORTED_LANGUAGES.filter((l) => l.code !== prefs.preferred_language).map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span> {l.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Auto-translate messages</Label>
            </div>
            <Switch
              checked={prefs.translation_enabled}
              onCheckedChange={(v) => updatePrefs({ translation_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Text-to-speech</Label>
            </div>
            <Switch
              checked={prefs.tts_enabled}
              onCheckedChange={(v) => updatePrefs({ tts_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Voice input</Label>
            </div>
            <Switch
              checked={prefs.voice_input_enabled}
              onCheckedChange={(v) => updatePrefs({ voice_input_enabled: v })}
            />
          </div>
        </div>

        {/* Current language badge */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Your profile shows:</p>
          <Badge variant="secondary" className="gap-1">
            {SUPPORTED_LANGUAGES.find((l) => l.code === prefs.preferred_language)?.flag || "🌐"}{" "}
            Preferred Language: {SUPPORTED_LANGUAGES.find((l) => l.code === prefs.preferred_language)?.label || prefs.preferred_language}
          </Badge>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Translations are provided for communication support. For legal accuracy, important case details should be reviewed with a qualified professional. D.O.M.E. does not provide legal advice.
        </p>
      </CardContent>
    </Card>
  );
};

export default LanguagePreferencesCard;
