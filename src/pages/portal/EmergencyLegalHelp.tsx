import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Phone, Globe, Shield, Scale, Building2,
  ExternalLink, AlertTriangle, Heart, MapPin
} from "lucide-react";
import { Link } from "react-router-dom";
import { useT } from "@/hooks/useT";

const resources = [
  {
    category: "Immediate Legal Help",
    icon: Scale,
    items: [
      {
        name: "American Immigration Lawyers Association (AILA)",
        description: "Find a verified immigration attorney near you",
        url: "https://www.aila.org/find-an-attorney",
        type: "Attorney Directory",
      },
      {
        name: "DOJ Accredited Representatives",
        description: "Find DOJ-recognized representatives who can help with your case at lower cost",
        url: "https://www.justice.gov/eoir/find-legal-representation",
        type: "Accredited Reps",
      },
      {
        name: "Immigration Advocates Network",
        description: "National directory of free immigration legal services",
        url: "https://www.immigrationadvocates.org/legaldirectory/",
        type: "Free Services",
      },
    ],
  },
  {
    category: "Free Legal Aid",
    icon: Heart,
    items: [
      {
        name: "Legal Aid Society",
        description: "Free legal representation for those who cannot afford an attorney",
        url: "https://legalaidnyc.org/",
        type: "Nonprofit",
      },
      {
        name: "Catholic Charities Immigration Services",
        description: "Affordable immigration legal services through local dioceses",
        url: "https://www.catholiccharitiesusa.org/",
        type: "Nonprofit",
      },
      {
        name: "CLINIC (Catholic Legal Immigration Network)",
        description: "Network of nonprofit immigration programs nationwide",
        url: "https://cliniclegal.org/",
        type: "Network",
      },
    ],
  },
  {
    category: "Government Resources",
    icon: Building2,
    items: [
      {
        name: "USCIS Contact Center",
        description: "Official USCIS customer service and case inquiries",
        phone: "1-800-375-5283",
        type: "Government",
      },
      {
        name: "ICE Detention Hotline",
        description: "For individuals in immigration detention",
        phone: "1-888-351-4024",
        type: "Emergency",
      },
      {
        name: "National Immigrant Women's Advocacy Project",
        description: "Resources for immigrant survivors of violence",
        url: "https://niwaplibrary.wcl.american.edu/",
        type: "Advocacy",
      },
    ],
  },
];

const EmergencyLegalHelp = () => {
  const t = useT();
  return (
    <div className="max-w-lg mx-auto px-4 py-2 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/portal" className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">{t("emergency.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("emergency.subtitle")}</p>
        </div>
        <Shield className="w-5 h-5 text-destructive" />
      </div>

      {/* Urgent notice */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">{t("emergency.urgentTitle")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("emergency.urgentDesc")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* USCIS Locator quick link */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <Link to="/portal/locator">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{t("emergency.findUSCIS")}</p>
              <p className="text-xs text-muted-foreground">{t("emergency.findUSCISDesc")}</p>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Resource sections */}
      {resources.map((section) => (
        <div key={section.category} className="space-y-2">
          <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
            <section.icon className="w-4 h-4 text-secondary" />
            {section.category}
          </h2>
          {section.items.map((item) => (
            <Card key={item.name} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <Badge variant="outline" className="text-[9px] shrink-0">{item.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.url && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-3.5 h-3.5" /> {t("emergency.visitWebsite")} <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                  {item.phone && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                      <a href={`tel:${item.phone}`}>
                        <Phone className="w-3.5 h-3.5" /> {item.phone}
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>{t("common.importantNotice")}:</strong> {t("emergency.disclaimer")}
          </p>
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">
        {t("common.disclaimer")}
      </p>
    </div>
  );
};

export default EmergencyLegalHelp;
