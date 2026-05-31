import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Phone, Mail, MapPin, Globe, Shield, ChevronRight,
  Lock, ShieldCheck, FileCheck, Camera, Upload, Copy, DollarSign,
  Building2, Info, CheckCircle2, ScanLine, Pencil, Save, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePassportData } from "@/hooks/usePassportData";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

// USCIS filing addresses based on state and form type
const USCIS_ADDRESSES: Record<string, { label: string; address: string; forms: string[] }[]> = {
  lockbox_chicago: [
    { label: "USCIS Chicago Lockbox", address: "USCIS\nP.O. Box 805887\nChicago, IL 60680-4120", forms: ["I-130", "I-130A", "I-485", "I-765", "I-131", "I-864"] },
  ],
  lockbox_dallas: [
    { label: "USCIS Dallas Lockbox", address: "USCIS\nP.O. Box 650888\nDallas, TX 75265-0888", forms: ["I-90", "I-751", "N-400", "I-539"] },
  ],
  lockbox_phoenix: [
    { label: "USCIS Phoenix Lockbox", address: "USCIS\nP.O. Box 21281\nPhoenix, AZ 85036", forms: ["I-140", "I-129", "I-526"] },
  ],
  service_center_nebraska: [
    { label: "USCIS Nebraska Service Center", address: "USCIS Nebraska Service Center\nP.O. Box 87485\nLincoln, NE 68501-7485", forms: ["I-140", "I-129"] },
  ],
  service_center_texas: [
    { label: "USCIS Texas Service Center", address: "USCIS Texas Service Center\n6046 N Belt Line Rd\nIrving, TX 75038-0001", forms: ["I-140", "I-129", "I-539"] },
  ],
};

const FORM_OPTIONS = [
  { value: "I-130", label: "I-130 — Petition for Alien Relative" },
  { value: "I-485", label: "I-485 — Adjustment of Status" },
  { value: "I-765", label: "I-765 — Employment Authorization" },
  { value: "I-131", label: "I-131 — Travel Document" },
  { value: "I-864", label: "I-864 — Affidavit of Support" },
  { value: "N-400", label: "N-400 — Citizenship / Naturalization" },
  { value: "I-751", label: "I-751 — Remove Conditions on Residence" },
  { value: "I-90", label: "I-90 — Renew / Replace Green Card" },
  { value: "I-140", label: "I-140 — Immigrant Petition for Worker" },
  { value: "I-129", label: "I-129 — Nonimmigrant Worker Petition" },
  { value: "I-539", label: "I-539 — Extend / Change Nonimmigrant Status" },
  { value: "I-526", label: "I-526 — Immigrant Investor Petition" },
];

const STATE_REGIONS: Record<string, string> = {
  CT: "lockbox_chicago", DE: "lockbox_chicago", DC: "lockbox_chicago",
  ME: "lockbox_chicago", MD: "lockbox_chicago", MA: "lockbox_chicago",
  NH: "lockbox_chicago", NJ: "lockbox_chicago", NY: "lockbox_chicago",
  PA: "lockbox_chicago", RI: "lockbox_chicago", VT: "lockbox_chicago",
  VA: "lockbox_chicago", WV: "lockbox_chicago",
  AL: "lockbox_dallas", AR: "lockbox_dallas", FL: "lockbox_dallas",
  GA: "lockbox_dallas", KY: "lockbox_dallas", LA: "lockbox_dallas",
  MS: "lockbox_dallas", NC: "lockbox_dallas", SC: "lockbox_dallas",
  TN: "lockbox_dallas", TX: "lockbox_dallas", OK: "lockbox_dallas",
  AZ: "lockbox_phoenix", CA: "lockbox_phoenix", CO: "lockbox_phoenix",
  HI: "lockbox_phoenix", ID: "lockbox_phoenix", MT: "lockbox_phoenix",
  NV: "lockbox_phoenix", NM: "lockbox_phoenix", OR: "lockbox_phoenix",
  UT: "lockbox_phoenix", WA: "lockbox_phoenix", WY: "lockbox_phoenix",
  IL: "lockbox_chicago", IN: "lockbox_chicago", IA: "lockbox_chicago",
  KS: "lockbox_dallas", MI: "lockbox_chicago", MN: "lockbox_chicago",
  MO: "lockbox_dallas", NE: "lockbox_chicago", ND: "lockbox_chicago",
  OH: "lockbox_chicago", SD: "lockbox_chicago", WI: "lockbox_chicago",
  AK: "lockbox_phoenix",
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM",
  "NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

function getMailingAddresses(state: string, formType: string) {
  const regionKey = STATE_REGIONS[state];
  if (!regionKey) return [];
  const allAddresses = Object.values(USCIS_ADDRESSES).flat();
  const byForm = allAddresses.filter(a => a.forms.includes(formType));
  if (byForm.length > 0) return byForm;
  return USCIS_ADDRESSES[regionKey] || [];
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];

const ImmigrationPassport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: passportData, isLoading } = usePassportData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [passportPages, setPassportPages] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [selectedForm, setSelectedForm] = useState("");
  const [selectedState, setSelectedState] = useState("");

  // Inline editing state
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [personalForm, setPersonalForm] = useState({
    first_name: "", last_name: "", middle_name: "",
    date_of_birth: "", gender: "", nationality: "",
    country_of_birth: "", city_of_birth: "",
  });
  const [contactForm, setContactForm] = useState({
    phone: "", email: "",
  });
  const [addressForm, setAddressForm] = useState({
    street: "", apt: "", city: "", state: "", zip: "", country: "US",
  });

  // Sync from passport data
  useEffect(() => {
    if (!passportData) return;
    const id = passportData.identity;
    if (id) {
      setPersonalForm({
        first_name: id.firstName || "",
        last_name: id.lastName || "",
        middle_name: id.middleName || "",
        date_of_birth: id.dateOfBirth || "",
        gender: id.gender || "",
        nationality: id.nationality || "",
        country_of_birth: id.countryOfBirth || "",
        city_of_birth: id.cityOfBirth || "",
      });
      setContactForm({
        phone: id.phone || "",
        email: id.email || user?.email || "",
      });
    } else {
      setContactForm(prev => ({ ...prev, email: user?.email || "" }));
    }
    const addr = passportData.addresses?.[0];
    if (addr) {
      setAddressForm({
        street: addr.street || "",
        apt: addr.apt || "",
        city: addr.city || "",
        state: addr.state || "",
        zip: addr.zip || "",
        country: addr.country || "US",
      });
    }
  }, [passportData, user?.email]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const identity = passportData?.identity;
  const fullName = identity ? `${identity.firstName} ${identity.lastName}` : displayName;

  const referralCode = (displayName.toLowerCase().replace(/\s+/g, "") + (user?.id?.slice(0, 4) || "0000"));
  const referralLink = `dome.xyz/ref/${referralCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://${referralLink}`);
    toast.success("Referral link copied!");
  };

  // Helper: get the primary person ID for this user
  const getPrimaryPersonId = async (): Promise<string | null> => {
    if (!user?.id) return null;
    const { data: participations } = await supabase
      .from("case_participants").select("case_id").eq("user_id", user.id);
    const caseIds = participations?.map(p => p.case_id) ?? [];
    if (caseIds.length === 0) return null;
    const { data: persons } = await supabase
      .from("persons_safe").select("id, role").in("case_id", caseIds);
    const primary = persons?.find(p => p.role === "beneficiary")
      || persons?.find(p => p.role === "petitioner")
      || persons?.[0];
    return primary?.id ?? null;
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["passport-data"] });
    queryClient.invalidateQueries({ queryKey: ["packet-builder"] });
  };

  // Save personal info
  const handleSavePersonal = async () => {
    setSavingPersonal(true);
    try {
      const personId = await getPrimaryPersonId();
      if (!personId) { toast.error("No case found. Please start a case first."); return; }

      const { error } = await supabase.from("persons" as any).update({
        first_name: personalForm.first_name,
        last_name: personalForm.last_name,
        middle_name: personalForm.middle_name || null,
        date_of_birth: personalForm.date_of_birth || null,
        gender: personalForm.gender || null,
        nationality: personalForm.nationality || null,
        country_of_birth: personalForm.country_of_birth || null,
        city_of_birth: personalForm.city_of_birth || null,
      } as any).eq("id", personId);
      if (error) throw error;

      // Also update profile
      await supabase.from("profiles").update({
        first_name: personalForm.first_name,
        last_name: personalForm.last_name,
      }).eq("user_id", user!.id);

      invalidateAll();
      setEditingPersonal(false);
      toast.success("Personal info saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSavingPersonal(false);
    }
  };

  // Save contact info
  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      const personId = await getPrimaryPersonId();
      if (!personId) { toast.error("No case found. Please start a case first."); return; }

      const { error } = await supabase.from("persons" as any).update({
        phone: contactForm.phone || null,
        email: contactForm.email || null,
      } as any).eq("id", personId);
      if (error) throw error;

      await supabase.from("profiles").update({ phone: contactForm.phone }).eq("user_id", user!.id);

      invalidateAll();
      setEditingContact(false);
      toast.success("Contact info saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSavingContact(false);
    }
  };

  // Save address
  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      const personId = await getPrimaryPersonId();
      if (!personId) { toast.error("No case found. Please start a case first."); return; }

      // Upsert: update existing current address or insert new one
      const { data: existing } = await supabase
        .from("addresses").select("id").eq("person_id", personId).eq("is_current", true).limit(1);

      if (existing && existing.length > 0) {
        const { error } = await supabase.from("addresses").update({
          street: addressForm.street || null,
          apt: addressForm.apt || null,
          city: addressForm.city || null,
          state: addressForm.state || null,
          zip: addressForm.zip || null,
          country: addressForm.country || "US",
        }).eq("id", existing[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("addresses").insert({
          person_id: personId,
          address_type: "mailing",
          street: addressForm.street || null,
          apt: addressForm.apt || null,
          city: addressForm.city || null,
          state: addressForm.state || null,
          zip: addressForm.zip || null,
          country: addressForm.country || "US",
          is_current: true,
        });
        if (error) throw error;
      }

      // Also update profile
      await supabase.from("profiles").update({
        home_address: addressForm.street,
        home_city: addressForm.city,
        home_state: addressForm.state,
        home_zip: addressForm.zip,
        home_country: addressForm.country,
      } as any).eq("user_id", user!.id);

      invalidateAll();
      setEditingAddress(false);
      toast.success("Address saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id) return;
    setUploading(true);
    try {
      const newPages: { name: string; url: string }[] = [];
      // Get case ID for document registration
      const { data: participations } = await supabase
        .from("case_participants").select("case_id").eq("user_id", user.id).limit(1);
      const caseId = participations?.[0]?.case_id;

      for (const file of Array.from(files)) {
        const filePath = `${user.id}/passport/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("case-documents").upload(filePath, file, { upsert: true });
        if (error) { toast.error(`Failed to upload ${file.name}`); continue; }

        // Register in documents table so PacketBuilder recognizes it
        if (caseId) {
          await supabase.from("documents").insert({
            case_id: caseId,
            name: file.name,
            category: "identity",
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            status: "uploaded" as any,
            uploaded_by: user.id,
          });
        }

        const url = URL.createObjectURL(file);
        newPages.push({ name: file.name, url });
      }

      setPassportPages(prev => [...prev, ...newPages]);
      if (newPages.length > 0) {
        toast.success(`${newPages.length} passport page(s) uploaded`);
        invalidateAll();
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const mailingResults = selectedState && selectedForm ? getMailingAddresses(selectedState, selectedForm) : [];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-28">
      {/* Header */}
      <div className="bg-primary rounded-xl p-5 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold">Immigration Passport Profile</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">
          Receive important alerts and securely message your attorney.
        </p>
      </div>

      {/* Avatar & Name */}
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">{fullName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* ── PASSPORT SCAN / UPLOAD ── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-secondary" />
            <h3 className="font-display font-bold text-base">Passport Pages</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload or scan your passport bio page and any visa stamp pages. These are stored securely and encrypted.
          </p>

          {passportPages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {passportPages.map((page, i) => (
                <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={page.url} alt={page.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur-sm px-2 py-1">
                    <p className="text-[10px] text-foreground truncate">{page.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Also show documents from DB */}
          {(passportData?.documents?.filter(d => d.category === "identity") ?? []).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Previously Uploaded</p>
              {passportData!.documents.filter(d => d.category === "identity").map((doc, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
                  <FileCheck className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="truncate">{doc.name}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{doc.status}</Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
            <Button variant="outline" className="flex-1 gap-2" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
              <Camera className="w-4 h-4" /> Take Photo
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4" /> Upload File
            </Button>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              Uploading…
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="w-3 h-3" /><span>End-to-end encrypted · AES-256</span>
            <ShieldCheck className="w-3 h-3 ml-2" /><span>Private & Secure</span>
          </div>
        </CardContent>
      </Card>

      {/* ── PERSONAL INFO ── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base">Personal Info</h3>
            {!editingPersonal ? (
              <Button variant="ghost" size="sm" className="gap-1 text-secondary" onClick={() => setEditingPersonal(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingPersonal(false)}>Cancel</Button>
                <Button size="sm" className="gap-1" onClick={handleSavePersonal} disabled={savingPersonal}>
                  {savingPersonal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </Button>
              </div>
            )}
          </div>

          {!editingPersonal ? (
            <div className="space-y-2.5">
              <InfoRow label="Full Name" value={fullName} bold />
              {identity?.middleName && <InfoRow label="Other Names" value={identity.middleName} />}
              <InfoRow label="Date of Birth" value={identity?.dateOfBirth || "Not provided"} />
              <InfoRow label="Gender" value={identity?.gender || "Not provided"} />
              <InfoRow label="Nationality" value={identity?.nationality || "Not provided"} />
              <InfoRow label="Country of Birth" value={identity?.countryOfBirth || "Not provided"} />
              {identity?.cityOfBirth && <InfoRow label="City of Birth" value={identity.cityOfBirth} />}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">First Name</Label>
                  <Input value={personalForm.first_name} onChange={e => setPersonalForm(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Last Name</Label>
                  <Input value={personalForm.last_name} onChange={e => setPersonalForm(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Middle Name / Other Names</Label>
                <Input value={personalForm.middle_name} onChange={e => setPersonalForm(p => ({ ...p, middle_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Date of Birth</Label>
                  <Input type="date" value={personalForm.date_of_birth} onChange={e => setPersonalForm(p => ({ ...p, date_of_birth: e.target.value }))} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Gender</Label>
                  <Select value={personalForm.gender} onValueChange={v => setPersonalForm(p => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Nationality</Label>
                  <Input value={personalForm.nationality} onChange={e => setPersonalForm(p => ({ ...p, nationality: e.target.value }))} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Country of Birth</Label>
                  <Input value={personalForm.country_of_birth} onChange={e => setPersonalForm(p => ({ ...p, country_of_birth: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1"><Label className="text-xs">City of Birth</Label>
                <Input value={personalForm.city_of_birth} onChange={e => setPersonalForm(p => ({ ...p, city_of_birth: e.target.value }))} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── CONTACT INFO ── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base">Contact Info</h3>
            {!editingContact ? (
              <Button variant="ghost" size="sm" className="gap-1 text-secondary" onClick={() => setEditingContact(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingContact(false)}>Cancel</Button>
                <Button size="sm" className="gap-1" onClick={handleSaveContact} disabled={savingContact}>
                  {savingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </Button>
              </div>
            )}
          </div>

          {!editingContact ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-secondary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">Phone <span className="font-medium ml-2">{identity?.phone || contactForm.phone || "Not provided"}</span></p>
                  <p className="text-sm">Email <span className="font-medium ml-2">{user?.email || "Not provided"}</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1"><Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
                <Input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 123-4567" />
              </div>
              <div className="space-y-1"><Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
                <Input value={contactForm.email} disabled className="bg-muted" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── CURRENT ADDRESS ── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-destructive" /> Current Address
            </h3>
            {!editingAddress ? (
              <Button variant="ghost" size="sm" className="gap-1 text-secondary" onClick={() => setEditingAddress(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingAddress(false)}>Cancel</Button>
                <Button size="sm" className="gap-1" onClick={handleSaveAddress} disabled={savingAddress}>
                  {savingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </Button>
              </div>
            )}
          </div>

          {!editingAddress ? (
            <p className="text-sm text-muted-foreground">
              {passportData?.addresses?.[0]
                ? `${passportData.addresses[0].street || ""}${passportData.addresses[0].apt ? `, Apt ${passportData.addresses[0].apt}` : ""}, ${passportData.addresses[0].city || ""}, ${passportData.addresses[0].state || ""} ${passportData.addresses[0].zip || ""}`
                : "No address on file — tap Edit to add"
              }
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1"><Label className="text-xs">Street Address</Label>
                <Input value={addressForm.street} onChange={e => setAddressForm(p => ({ ...p, street: e.target.value }))} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">Apt / Unit</Label>
                  <Input value={addressForm.apt} onChange={e => setAddressForm(p => ({ ...p, apt: e.target.value }))} />
                </div>
                <div className="space-y-1 col-span-2"><Label className="text-xs">City</Label>
                  <Input value={addressForm.city} onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">State</Label>
                  <Select value={addressForm.state} onValueChange={v => setAddressForm(p => ({ ...p, state: v }))}>
                    <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">ZIP</Label>
                  <Input value={addressForm.zip} onChange={e => setAddressForm(p => ({ ...p, zip: e.target.value }))} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Country</Label>
                  <Input value={addressForm.country} onChange={e => setAddressForm(p => ({ ...p, country: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Info */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-base mb-3">Key Info</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-sm flex-1">
                <span className="font-semibold">Passport</span> {identity?.passportCountry || "—"} {identity?.passportNumber ? `····${identity.passportNumber.slice(-4)}` : "Not on file"}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-sm flex-1">
                <span className="font-semibold">Citizen of</span> {identity?.nationality || "Not specified"}
              </p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── USCIS MAILING ADDRESS LOOKUP ── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-base">Where to Mail Your Application</h3>
          </div>
          <p className="text-sm text-muted-foreground">Select your state and form type to find the correct USCIS mailing address.</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Your State</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Form Type</label>
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger><SelectValue placeholder="Form" /></SelectTrigger>
                <SelectContent>{FORM_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {mailingResults.length > 0 && (
            <div className="space-y-3">
              {mailingResults.map((addr, i) => (
                <div key={i} className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-semibold text-foreground mb-1">{addr.label}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line font-mono">{addr.address}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {addr.forms.map(f => <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedState && selectedForm && mailingResults.length === 0 && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border text-center">
              <p className="text-sm text-muted-foreground">
                Filing address not found. Please check <a href="https://www.uscis.gov/forms" target="_blank" rel="noopener noreferrer" className="text-secondary underline">uscis.gov/forms</a> for the most current address.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>Addresses are for general guidance. Always confirm at <a href="https://www.uscis.gov" target="_blank" rel="noopener noreferrer" className="underline">uscis.gov</a> before mailing.</span>
          </div>
        </CardContent>
      </Card>

      {/* ── REFERRAL / AFFILIATE SECTION ── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary" />
              <h3 className="font-display font-bold text-base">Earn with Referrals</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">Optional</Badge>
          </div>

          {!showReferral ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Want to earn money by inviting friends and family to D.O.M.E.?</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0" /><span>$5 per paid signup</span></div>
                <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0" /><span>$10 per export packet purchased</span></div>
                <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0" /><span>$1 recurring monthly commission</span></div>
              </div>
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2" onClick={() => setShowReferral(true)}>
                <DollarSign className="w-4 h-4" /> Activate My Referral Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground font-medium">Your Referral Link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm text-muted-foreground font-mono truncate">{referralLink}</div>
                <Button onClick={handleCopyReferral} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4">
                  <Copy className="w-4 h-4 mr-1.5" /> Copy
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Share this link anywhere. You earn whether or not you use D.O.M.E. yourself.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Profile CTA */}
      <Button onClick={() => navigate("/portal/profile")} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 h-12 text-base">
        Manage Full Profile <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground/60 text-center pb-2">
        D.O.M.E. provides educational tools and document organization. D.O.M.E. does not provide legal advice.
      </p>
      <div className="flex justify-center gap-3 text-xs text-muted-foreground pb-2">
        <a href="/privacy" className="hover:underline">Privacy Policy</a>
        <span>·</span>
        <a href="/terms" className="hover:underline">Terms</a>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={bold ? "font-semibold" : "font-medium"}>{value}</span>
  </div>
);

export default ImmigrationPassport;
