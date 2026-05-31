import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalIcon } from "lucide-react";
import { mockEvents } from "@/data/mockData";
import { useT } from "@/hooks/useT";
import { useLanguage } from "@/contexts/LanguageContext";

const eventTypeColors: Record<string, string> = {
  hearing: "bg-destructive/10 text-destructive",
  deadline: "bg-warning/10 text-warning",
  meeting: "bg-primary/10 text-primary",
};

const CalendarPage = () => {
  const t = useT();
  const { locale } = useLanguage();

  const grouped = mockEvents.reduce<Record<string, typeof mockEvents>>((acc, ev) => {
    (acc[ev.date] = acc[ev.date] || []).push(ev);
    return acc;
  }, {});

  const localeDateOpts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("calendar.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("calendar.subtitle")}</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> {t("calendar.newEvent")}</Button>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, events]) => (
          <Card key={date}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <CalIcon className="w-4 h-4 text-primary" />
                {new Date(date + "T00:00:00").toLocaleDateString(locale, localeDateOpts)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${ev.type === "hearing" ? "bg-destructive" : ev.type === "deadline" ? "bg-warning" : "bg-primary"}`} />
                    <div>
                      <p className="font-medium text-sm">{ev.title}</p>
                      {ev.caseName && <p className="text-xs text-muted-foreground">{ev.caseName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{ev.time}</span>
                    <Badge variant="outline" className={eventTypeColors[ev.type]}>{ev.type}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage;
