import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Plus, Search, MapPin, DollarSign, ArrowRight, AlertTriangle } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/useT";

const CATEGORIES: Record<string, string> = {
  startup_investor: "Startup Seeking Investor",
  expansion_capital: "Expansion Capital Needed",
  real_estate: "Real Estate Development",
  immigrant_business: "Immigrant-Owned Business",
  nonprofit_partnership: "Nonprofit Partnership",
  franchise_acquisition: "Franchise / Acquisition",
  affordable_housing: "Affordable Housing / Community",
  other: "Other",
};

const BusinessMarketplace = () => {
  const t = useT();
  const [listings, setListings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const query = supabase.from("business_listings").select("id, company_name, industry, state, summary, category, marketplace_mode, business_stage, amount_sought, founder_overview, traction, use_of_funds, website, contact_method, status, published_at, created_at, updated_at, user_id, disclaimer_accepted, expires_at").eq("status", "published").order("published_at", { ascending: false });
      const { data } = await query;
      setListings(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = listings.filter(l => {
    const matchSearch = !searchTerm || l.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === "all" || l.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/business" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <BackButton />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6 text-secondary" />
            <h1 className="font-display text-2xl font-bold">{t("bizMarket.title")}</h1>
          </div>
          <Link to="/business/marketplace/create">
            <Button className="gap-2 bg-secondary hover:bg-secondary/90">
              <Plus className="w-4 h-4" /> {t("bizMarket.postOpportunity")}
            </Button>
          </Link>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong>Investment Disclosure:</strong> {t("bizMarket.investmentDisclosure")}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("bizMarket.searchOpportunities")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder={t("bizMarket.allCategories")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("bizMarket.allCategories")}</SelectItem>
              {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t("bizMarket.loading")}</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">{t("bizMarket.noOpportunities")}</h3>
              <p className="text-muted-foreground mt-1">{t("bizMarket.beFirst")}</p>
              <Link to="/business/marketplace/create">
                <Button className="mt-4 gap-2 bg-secondary hover:bg-secondary/90">
                  <Plus className="w-4 h-4" /> {t("bizMarket.createListing")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(listing => (
              <Link key={listing.id} to={`/business/marketplace/${listing.id}`}>
                <Card className="h-full hover:border-secondary/50 transition-colors cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{listing.company_name}</h3>
                      <Badge variant="outline" className="shrink-0">{CATEGORIES[listing.category] || listing.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{listing.summary}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.state}</span>
                      {listing.amount_sought && (
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${Number(listing.amount_sought).toLocaleString()}</span>
                      )}
                      {listing.industry && <span>{listing.industry}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-secondary text-xs font-medium">
                      {t("bizMarket.viewDetails")} <ArrowRight className="w-3 h-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="p-6 text-center">
            <h3 className="font-display font-semibold text-lg">{t("bizMarket.postYourOpportunity")}</h3>
            <p className="text-muted-foreground text-sm mt-1">{t("bizMarket.listingPrice")}</p>
            <Link to="/business/marketplace/create">
              <Button className="mt-4 gap-2 bg-secondary hover:bg-secondary/90">
                <Plus className="w-4 h-4" /> {t("bizMarket.createListing")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">{t("bizMarket.disclaimer")}</p>
      </div>
    </div>
  );
};

export default BusinessMarketplace;
