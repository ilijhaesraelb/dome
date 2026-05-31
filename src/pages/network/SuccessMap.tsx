import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { MapPin, Award, Clock, Globe } from "lucide-react";
import { useT } from "@/hooks/useT";

const SuccessMap = () => {
  const t = useT();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["success-map-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_map_entries_public")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/network" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">{t("netHome.successMap")}</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <BackButton />
        <div className="text-center mt-4 mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 text-sm text-primary mb-4">
            <Globe className="w-4 h-4" /> {t("successMap.badge")}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{t("successMap.title")}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">{t("successMap.subtitle")}</p>
        </div>

        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-muted h-[400px] flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">{t("successMap.interactiveMap")}</p>
                <p className="text-sm text-muted-foreground">{t("successMap.showingMilestones", { count: entries.length })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {entries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display font-semibold mb-1">{t("successMap.noEntries")}</h3>
              <p className="text-sm text-muted-foreground">{t("successMap.noEntriesDesc")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {entries.map((entry: any) => (
              <Card key={entry.id}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center">
                      <Award className="w-5 h-5 text-success" />
                    </div>
                    <Badge variant="outline" className="text-xs">{entry.case_type}</Badge>
                  </div>
                  <h3 className="font-display font-semibold">{entry.milestone}</h3>
                  {entry.location_label && (
                    <div className="flex items-center gap-1 mt-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {entry.location_label}
                    </div>
                  )}
                  {entry.timeline_months && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" /> {t("successMap.months", { count: entry.timeline_months })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessMap;
