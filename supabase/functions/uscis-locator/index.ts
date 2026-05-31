const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface OfficeResult {
  id: string;
  name: string;
  type: 'uscis' | 'embassy' | 'asc';
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

// The USCIS office locator has a public-facing endpoint we can query
const USCIS_LOCATOR_URL = 'https://egov.uscis.gov/office-locator';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipCode, lat, lng, officeType } = await req.json();

    if (!zipCode && (!lat || !lng)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide a ZIP code or coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the query for the USCIS locator
    const searchQuery = zipCode || `${lat},${lng}`;
    
    // Map office type filter
    const typeMap: Record<string, string> = {
      uscis: 'FO',   // Field Office
      asc: 'ASC',    // Application Support Center
      embassy: '',    // No direct USCIS filter for embassies
    };

    const typeParam = officeType && typeMap[officeType] ? `&type=${typeMap[officeType]}` : '';
    
    // Try the USCIS JSON endpoint
    const url = `${USCIS_LOCATOR_URL}/office-search?zipOrAddress=${encodeURIComponent(searchQuery)}${typeParam}`;
    
    console.log('Fetching USCIS offices:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; DomeImmigration/1.0)',
      },
    });

    if (!response.ok) {
      // If the JSON API doesn't work, fall back to a curated dataset with distance calculations
      console.log('USCIS API returned status:', response.status, '- falling back to curated data');
      const body = await response.text();
      console.log('Response body preview:', body.substring(0, 200));
      
      const fallbackResults = getCuratedOffices(zipCode, lat, lng, officeType);
      return new Response(
        JSON.stringify({ success: true, data: fallbackResults, source: 'curated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('USCIS API response keys:', Object.keys(data));

    // Parse USCIS response into our format
    const offices: OfficeResult[] = parseUSCISResponse(data);

    return new Response(
      JSON.stringify({ success: true, data: offices, source: 'uscis_api' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in uscis-locator:', error);
    
    // On any error, return curated data
    try {
      const { zipCode, lat, lng, officeType } = await req.clone().json().catch(() => ({}));
      const fallbackResults = getCuratedOffices(zipCode, lat, lng, officeType);
      return new Response(
        JSON.stringify({ success: true, data: fallbackResults, source: 'curated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
});

function parseUSCISResponse(data: any): OfficeResult[] {
  // Handle various USCIS response formats
  const offices = data.offices || data.results || data.data || [];
  
  if (!Array.isArray(offices)) {
    console.log('Unexpected response format, returning curated data');
    return [];
  }

  return offices.map((o: any, i: number) => ({
    id: o.id || `uscis-${i}`,
    name: o.name || o.officeName || o.office_name || 'USCIS Office',
    type: mapOfficeType(o.type || o.officeType || o.office_type || ''),
    address: o.address || o.streetAddress || o.street_address || '',
    city: o.city || '',
    state: o.state || '',
    zip: o.zip || o.zipCode || o.zip_code || '',
    country: o.country || 'US',
    phone: o.phone || o.telephone || '(800) 375-5283',
    hours: o.hours || o.officeHours || 'Mon–Fri 7:30 AM – 3:30 PM',
    services: o.services || getDefaultServices(o.type || o.officeType || ''),
    website: o.website || o.url || 'https://www.uscis.gov',
    distance: o.distance ? `${o.distance} mi` : undefined,
    lat: o.latitude || o.lat,
    lng: o.longitude || o.lng,
  }));
}

function mapOfficeType(type: string): 'uscis' | 'embassy' | 'asc' {
  const t = type.toLowerCase();
  if (t.includes('asc') || t.includes('support')) return 'asc';
  if (t.includes('embassy') || t.includes('consulate') || t.includes('international')) return 'embassy';
  return 'uscis';
}

function getDefaultServices(type: string): string[] {
  const t = type.toLowerCase();
  if (t.includes('asc') || t.includes('support')) {
    return ['Biometrics', 'Fingerprinting', 'Photo Services'];
  }
  return ['Naturalization', 'Green Card', 'Work Permits', 'Travel Documents'];
}

// Curated dataset of real USCIS field offices with coordinates
const CURATED_OFFICES: (OfficeResult & { lat: number; lng: number })[] = [
  { id: 'fo-nyc', name: 'USCIS New York Field Office', type: 'uscis', address: '26 Federal Plaza, 3rd Floor', city: 'New York', state: 'NY', zip: '10278', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Travel Documents', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 40.7143, lng: -74.0022 },
  { id: 'asc-nyc', name: 'USCIS Application Support Center — Manhattan', type: 'asc', address: '201 Varick Street, Room 1020', city: 'New York', state: 'NY', zip: '10014', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 8:00 AM – 3:00 PM', services: ['Biometrics', 'Fingerprinting', 'Photo Services'], website: 'https://www.uscis.gov', lat: 40.7275, lng: -74.0054 },
  { id: 'fo-newark', name: 'USCIS Newark Field Office', type: 'uscis', address: '970 Broad Street, Room 136', city: 'Newark', state: 'NJ', zip: '07102', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Adjustment of Status', 'EAD', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 40.7357, lng: -74.1724 },
  { id: 'fo-la', name: 'USCIS Los Angeles Field Office', type: 'uscis', address: '300 N. Los Angeles St., Room 1001', city: 'Los Angeles', state: 'CA', zip: '90012', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Asylum', 'Work Permits'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 34.0564, lng: -118.2390 },
  { id: 'asc-la', name: 'USCIS Application Support Center — Los Angeles', type: 'asc', address: '1585 S. Manchester Ave', city: 'Anaheim', state: 'CA', zip: '92802', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 8:00 AM – 3:00 PM', services: ['Biometrics', 'Fingerprinting', 'Photo Services'], website: 'https://www.uscis.gov', lat: 33.8105, lng: -117.9146 },
  { id: 'fo-chicago', name: 'USCIS Chicago Field Office', type: 'uscis', address: '101 W. Congress Pkwy, Suite 400', city: 'Chicago', state: 'IL', zip: '60605', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 41.8762, lng: -87.6315 },
  { id: 'fo-miami', name: 'USCIS Miami Field Office', type: 'uscis', address: '8801 NW 7th Ave, Suite 100', city: 'Miami', state: 'FL', zip: '33150', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Asylum', 'Work Permits'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 25.8379, lng: -80.2099 },
  { id: 'fo-houston', name: 'USCIS Houston Field Office', type: 'uscis', address: '126 Northpoint Drive', city: 'Houston', state: 'TX', zip: '77060', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Travel Documents'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 29.9384, lng: -95.4146 },
  { id: 'fo-sf', name: 'USCIS San Francisco Field Office', type: 'uscis', address: '630 Sansome Street', city: 'San Francisco', state: 'CA', zip: '94111', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Adjustment of Status', 'EAD', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 37.7955, lng: -122.4025 },
  { id: 'fo-dc', name: 'USCIS Washington Field Office', type: 'uscis', address: '2675 Prosperity Ave', city: 'Fairfax', state: 'VA', zip: '22031', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 38.8589, lng: -77.2263 },
  { id: 'fo-dallas', name: 'USCIS Dallas Field Office', type: 'uscis', address: '8101 N. Stemmons Freeway', city: 'Dallas', state: 'TX', zip: '75247', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 32.8160, lng: -96.8721 },
  { id: 'fo-atlanta', name: 'USCIS Atlanta Field Office', type: 'uscis', address: '2150 Parklake Dr NE', city: 'Atlanta', state: 'GA', zip: '30345', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 33.8541, lng: -84.2794 },
  { id: 'fo-boston', name: 'USCIS Boston Field Office', type: 'uscis', address: 'JFK Federal Building, 15 New Sudbury St', city: 'Boston', state: 'MA', zip: '02203', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 42.3613, lng: -71.0595 },
  { id: 'fo-detroit', name: 'USCIS Detroit Field Office', type: 'uscis', address: '333 Mt. Elliott St', city: 'Detroit', state: 'MI', zip: '48207', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 42.3421, lng: -83.0249 },
  { id: 'fo-phoenix', name: 'USCIS Phoenix Field Office', type: 'uscis', address: '1820 E. Skyharbor Circle South, Suite 100', city: 'Phoenix', state: 'AZ', zip: '85034', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 33.4365, lng: -111.9893 },
  { id: 'fo-seattle', name: 'USCIS Seattle Field Office', type: 'uscis', address: '12500 Tukwila International Blvd', city: 'Tukwila', state: 'WA', zip: '98168', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 47.4848, lng: -122.2634 },
  { id: 'fo-denver', name: 'USCIS Denver Field Office', type: 'uscis', address: '12484 E. Weaver Place', city: 'Centennial', state: 'CO', zip: '80111', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 39.6086, lng: -104.8512 },
  { id: 'fo-philly', name: 'USCIS Philadelphia Field Office', type: 'uscis', address: '1600 Callowhill St', city: 'Philadelphia', state: 'PA', zip: '19130', country: 'US', phone: '(800) 375-5283', hours: 'Mon–Fri 7:30 AM – 3:30 PM', services: ['Naturalization', 'Green Card', 'Work Permits', 'Interviews'], website: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices', lat: 39.9617, lng: -75.1630 },
  // Embassies
  { id: 'emb-mexico', name: 'U.S. Embassy Mexico City', type: 'embassy', address: 'Paseo de la Reforma 305, Col. Cuauhtémoc', city: 'Mexico City', state: 'CDMX', zip: '06500', country: 'Mexico', phone: '+52 55 5080-2000', hours: 'Mon–Fri 8:00 AM – 5:00 PM', services: ['Visa Interviews', 'Passport Services', 'Notarial Services', 'Immigrant Visas'], website: 'https://mx.usembassy.gov', lat: 19.4271, lng: -99.1577 },
  { id: 'emb-toronto', name: 'U.S. Consulate General Toronto', type: 'embassy', address: '225 Simcoe St', city: 'Toronto', state: 'ON', zip: 'M5G 1S4', country: 'Canada', phone: '+1 416-595-1700', hours: 'Mon–Fri 8:30 AM – 12:00 PM', services: ['Non-Immigrant Visas', 'Emergency Services', 'Citizen Services'], website: 'https://ca.usembassy.gov', lat: 43.6509, lng: -79.3897 },
  { id: 'emb-london', name: 'U.S. Embassy London', type: 'embassy', address: '33 Nine Elms Lane', city: 'London', state: '', zip: 'SW11 7US', country: 'United Kingdom', phone: '+44 20 7499 9000', hours: 'Mon–Fri 8:00 AM – 4:30 PM', services: ['Visa Interviews', 'Passport Services', 'Citizen Services', 'Immigrant Visas'], website: 'https://uk.usembassy.gov', lat: 51.4816, lng: -0.1261 },
  { id: 'emb-manila', name: 'U.S. Embassy Manila', type: 'embassy', address: '1201 Roxas Boulevard', city: 'Manila', state: '', zip: '1000', country: 'Philippines', phone: '+63 2 5301-2000', hours: 'Mon–Fri 7:30 AM – 4:00 PM', services: ['Visa Interviews', 'Passport Services', 'Immigrant Visas', 'Citizen Services'], website: 'https://ph.usembassy.gov', lat: 14.5620, lng: 120.9788 },
  { id: 'emb-newdelhi', name: 'U.S. Embassy New Delhi', type: 'embassy', address: 'Shantipath, Chanakyapuri', city: 'New Delhi', state: '', zip: '110021', country: 'India', phone: '+91 11 2419-8000', hours: 'Mon–Fri 8:00 AM – 5:00 PM', services: ['Visa Interviews', 'Passport Services', 'Immigrant Visas', 'Citizen Services'], website: 'https://in.usembassy.gov', lat: 28.5978, lng: 77.1881 },
];

// Simple ZIP code to lat/lng mapping for distance calculation
const ZIP_COORDS: Record<string, [number, number]> = {
  '100': [40.71, -74.00], // NYC area
  '101': [40.71, -74.00],
  '110': [40.78, -73.95],
  '112': [40.65, -73.95],
  '070': [40.74, -74.17], // NJ
  '071': [40.74, -74.17],
  '900': [34.05, -118.24], // LA
  '902': [33.94, -118.23],
  '606': [41.88, -87.63], // Chicago
  '331': [25.84, -80.21], // Miami
  '770': [29.94, -95.41], // Houston
  '941': [37.80, -122.40], // SF
  '220': [38.86, -77.23], // DC
  '752': [32.82, -96.87], // Dallas
  '303': [33.85, -84.28], // Atlanta
  '021': [42.36, -71.06], // Boston
  '482': [42.34, -83.02], // Detroit
  '850': [33.44, -111.99], // Phoenix
  '981': [47.48, -122.26], // Seattle
  '801': [39.61, -104.85], // Denver
  '191': [39.96, -75.16], // Philly
};

function getApproxCoordsFromZip(zip: string): [number, number] | null {
  const prefix3 = zip.substring(0, 3);
  if (ZIP_COORDS[prefix3]) return ZIP_COORDS[prefix3];
  // Default to center of US
  return [39.8283, -98.5795];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getCuratedOffices(zipCode?: string, lat?: number, lng?: number, officeType?: string): OfficeResult[] {
  let userLat: number, userLng: number;

  if (lat && lng) {
    userLat = lat;
    userLng = lng;
  } else if (zipCode) {
    const coords = getApproxCoordsFromZip(zipCode);
    if (coords) {
      [userLat, userLng] = coords;
    } else {
      [userLat, userLng] = [39.8283, -98.5795];
    }
  } else {
    [userLat, userLng] = [39.8283, -98.5795];
  }

  let offices = CURATED_OFFICES;
  if (officeType && officeType !== 'all') {
    offices = offices.filter(o => o.type === officeType);
  }

  // Calculate distances and sort
  const withDistance = offices.map(o => ({
    ...o,
    distanceMiles: haversineDistance(userLat, userLng, o.lat, o.lng),
    distance: `${haversineDistance(userLat, userLng, o.lat, o.lng).toFixed(1)} mi`,
  }));

  withDistance.sort((a, b) => a.distanceMiles - b.distanceMiles);

  // Return top 10 nearest
  return withDistance.slice(0, 10).map(({ distanceMiles, ...rest }) => rest);
}
