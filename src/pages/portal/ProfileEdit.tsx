import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Save, ArrowLeft, Camera, Loader2, Phone, Mail, User, MapPin, Globe, Upload, FileCheck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LanguagePreferencesCard from "@/components/communication/LanguagePreferencesCard";

const ProfileEdit = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const verificationFileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVerification, setUploadingVerification] = useState(false);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    phone: "",
    email: "",
    bio: "",
    avatar_url: "",
    home_address: "",
    home_city: "",
    home_state: "",
    home_zip: "",
    home_country: "US",
    foreign_address: "",
    foreign_city: "",
    foreign_country: "",
  });
  const [verificationForm, setVerificationForm] = useState({
    license_number: "",
    issuing_authority: "",
    issued_date: "",
    expiration_date: "",
    renewal_date: "",
  });

  const isAttorney = roles.includes("attorney");
  const isAccreditedRep = roles.includes("practitioner") && !roles.includes("admin");
  const needsVerification = isAttorney || isAccreditedRep;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            display_name: data.display_name || "",
            phone: data.phone || "",
            email: data.email || user.email || "",
            bio: (data as any).bio || "",
            avatar_url: data.avatar_url || "",
            home_address: (data as any).home_address || "",
            home_city: (data as any).home_city || "",
            home_state: (data as any).home_state || "",
            home_zip: (data as any).home_zip || "",
            home_country: (data as any).home_country || "US",
            foreign_address: (data as any).foreign_address || "",
            foreign_city: (data as any).foreign_city || "",
            foreign_country: (data as any).foreign_country || "",
          });
        }
      });

    // Load verification documents
    if (needsVerification) {
      supabase
        .from("professional_verifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setVerifications(data as any[]);
        });
    }
  }, [user, needsVerification]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please choose an image under 2MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
      setForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast({ title: "Photo updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB for verification documents.", variant: "destructive" });
      return;
    }
    setUploadingVerification(true);
    try {
      const ext = file.name.split(".").pop();
      const docType = isAttorney ? "bar_license" : "doj_approval_letter";
      const filePath = `${user.id}/${docType}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("verification-docs").upload(filePath, file);
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase.from("professional_verifications" as any).insert({
        user_id: user.id,
        document_type: docType,
        file_path: filePath,
        file_name: file.name,
        license_number: verificationForm.license_number || null,
        issuing_authority: verificationForm.issuing_authority || null,
        issued_date: verificationForm.issued_date || null,
        expiration_date: verificationForm.expiration_date || null,
        renewal_date: verificationForm.renewal_date || null,
        status: "pending_review",
      } as any);
      if (insertErr) throw insertErr;

      // Reload verifications
      const { data } = await supabase
        .from("professional_verifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setVerifications(data as any[]);

      setVerificationForm({ license_number: "", issuing_authority: "", issued_date: "", expiration_date: "", renewal_date: "" });
      toast({ title: "Document uploaded", description: "Your document has been submitted for CCGV review and approval." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingVerification(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        first_name: form.first_name,
        last_name: form.last_name,
        display_name: form.display_name,
        phone: form.phone,
        bio: form.bio,
        home_address: form.home_address,
        home_city: form.home_city,
        home_state: form.home_state,
        home_zip: form.home_zip,
        home_country: form.home_country,
        foreign_address: form.foreign_address || null,
        foreign_city: form.foreign_city || null,
        foreign_country: form.foreign_country || null,
      } as any, { onConflict: "user_id" });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-600 text-white">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "expired": return <Badge variant="outline" className="text-orange-600 border-orange-600">Expired</Badge>;
      default: return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  const initials = `${form.first_name?.[0] || ""}${form.last_name?.[0] || ""}`.toUpperCase() || "U";

  const roleBadge = isAttorney ? "LAWYER / ATTORNEY AT LAW" : isAccreditedRep ? "A & R DOJ REPRESENTATIVE" : "CLIENT";

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div className="bg-primary rounded-xl p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Edit Profile</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">Update your personal information</p>
          </div>
          <span className="text-[10px] font-bold tracking-wide px-2 py-1 rounded bg-white/20 uppercase">
            {roleBadge}
          </span>
        </div>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardContent className="p-5 flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              <AvatarImage src={form.avatar_url} alt={form.display_name} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-md hover:bg-secondary/90 transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <p className="text-xs text-muted-foreground">Tap the camera icon to change your photo</p>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <User className="w-4 h-4 text-secondary" /> Personal Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Display Name</Label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A brief introduction about yourself..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-secondary" /> Contact Information
          </h2>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 123-4567" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</Label>
            <Input value={form.email} disabled className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* Home Address */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-secondary" /> Home Address
          </h2>
          <div className="space-y-1.5">
            <Label>Street Address</Label>
            <Input value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.home_city} onChange={(e) => setForm({ ...form, home_city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={form.home_state} onChange={(e) => setForm({ ...form, home_state: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>ZIP</Label>
              <Input value={form.home_zip} onChange={(e) => setForm({ ...form, home_zip: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={form.home_country} onChange={(e) => setForm({ ...form, home_country: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Foreign/Previous Address */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-secondary" /> Previous / Foreign Address
          </h2>
          <p className="text-xs text-muted-foreground">Often required on immigration forms</p>
          <div className="space-y-1.5">
            <Label>Street Address</Label>
            <Input value={form.foreign_address} onChange={(e) => setForm({ ...form, foreign_address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.foreign_city} onChange={(e) => setForm({ ...form, foreign_city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input value={form.foreign_country} onChange={(e) => setForm({ ...form, foreign_country: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language & Communication Preferences */}
      <LanguagePreferencesCard />

      {/* Verification Documents - Attorneys & A&R DOJ Reps only */}
      {needsVerification && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-secondary" />
              {isAttorney ? "Attorney Verification" : "DOJ Accreditation Verification"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isAttorney
                ? "Upload your bar license or credentials. CCGV will verify and provide approval to continue doing business with us."
                : "Upload your letter of approval from DOJ to work or represent others under immigration services. CCGV will verify and provide approval."}
            </p>

            {/* Existing verifications */}
            {verifications.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Submitted Documents</Label>
                {verifications.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{v.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.expiration_date ? `Expires: ${v.expiration_date}` : "No expiration set"}
                          {v.renewal_date ? ` · Renewal: ${v.renewal_date}` : ""}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(v.status)}
                  </div>
                ))}
              </div>
            )}

            {/* Upload new verification */}
            <div className="border-t pt-4 space-y-3">
              <Label className="font-semibold">Upload New Document</Label>
              {isAttorney && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">License / Bar Number</Label>
                    <Input value={verificationForm.license_number} onChange={(e) => setVerificationForm({ ...verificationForm, license_number: e.target.value })} placeholder="BAR-12345" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Issuing Authority</Label>
                    <Input value={verificationForm.issuing_authority} onChange={(e) => setVerificationForm({ ...verificationForm, issuing_authority: e.target.value })} placeholder="State Bar of..." />
                  </div>
                </div>
              )}
              {isAccreditedRep && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Issuing Authority</Label>
                  <Input value={verificationForm.issuing_authority} onChange={(e) => setVerificationForm({ ...verificationForm, issuing_authority: e.target.value })} placeholder="DOJ Board of Immigration Appeals" />
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Issued Date</Label>
                  <Input type="date" value={verificationForm.issued_date} onChange={(e) => setVerificationForm({ ...verificationForm, issued_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expiration Date</Label>
                  <Input type="date" value={verificationForm.expiration_date} onChange={(e) => setVerificationForm({ ...verificationForm, expiration_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Renewal Date</Label>
                  <Input type="date" value={verificationForm.renewal_date} onChange={(e) => setVerificationForm({ ...verificationForm, renewal_date: e.target.value })} />
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => verificationFileRef.current?.click()}
                disabled={uploadingVerification}
              >
                {uploadingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingVerification ? "Uploading..." : "Select & Upload Document"}
              </Button>
              <input ref={verificationFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleVerificationUpload} className="hidden" />

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  All uploaded documents will be reviewed by CCGV. You will receive a notification once your verification is approved or if additional information is needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={loading} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
        <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};

export default ProfileEdit;
