import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { Globe, Briefcase, Building2, Heart, GraduationCap, Home, Users, Search, MapPin, ExternalLink, Star, Shield, Plus } from "lucide-react";
import { useT } from "@/hooks/useT";

const CATEGORY_META: Record<string, { labelKey: string; icon: any; color: string }> = {
  immigration_opportunity: { labelKey: "netHome.catImmigration", icon: Globe, color: "bg-primary/10 text-primary" },
  employment_sponsorship: { labelKey: "netHome.catEmployment", icon: Briefcase, color: "bg-secondary/10 text-secondary" },
  business_opportunity: { labelKey: "netHome.catBusiness", icon: Building2, color: "bg-accent-foreground/10 text-accent-foreground" },
  nonprofit_program: { labelKey: "netHome.catNonprofit", icon: Heart, color: "bg-success/10 text-success" },
  education_scholarship: { labelKey: "netHome.catEducation", icon: GraduationCap, color: "bg-warning/10 text-warning" },
  housing_relocation: { labelKey: "netHome.catHousing", icon: Home, color: "bg-destructive/10 text-destructive" },
  professional_service: { labelKey: "netHome.catProfessional", icon: Users, color: "bg-primary/10 text-primary" },
};

const NetworkDirectory = () => {
  const t = useT();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["network-listings", category],
    queryFn: async () => {
      let query = supabase.from("network_listings").select("*").eq("status", "published").order("is_featured", { ascending: false }).order("created_at", { ascending: false });
      if (category !== "all") query = query.eq("category", category as any);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    return listings.filter((l: any) => {
      const matchSearch = !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.organization_name?.toLowerCase().includes(search.toLowerCase()) || l.summary?.toLowerCase().includes(search.toLowerCase());
      const matchLoc = !locationFilter || l.location?.toLowerCase().includes(locationFilter.toLowerCase()) || l.state?.toLowerCase().includes(locationFilter.toLowerCase());
      return matchSearch && matchLoc;
    });
  }, [listings, search, locationFilter]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/network" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">{t("common.network")}</span>
          </Link>
          <Link to="/network/create">
            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-1">
              <Plus className="w-4 h-4" /> {t("netDir.postListing")}
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <BackButton />
        <h1 className="font-display text-2xl sm:text-3xl font-bold mt-4 mb-2">{t("netDir.title")}</h1>
        <p className="text-muted-foreground mb-6">{t("netDir.subtitle")}</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("netDir.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="relative flex-1 sm:max-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("netDir.locationPlaceholder")} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="pl-10" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder={t("netDir.allCategories")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("netDir.allCategories")}</SelectItem>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <SelectItem key={key} value={key}>{t(meta.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={category === "all" ? "default" : "outline"} size="sm" onClick={() => setCategory("all")}>{t("netDir.all")}</Button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <Button key={key} variant={category === key ? "default" : "outline"} size="sm" onClick={() => setCategory(key)} className="gap-1.5">
                <Icon className="w-3.5 h-3.5" /> {t(meta.labelKey)}
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (<Card key={i} className="animate-pulse"><CardContent className="pt-6 pb-5"><div className="h-5 bg-muted rounded w-3/4 mb-3" /><div className="h-4 bg-muted rounded w-1/2 mb-2" /><div className="h-16 bg-muted rounded mb-3" /><div className="h-8 bg-muted rounded w-1/3" /></CardContent></Card>))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">{t("netDir.noListings")}</h3>
              <p className="text-muted-foreground mb-4">{t("netDir.beFirst")}</p>
              <Link to="/network/create"><Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">{t("netDir.postListing")}</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((listing: any) => {
              const meta = CATEGORY_META[listing.category] || CATEGORY_META.immigration_opportunity;
              const Icon = meta.icon;
              return (
                <Link key={listing.id} to={`/network/listing/${listing.id}`}>
                  <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${listing.is_featured ? "border-secondary border-2" : ""}`}>
                    <CardContent className="pt-6 pb-5 px-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg ${meta.color} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
                        <div className="flex gap-1.5">
                          {listing.is_featured && <Badge className="bg-secondary/10 text-secondary border-secondary/20 gap-1"><Star className="w-3 h-3" /> {t("netDir.featured")}</Badge>}
                          {listing.is_verified && <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" /> {t("netDir.verified")}</Badge>}
                        </div>
                      </div>
                      <h3 className="font-display font-semibold line-clamp-2">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{listing.organization_name}</p>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{listing.summary}</p>
                      {(listing.location || listing.state) && (
                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {[listing.location, listing.state].filter(Boolean).join(", ")}
                        </div>
                      )}
                      {listing.salary_range && <p className="text-sm font-medium text-secondary mt-2">{listing.salary_range}</p>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkDirectory;
