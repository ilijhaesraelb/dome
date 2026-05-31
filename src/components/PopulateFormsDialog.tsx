import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, User, MapPin, Briefcase, Globe, Users, FileText, Zap, ArrowRight, Loader2 } from "lucide-react";
import { ClientProfile, formFieldMappings, Application } from "@/data/mockData";

interface PopulateFormsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ClientProfile;
  applications: Application[];
  onPopulate: (populatedApps: Application[]) => void;
}

const PopulateFormsDialog = ({ open, onOpenChange, profile, applications, onPopulate }: PopulateFormsDialogProps) => {
  const [populating, setPopulating] = useState(false);
  const [populated, setPopulated] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePopulate = () => {
    setPopulating(true);
    setProgress(0);

    // Simulate progressive population
    const totalForms = applications.length;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setProgress(Math.round((current / totalForms) * 100));
      if (current >= totalForms) {
        clearInterval(interval);
        setPopulating(false);
        setPopulated(true);

        // Update application statuses
        const updated = applications.map(app => ({
          ...app,
          progress: Math.min(app.progress + 40, 100),
          status: app.status === "not_started" ? "in_progress" as const : app.status,
          lastUpdated: new Date().toISOString().split("T")[0],
        }));
        onPopulate(updated);
      }
    }, 600);
  };

  const handleClose = () => {
    setPopulated(false);
    setProgress(0);
    onOpenChange(false);
  };

  const fullName = `${profile.firstName} ${profile.middleName ? profile.middleName + " " : ""}${profile.lastName}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            One-Click Data Population
          </DialogTitle>
          <DialogDescription>
            Review the client profile below. Clicking "Populate All Forms" will auto-fill shared fields across all forms in the package.
          </DialogDescription>
        </DialogHeader>

        {populated ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-display font-semibold">Forms Populated Successfully</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Client data has been applied to {applications.length} forms. Fields were auto-filled from the canonical profile. Please review each form for accuracy.
            </p>
            <div className="space-y-2 max-w-sm mx-auto">
              {applications.map(app => {
                const mapping = formFieldMappings[app.formType];
                return (
                  <div key={app.id} className="flex items-center justify-between p-2.5 rounded-lg bg-success/5 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="font-medium">{app.formType}</span>
                    </div>
                    <span className="text-muted-foreground">{mapping?.fields.length ?? 0} fields</span>
                  </div>
                );
              })}
            </div>
            <Button onClick={handleClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="profile" className="gap-1.5"><User className="w-3.5 h-3.5" />Profile</TabsTrigger>
                <TabsTrigger value="mapping" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Form Mapping</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                {/* Identity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2"><User className="w-4 h-4" />Identity</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Full Name:</span> {fullName}</div>
                    <div><span className="text-muted-foreground">DOB:</span> {profile.dateOfBirth}</div>
                    <div><span className="text-muted-foreground">Country of Birth:</span> {profile.countryOfBirth}</div>
                    <div><span className="text-muted-foreground">City of Birth:</span> {profile.cityOfBirth}</div>
                    <div><span className="text-muted-foreground">Nationality:</span> {profile.nationality}</div>
                    <div><span className="text-muted-foreground">Gender:</span> {profile.gender}</div>
                    <div><span className="text-muted-foreground">SSN:</span> {profile.ssn}</div>
                    <div><span className="text-muted-foreground">A-Number:</span> {profile.alienNumber}</div>
                    <div><span className="text-muted-foreground">Passport:</span> {profile.passportNumber} ({profile.passportCountry})</div>
                    <div><span className="text-muted-foreground">Passport Expiry:</span> {profile.passportExpiry}</div>
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2"><MapPin className="w-4 h-4" />Current Address</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>{profile.currentAddress.street}{profile.currentAddress.apt ? `, ${profile.currentAddress.apt}` : ""}</p>
                    <p>{profile.currentAddress.city}, {profile.currentAddress.state} {profile.currentAddress.zip}</p>
                    <p className="text-muted-foreground">Since {profile.currentAddress.since}</p>
                  </CardContent>
                </Card>

                {/* Family */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2"><Users className="w-4 h-4" />Family</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Marital Status:</span> {profile.maritalStatus}</div>
                    {profile.spouse && (
                      <div><span className="text-muted-foreground">Spouse:</span> {profile.spouse.firstName} {profile.spouse.lastName} (DOB: {profile.spouse.dateOfBirth}, {profile.spouse.countryOfBirth})</div>
                    )}
                    <div><span className="text-muted-foreground">Father:</span> {profile.fatherName} (DOB: {profile.fatherDOB}, {profile.fatherCountryOfBirth})</div>
                    <div><span className="text-muted-foreground">Mother:</span> {profile.motherName} (DOB: {profile.motherDOB}, {profile.motherCountryOfBirth})</div>
                    {profile.children.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Children:</span>
                        {profile.children.map((c, i) => (
                          <span key={i} className="ml-1">{c.firstName} {c.lastName} ({c.dateOfBirth}){i < profile.children.length - 1 ? "," : ""}</span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Employment */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2"><Briefcase className="w-4 h-4" />Employment History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.employmentHistory.map((emp, i) => (
                      <div key={i} className="text-sm">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{emp.jobTitle}</p>
                          {emp.current && <Badge variant="outline" className="text-xs">Current</Badge>}
                        </div>
                        <p className="text-muted-foreground">{emp.employer}</p>
                        <p className="text-xs text-muted-foreground">{emp.startDate} – {emp.current ? "Present" : emp.endDate}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Immigration */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2"><Globe className="w-4 h-4" />Immigration History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.immigrationHistory.map((entry, i) => (
                      <div key={i} className="text-sm">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entry.visaType}</p>
                          <Badge variant="outline" className="text-xs">{entry.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Entry: {entry.dateOfEntry} via {entry.portOfEntry} · I-94: {entry.i94Number}</p>
                      </div>
                    ))}
                    {profile.previousFilings.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Previous Filings</p>
                        {profile.previousFilings.map((f, i) => (
                          <p key={i} className="text-xs text-muted-foreground">{f.formType} – {f.filingDate} – {f.result} ({f.receiptNumber})</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Form Mapping Tab */}
              <TabsContent value="mapping" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The following fields from the client profile will be populated into each form:
                </p>
                {applications.map(app => {
                  const mapping = formFieldMappings[app.formType];
                  if (!mapping) return null;
                  return (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-display font-semibold">{app.formType}</p>
                            <p className="text-xs text-muted-foreground">{mapping.label}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                          <span className="text-sm font-medium">{mapping.fields.length} fields</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {mapping.fields.map(field => (
                            <Badge key={field} variant="outline" className="text-xs">{field}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>

            {populating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Populating forms...
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={populating}>Cancel</Button>
              <Button onClick={handlePopulate} disabled={populating} className="gap-1.5">
                {populating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Populating...</>
                ) : (
                  <><Zap className="w-4 h-4" />Populate All Forms</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PopulateFormsDialog;
