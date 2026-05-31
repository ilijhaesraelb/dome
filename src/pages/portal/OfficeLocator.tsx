import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Search, MapPin, Phone, Navigation, Building2, Globe, LocateFixed, Loader2,
  Info, Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type OfficeType = "uscis" | "embassy" | "asc";

interface Office {
  id: string;
  name: string;
  type: OfficeType;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  hours: string;
  services: string[];
  website: string;
  distance?: string;
  lat?: number;
  lng?: number;
}

const categories = [
  { key: "all", label: "All", icon: MapPin },
  { key: "embassy", label: "Embassies", icon: Building2 },
  { key: "uscis", label: "USCIS", icon: Globe },
  { key: "asc", label: "Consulates", icon: Globe },
];

const typeIcons: Record<OfficeType, string> = {
  uscis: "🏛️",
  embassy: "🏛️",
  asc: "🌐",
};

const createMarkerIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -36],
  });
};

const markerIcons: Record<OfficeType, L.DivIcon> = {
  uscis: createMarkerIcon("hsl(218,41%,21%)"),
  embassy: createMarkerIcon("hsl(22,76%,53%)"),
  asc: createMarkerIcon("hsl(142,71%,45%)"),
};

/* ─── Office List Card ─── */
const OfficeListCard = ({ office }: { office: Office }) => (
  <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-4">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg">
        {typeIcons[office.type]}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-foreground leading-tight">{office.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {office.address}
        </p>
        <p className="text-xs text-muted-foreground">
          {office.city}, {office.state}
        </p>
        <p className="text-xs text-muted-foreground italic mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {office.hours}
        </p>
      </div>
      <div className="text-right shrink-0 space-y-1.5">
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          {office.distance && office.distance !== "—" && (
            <>
              {office.distance}
              <Info className="w-3 h-3 text-primary/60" />
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs font-semibold border-secondary/40 text-secondary hover:bg-secondary/10 gap-1"
          asChild
        >
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(office.address + " " + office.city + " " + office.state)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Navigation className="w-3 h-3" />
            Directions
          </a>
        </Button>
      </div>
    </div>
  </div>
);

/* ─── Map View ─── */
const OfficeMapView = ({
  offices,
  onSelect,
}: {
  offices: Office[];
  onSelect: (id: string) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const mappable = useMemo(
    () => offices.filter((o) => o.lat && o.lng),
    [offices]
  );

  useEffect(() => {
    if (!mapRef.current || mappable.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: true });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mappable.forEach((office) => {
      const marker = L.marker([office.lat!, office.lng!], {
        icon: markerIcons[office.type],
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          <p style="font-weight:600;font-size:13px;margin:0 0 4px;">${office.name}</p>
          <p style="font-size:11px;color:#666;margin:0 0 2px;">${office.address}</p>
          <p style="font-size:11px;color:#666;margin:0 0 6px;">${office.city}, ${office.state}</p>
          <a href="#" style="font-size:11px;color:hsl(22,76%,53%);text-decoration:none;">More Info &gt;</a>
        </div>
      `);

      marker.on("click", () => onSelect(office.id));
    });

    if (mappable.length === 1) {
      map.setView([mappable[0].lat!, mappable[0].lng!], 12);
    } else {
      const bounds = L.latLngBounds(
        mappable.map((o) => [o.lat!, o.lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mappable, onSelect]);

  if (mappable.length === 0) {
    return (
      <div className="h-[260px] rounded-xl bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No offices with location data to display
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="h-[260px] rounded-xl overflow-hidden border border-border shadow-sm"
      style={{ zIndex: 0 }}
    />
  );
};

/* ─── Main Component ─── */
const OfficeLocator = () => {
  const [zipSearch, setZipSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);

  const fetchOffices = useCallback(
    async (params: {
      zipCode?: string;
      lat?: number;
      lng?: number;
      officeType?: string;
    }) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "uscis-locator",
          {
            body: {
              zipCode: params.zipCode,
              lat: params.lat,
              lng: params.lng,
              officeType:
                params.officeType !== "all" ? params.officeType : undefined,
            },
          }
        );

        if (error) throw error;
        if (data?.success && data.data) {
          setOffices(data.data);
          setHasSearched(true);
        } else {
          toast.error(data?.error || "Failed to fetch offices");
        }
      } catch (err) {
        console.error("Error fetching offices:", err);
        toast.error("Failed to find offices. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationLabel(
          `Near ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
        );
        setZipSearch("");
        fetchOffices({ lat: latitude, lng: longitude, officeType: activeTab });
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error(
          "Could not get your location. Please enter a ZIP code instead."
        );
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [fetchOffices, activeTab]);

  const handleZipSearch = useCallback(() => {
    const zip = zipSearch.trim();
    if (!zip) {
      toast.error("Please enter a ZIP code or city");
      return;
    }
    setLocationLabel(zip);
    fetchOffices({ zipCode: zip, officeType: activeTab });
  }, [zipSearch, fetchOffices, activeTab]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleZipSearch();
  };

  useEffect(() => {
    if (!hasSearched) return;
    if (locationLabel && zipSearch) {
      fetchOffices({ zipCode: zipSearch.trim(), officeType: activeTab });
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    handleGeolocate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (activeTab === "all") return offices;
    return offices.filter((o) => o.type === activeTab);
  }, [offices, activeTab]);

  return (
    <div className="px-4 py-2 max-w-lg mx-auto space-y-4">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Embassy & USCIS Locator
        </h1>
        <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full" />
        <p className="text-sm text-muted-foreground">
          Find nearby embassies, consulates, or USCIS offices.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search location"
            value={zipSearch}
            onChange={(e) => setZipSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 h-10 text-sm bg-card/80"
          />
        </div>
        <Button
          variant="outline"
          className="h-10 text-xs gap-1.5 font-semibold text-secondary border-secondary/30 hover:bg-secondary/10 shrink-0"
          onClick={handleGeolocate}
          disabled={locating || loading}
        >
          {locating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <LocateFixed className="w-4 h-4" />
              <span className="hidden sm:inline">Use Current Location</span>
            </>
          )}
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const active = activeTab === cat.key;
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors",
                active
                  ? "bg-secondary/10 border-secondary text-secondary"
                  : "bg-card/80 border-border text-muted-foreground hover:border-secondary/40"
              )}
            >
              <CatIcon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Map */}
      {loading ? (
        <Skeleton className="h-[260px] w-full rounded-xl" />
      ) : hasSearched && filtered.length > 0 ? (
        <OfficeMapView offices={filtered} onSelect={setSelectedOfficeId} />
      ) : null}

      {/* Office list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !hasSearched ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <LocateFixed className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Detecting your location…</p>
          <p className="text-xs mt-1">Or enter a location above to search.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No offices found. Try a different location or category.
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {filtered.map((office) => (
            <OfficeListCard key={office.id} office={office} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficeLocator;
