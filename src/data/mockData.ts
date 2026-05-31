export type CaseStatus = "intake" | "documents_pending" | "under_review" | "submitted" | "approved" | "denied";
export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "done";
export type DocStatus = "pending" | "approved" | "rejected";
export type ApplicationStatus = "not_started" | "started" | "in_progress" | "completed" | "ready_for_review" | "submitted" | "approved" | "denied";
export type EvidenceQuality = "complete" | "missing" | "low_quality";
export type WorkflowStatus = "draft" | "client_completed" | "ready_for_review" | "returned_for_fixes" | "approved_to_submit" | "submitted";

export interface Case {
  id: string;
  caseNumber: string;
  clientName: string;
  clientEmail: string;
  caseType: string;
  visaType: string;
  packageForms: string[];
  status: CaseStatus;
  priority: Priority;
  assignedTo: string;
  representative: string;
  deadline: string;
  createdAt: string;
  notes: string;
  readinessScore: number;
  formsCompletion: number;
  evidenceCompletion: number;
  consistencyScore: number;
}

export interface Application {
  id: string;
  caseId: string;
  formType: string;
  formName: string;
  status: ApplicationStatus;
  progress: number;
  lastUpdated: string;
  assignedTo: string;
}

export interface Evidence {
  id: string;
  caseId: string;
  name: string;
  category: string;
  quality: EvidenceQuality;
  uploadedBy: string;
  uploadDate: string;
  linkedForms: string[];
  fileType: string;
}

export interface TimelineEntry {
  id: string;
  caseId: string;
  date: string;
  title: string;
  description: string;
  type: "system" | "user" | "uscis" | "milestone";
  actor?: string;
}

export interface CaseMessage {
  id: string;
  caseId: string;
  sender: string;
  senderRole: "practitioner" | "client" | "system";
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Payment {
  id: string;
  caseId: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  paidDate?: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  author: string;
  content: string;
  createdAt: string;
  pinned: boolean;
}

export interface ConsistencyIssue {
  id: string;
  caseId: string;
  severity: "error" | "warning" | "info";
  field: string;
  description: string;
  forms: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  caseId: string;
  caseName: string;
  assignedTo: string;
  dueDate: string;
  status: TaskStatus;
  priority: Priority;
}

export interface Document {
  id: string;
  name: string;
  category: string;
  caseId: string;
  caseName: string;
  uploadedBy: string;
  uploadDate: string;
  status: DocStatus;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "hearing" | "deadline" | "meeting";
  caseId?: string;
  caseName?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  activeCases: number;
  joinedDate: string;
  avatarInitials: string;
}

// ── Supported Form Types ──
export const supportedForms: Record<string, string> = {
  "I-130": "Petition for Alien Relative",
  "I-485": "Adjustment of Status",
  "I-765": "Employment Authorization",
  "I-131": "Travel Document",
  "I-539": "Extension of Stay",
  "N-400": "Naturalization",
  "I-751": "Remove Conditions on Residence",
  "DS-160": "Nonimmigrant Visa Application",
  "I-20": "Certificate of Eligibility (Student)",
};

// ── Mock Cases (expanded) ──
export const mockCases: Case[] = [
  { id: "1", caseNumber: "JD-2026-0001", clientName: "Maria Santos", clientEmail: "maria@email.com", caseType: "Adjustment of Status", visaType: "Family-Based", packageForms: ["I-130", "I-485", "I-765", "I-131"], status: "under_review", priority: "high", assignedTo: "Sarah Chen", representative: "AREI Group – Accredited Representative", deadline: "2026-04-15", createdAt: "2026-01-10", notes: "Family petition with concurrent filing", readinessScore: 82, formsCompletion: 90, evidenceCompletion: 70, consistencyScore: 85 },
  { id: "2", caseNumber: "AK-2026-0002", clientName: "Ahmed Khan", clientEmail: "ahmed@email.com", caseType: "National Interest Waiver", visaType: "EB-2 NIW", packageForms: ["I-140", "I-485", "I-765"], status: "documents_pending", priority: "medium", assignedTo: "Sarah Chen", representative: "AREI Group – Accredited Representative", deadline: "2026-05-01", createdAt: "2026-02-05", notes: "Waiting on recommendation letters", readinessScore: 55, formsCompletion: 60, evidenceCompletion: 40, consistencyScore: 65 },
  { id: "3", caseNumber: "YT-2025-0003", clientName: "Yuki Tanaka", clientEmail: "yuki@email.com", caseType: "Extraordinary Ability", visaType: "O-1A", packageForms: ["I-129", "I-94"], status: "submitted", priority: "low", assignedTo: "James Wright", representative: "AREI Group – Accredited Representative", deadline: "2026-06-20", createdAt: "2025-12-15", notes: "Strong case, USCIS receipt received", readinessScore: 95, formsCompletion: 100, evidenceCompletion: 95, consistencyScore: 90 },
  { id: "4", caseNumber: "OP-2026-0004", clientName: "Olga Petrov", clientEmail: "olga@email.com", caseType: "Intracompany Transferee", visaType: "L-1A", packageForms: ["I-129", "I-129S"], status: "intake", priority: "urgent", assignedTo: "Sarah Chen", representative: "AREI Group – Accredited Representative", deadline: "2026-03-20", createdAt: "2026-03-01", notes: "Expedited processing requested", readinessScore: 15, formsCompletion: 10, evidenceCompletion: 5, consistencyScore: 30 },
  { id: "5", caseNumber: "CR-2025-0005", clientName: "Carlos Rivera", clientEmail: "carlos@email.com", caseType: "Extraordinary Ability", visaType: "EB-1A", packageForms: ["I-140", "I-485", "I-765", "I-131"], status: "approved", priority: "medium", assignedTo: "James Wright", representative: "AREI Group – Accredited Representative", deadline: "2026-03-10", createdAt: "2025-09-20", notes: "Approved! Notify client", readinessScore: 100, formsCompletion: 100, evidenceCompletion: 100, consistencyScore: 100 },
  { id: "6", caseNumber: "PS-2026-0006", clientName: "Priya Sharma", clientEmail: "priya@email.com", caseType: "H-1B Specialty Occupation", visaType: "H-1B", packageForms: ["I-129", "I-94"], status: "documents_pending", priority: "high", assignedTo: "Sarah Chen", representative: "AREI Group – Accredited Representative", deadline: "2026-04-01", createdAt: "2026-02-20", notes: "LCA pending", readinessScore: 45, formsCompletion: 50, evidenceCompletion: 35, consistencyScore: 50 },
];

// ── Mock Applications ──
export const mockApplications: Application[] = [
  { id: "a1", caseId: "1", formType: "I-130", formName: "Petition for Alien Relative", status: "completed", progress: 100, lastUpdated: "2026-02-20", assignedTo: "Sarah Chen" },
  { id: "a2", caseId: "1", formType: "I-485", formName: "Adjustment of Status", status: "in_progress", progress: 75, lastUpdated: "2026-03-01", assignedTo: "Sarah Chen" },
  { id: "a3", caseId: "1", formType: "I-765", formName: "Employment Authorization", status: "in_progress", progress: 60, lastUpdated: "2026-03-02", assignedTo: "Sarah Chen" },
  { id: "a4", caseId: "1", formType: "I-131", formName: "Travel Document", status: "started", progress: 20, lastUpdated: "2026-02-28", assignedTo: "Sarah Chen" },
  { id: "a5", caseId: "2", formType: "I-140", formName: "Immigrant Petition", status: "in_progress", progress: 50, lastUpdated: "2026-03-01", assignedTo: "Sarah Chen" },
  { id: "a6", caseId: "2", formType: "I-485", formName: "Adjustment of Status", status: "not_started", progress: 0, lastUpdated: "2026-02-05", assignedTo: "Sarah Chen" },
  { id: "a7", caseId: "2", formType: "I-765", formName: "Employment Authorization", status: "not_started", progress: 0, lastUpdated: "2026-02-05", assignedTo: "Sarah Chen" },
  { id: "a8", caseId: "3", formType: "I-129", formName: "Petition for Nonimmigrant Worker", status: "submitted", progress: 100, lastUpdated: "2026-01-20", assignedTo: "James Wright" },
];

// ── Mock Evidence ──
export const mockEvidence: Evidence[] = [
  { id: "e1", caseId: "1", name: "Passport – Maria Santos", category: "Identity", quality: "complete", uploadedBy: "Maria Santos", uploadDate: "2026-01-15", linkedForms: ["I-130", "I-485", "I-765", "I-131"], fileType: "pdf" },
  { id: "e2", caseId: "1", name: "Birth Certificate (Translated)", category: "Identity", quality: "complete", uploadedBy: "Maria Santos", uploadDate: "2026-01-15", linkedForms: ["I-130", "I-485"], fileType: "pdf" },
  { id: "e3", caseId: "1", name: "Marriage Certificate", category: "Relationship", quality: "complete", uploadedBy: "Maria Santos", uploadDate: "2026-01-20", linkedForms: ["I-130"], fileType: "pdf" },
  { id: "e4", caseId: "1", name: "Joint Bank Statements", category: "Relationship", quality: "low_quality", uploadedBy: "Maria Santos", uploadDate: "2026-02-10", linkedForms: ["I-130"], fileType: "pdf" },
  { id: "e5", caseId: "1", name: "Photos Together", category: "Relationship", quality: "complete", uploadedBy: "Maria Santos", uploadDate: "2026-02-10", linkedForms: ["I-130"], fileType: "jpg" },
  { id: "e6", caseId: "1", name: "Tax Returns 2025", category: "Financial", quality: "complete", uploadedBy: "Maria Santos", uploadDate: "2026-02-15", linkedForms: ["I-485", "I-864"], fileType: "pdf" },
  { id: "e7", caseId: "1", name: "Medical Exam (I-693)", category: "Medical", quality: "missing", uploadedBy: "", uploadDate: "", linkedForms: ["I-485"], fileType: "" },
  { id: "e8", caseId: "1", name: "Police Clearance", category: "Background", quality: "missing", uploadedBy: "", uploadDate: "", linkedForms: ["I-485"], fileType: "" },
  { id: "e9", caseId: "2", name: "Passport – Ahmed Khan", category: "Identity", quality: "complete", uploadedBy: "Ahmed Khan", uploadDate: "2026-02-10", linkedForms: ["I-140", "I-485"], fileType: "pdf" },
  { id: "e10", caseId: "2", name: "PhD Diploma", category: "Education", quality: "complete", uploadedBy: "Ahmed Khan", uploadDate: "2026-02-10", linkedForms: ["I-140"], fileType: "pdf" },
  { id: "e11", caseId: "2", name: "Recommendation Letters", category: "Professional", quality: "missing", uploadedBy: "", uploadDate: "", linkedForms: ["I-140"], fileType: "" },
];

// ── Mock Timeline ──
export const mockTimeline: TimelineEntry[] = [
  { id: "t1", caseId: "1", date: "2026-01-10", title: "Case Created", description: "Case file opened for Maria Santos – Adjustment of Status", type: "system" },
  { id: "t2", caseId: "1", date: "2026-01-15", title: "Documents Uploaded", description: "Passport, birth certificate, and marriage certificate uploaded by client", type: "user", actor: "Maria Santos" },
  { id: "t3", caseId: "1", date: "2026-01-20", title: "I-130 Started", description: "Petition for Alien Relative form started", type: "system" },
  { id: "t4", caseId: "1", date: "2026-02-10", title: "Additional Evidence Uploaded", description: "Joint bank statements and photos uploaded", type: "user", actor: "Maria Santos" },
  { id: "t5", caseId: "1", date: "2026-02-20", title: "I-130 Completed", description: "Petition for Alien Relative form completed and reviewed", type: "milestone" },
  { id: "t6", caseId: "1", date: "2026-03-01", title: "I-485 In Progress", description: "Adjustment of Status application 75% complete", type: "system" },
  { id: "t7", caseId: "2", date: "2026-02-05", title: "Case Created", description: "Case file opened for Ahmed Khan – EB-2 NIW", type: "system" },
  { id: "t8", caseId: "2", date: "2026-02-10", title: "Initial Documents Uploaded", description: "Passport and PhD diploma uploaded", type: "user", actor: "Ahmed Khan" },
  { id: "t9", caseId: "3", date: "2025-12-15", title: "Case Created", description: "Case file opened for Yuki Tanaka – O-1A", type: "system" },
  { id: "t10", caseId: "3", date: "2026-01-20", title: "Case Submitted to USCIS", description: "O-1A petition submitted with all supporting evidence", type: "milestone" },
  { id: "t11", caseId: "3", date: "2026-02-15", title: "USCIS Receipt Received", description: "Receipt notice received, case number: EAC-26-XXX-XXXXX", type: "uscis" },
];

// ── Mock Messages ──
export const mockCaseMessages: CaseMessage[] = [
  { id: "m1", caseId: "1", sender: "Sarah Chen", senderRole: "practitioner", content: "Hi Maria, we need your medical exam results (I-693) to proceed with the I-485. Please schedule an appointment with a USCIS-designated civil surgeon.", timestamp: "2026-03-01T10:30:00", read: true },
  { id: "m2", caseId: "1", sender: "Maria Santos", senderRole: "client", content: "Thank you Sarah! I have an appointment scheduled for March 10th. Will upload the results as soon as I have them.", timestamp: "2026-03-01T14:15:00", read: true },
  { id: "m3", caseId: "1", sender: "Sarah Chen", senderRole: "practitioner", content: "Perfect. Also, the joint bank statements you uploaded are a bit blurry. Could you re-scan them at a higher resolution?", timestamp: "2026-03-02T09:00:00", read: false },
  { id: "m4", caseId: "2", sender: "Sarah Chen", senderRole: "practitioner", content: "Ahmed, we still need 3 recommendation letters from professors or industry experts. Can you provide an update on those?", timestamp: "2026-03-01T11:00:00", read: true },
  { id: "m5", caseId: "2", sender: "Ahmed Khan", senderRole: "client", content: "I have 2 confirmed, waiting on the third from my PhD advisor. Should have it by next week.", timestamp: "2026-03-02T08:45:00", read: true },
];

// ── Mock Payments ──
export const mockPayments: Payment[] = [
  { id: "p1", caseId: "1", description: "Legal Consultation Fee", amount: 500, status: "paid", dueDate: "2026-01-15", paidDate: "2026-01-12" },
  { id: "p2", caseId: "1", description: "I-130 Filing Fee", amount: 535, status: "paid", dueDate: "2026-02-01", paidDate: "2026-01-28" },
  { id: "p3", caseId: "1", description: "I-485 Filing Fee", amount: 1225, status: "pending", dueDate: "2026-04-01" },
  { id: "p4", caseId: "1", description: "Biometrics Fee", amount: 85, status: "pending", dueDate: "2026-04-15" },
  { id: "p5", caseId: "2", description: "Legal Consultation Fee", amount: 750, status: "paid", dueDate: "2026-02-10", paidDate: "2026-02-08" },
  { id: "p6", caseId: "2", description: "I-140 Filing Fee", amount: 700, status: "overdue", dueDate: "2026-02-28" },
];

// ── Mock Case Notes ──
export const mockCaseNotes: CaseNote[] = [
  { id: "n1", caseId: "1", author: "Sarah Chen", content: "Client is responsive and organized. All initial documents were uploaded within the first week. Strong case overall.", createdAt: "2026-01-20T09:00:00", pinned: true },
  { id: "n2", caseId: "1", author: "Sarah Chen", content: "Joint bank account statements need re-scanning – quality is too low for filing. Messaged client.", createdAt: "2026-03-02T09:15:00", pinned: false },
  { id: "n3", caseId: "1", author: "James Wright", content: "Reviewed I-130. Looks good. Minor typo on beneficiary's mother's name – corrected.", createdAt: "2026-02-22T14:00:00", pinned: false },
  { id: "n4", caseId: "2", author: "Sarah Chen", content: "Ahmed has strong academic credentials. Need to strengthen the case with more industry recommendation letters.", createdAt: "2026-02-15T10:00:00", pinned: true },
];

// ── Mock Consistency Issues ──
export const mockConsistencyIssues: ConsistencyIssue[] = [
  { id: "ci1", caseId: "1", severity: "warning", field: "Address", description: "Current address on I-130 differs from I-485 (apartment number missing on I-485)", forms: ["I-130", "I-485"] },
  { id: "ci2", caseId: "1", severity: "info", field: "Employment", description: "Employment start date on I-485 is 1 day off from I-765", forms: ["I-485", "I-765"] },
  { id: "ci3", caseId: "2", severity: "error", field: "Name", description: "Middle name spelling differs: 'Muhammed' on passport vs 'Muhammad' on I-140", forms: ["I-140", "I-485"] },
];

// ── Existing mock data (kept) ──

export const mockTasks: Task[] = [
  { id: "1", title: "Review I-140 petition", description: "Final review before filing", caseId: "1", caseName: "Maria Santos - AOS", assignedTo: "Sarah Chen", dueDate: "2026-03-08", status: "in_progress", priority: "high" },
  { id: "2", title: "Request recommendation letters", description: "Need 3 more letters from professors", caseId: "2", caseName: "Ahmed Khan - EB-2 NIW", assignedTo: "Sarah Chen", dueDate: "2026-03-12", status: "todo", priority: "medium" },
  { id: "3", title: "Prepare O-1A evidence bundle", description: "Compile press articles and awards", caseId: "3", caseName: "Yuki Tanaka - O-1A", assignedTo: "James Wright", dueDate: "2026-03-15", status: "done", priority: "low" },
  { id: "4", title: "Schedule client intake meeting", description: "Initial consultation for L-1A transfer", caseId: "4", caseName: "Olga Petrov - L-1A", assignedTo: "Sarah Chen", dueDate: "2026-03-06", status: "todo", priority: "urgent" },
  { id: "5", title: "File LCA application", description: "Department of Labor application", caseId: "6", caseName: "Priya Sharma - H-1B", assignedTo: "Sarah Chen", dueDate: "2026-03-10", status: "todo", priority: "high" },
];

export const mockDocuments: Document[] = [
  { id: "1", name: "Passport_Copy.pdf", category: "Identity", caseId: "1", caseName: "Maria Santos - AOS", uploadedBy: "Maria Santos", uploadDate: "2026-02-28", status: "approved" },
  { id: "2", name: "Degree_Certificate.pdf", category: "Education", caseId: "1", caseName: "Maria Santos - AOS", uploadedBy: "Maria Santos", uploadDate: "2026-02-28", status: "approved" },
  { id: "3", name: "Employment_Letter.pdf", category: "Employment", caseId: "2", caseName: "Ahmed Khan - EB-2 NIW", uploadedBy: "Ahmed Khan", uploadDate: "2026-03-01", status: "pending" },
  { id: "4", name: "Tax_Returns_2025.pdf", category: "Financial", caseId: "2", caseName: "Ahmed Khan - EB-2 NIW", uploadedBy: "Ahmed Khan", uploadDate: "2026-03-02", status: "pending" },
  { id: "5", name: "Press_Article_NYT.pdf", category: "Evidence", caseId: "3", caseName: "Yuki Tanaka - O-1A", uploadedBy: "James Wright", uploadDate: "2026-01-15", status: "approved" },
  { id: "6", name: "Org_Chart.pdf", category: "Employment", caseId: "4", caseName: "Olga Petrov - L-1A", uploadedBy: "Olga Petrov", uploadDate: "2026-03-03", status: "rejected" },
];

export const mockEvents: CalendarEvent[] = [
  { id: "1", title: "Client Intake - Olga Petrov", date: "2026-03-06", time: "10:00 AM", type: "meeting", caseId: "4", caseName: "Olga Petrov - L-1A" },
  { id: "2", title: "H-1B Filing Deadline", date: "2026-03-15", time: "5:00 PM", type: "deadline", caseId: "1", caseName: "Maria Santos - AOS" },
  { id: "3", title: "USCIS Interview - Yuki Tanaka", date: "2026-03-20", time: "2:00 PM", type: "hearing", caseId: "3", caseName: "Yuki Tanaka - O-1A" },
  { id: "4", title: "Team Strategy Meeting", date: "2026-03-10", time: "9:00 AM", type: "meeting" },
  { id: "5", title: "LCA Deadline - Priya Sharma", date: "2026-03-10", time: "11:59 PM", type: "deadline", caseId: "6", caseName: "Priya Sharma - H-1B" },
];

export const mockClients: Client[] = [
  { id: "1", name: "Maria Santos", email: "maria@email.com", phone: "+1 555-0101", activeCases: 1, joinedDate: "2026-01-10", avatarInitials: "MS" },
  { id: "2", name: "Ahmed Khan", email: "ahmed@email.com", phone: "+1 555-0102", activeCases: 1, joinedDate: "2026-02-05", avatarInitials: "AK" },
  { id: "3", name: "Yuki Tanaka", email: "yuki@email.com", phone: "+1 555-0103", activeCases: 1, joinedDate: "2025-12-15", avatarInitials: "YT" },
  { id: "4", name: "Olga Petrov", email: "olga@email.com", phone: "+1 555-0104", activeCases: 1, joinedDate: "2026-03-01", avatarInitials: "OP" },
  { id: "5", name: "Carlos Rivera", email: "carlos@email.com", phone: "+1 555-0105", activeCases: 1, joinedDate: "2025-09-20", avatarInitials: "CR" },
  { id: "6", name: "Priya Sharma", email: "priya@email.com", phone: "+1 555-0106", activeCases: 1, joinedDate: "2026-02-20", avatarInitials: "PS" },
];

// ── Labels & Color Maps ──

export const caseStatusLabels: Record<CaseStatus, string> = {
  intake: "Intake",
  documents_pending: "Documents Pending",
  under_review: "Under Review",
  submitted: "Submitted to USCIS",
  approved: "Approved",
  denied: "Denied",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  not_started: "Not Started",
  started: "Started",
  in_progress: "In Progress",
  completed: "Completed",
  ready_for_review: "Ready for Review",
  submitted: "Submitted",
  approved: "Approved",
  denied: "Denied",
};

export const applicationStatusColors: Record<ApplicationStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  started: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  ready_for_review: "bg-accent text-accent-foreground",
  submitted: "bg-primary/10 text-primary",
  approved: "bg-success/10 text-success",
  denied: "bg-destructive/10 text-destructive",
};

export const priorityColors: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

export const statusColors: Record<CaseStatus, string> = {
  intake: "bg-muted text-muted-foreground",
  documents_pending: "bg-warning/10 text-warning",
  under_review: "bg-primary/10 text-primary",
  submitted: "bg-accent text-accent-foreground",
  approved: "bg-success/10 text-success",
  denied: "bg-destructive/10 text-destructive",
};

export const docStatusColors: Record<DocStatus, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export const evidenceQualityColors: Record<EvidenceQuality, string> = {
  complete: "bg-success/10 text-success",
  missing: "bg-destructive/10 text-destructive",
  low_quality: "bg-warning/10 text-warning",
};

export const evidenceQualityLabels: Record<EvidenceQuality, string> = {
  complete: "Complete",
  missing: "Missing",
  low_quality: "Low Quality",
};

// ── Client Profile (canonical data graph) ──

export interface ClientProfile {
  id: string;
  caseId: string;
  // Identity
  firstName: string;
  middleName: string;
  lastName: string;
  otherNames: string[];
  dateOfBirth: string;
  countryOfBirth: string;
  cityOfBirth: string;
  nationality: string;
  gender: string;
  ssn: string;
  alienNumber: string;
  passportNumber: string;
  passportExpiry: string;
  passportCountry: string;
  // Contact
  email: string;
  phone: string;
  currentAddress: {
    street: string;
    apt: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    since: string;
  };
  mailingAddress?: {
    street: string;
    apt: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  // Family
  maritalStatus: string;
  spouse?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    countryOfBirth: string;
    nationality: string;
    alienNumber?: string;
  };
  fatherName: string;
  fatherDOB: string;
  fatherCountryOfBirth: string;
  motherName: string;
  motherDOB: string;
  motherCountryOfBirth: string;
  children: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    countryOfBirth: string;
  }>;
  // Immigration
  immigrationHistory: Array<{
    visaType: string;
    status: string;
    dateOfEntry: string;
    i94Number: string;
    portOfEntry: string;
    expiryDate: string;
  }>;
  previousFilings: Array<{
    formType: string;
    filingDate: string;
    result: string;
    receiptNumber: string;
  }>;
  // Employment
  employmentHistory: Array<{
    employer: string;
    jobTitle: string;
    startDate: string;
    endDate: string;
    address: string;
    current: boolean;
  }>;
  // Address History
  addressHistory: Array<{
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    from: string;
    to: string;
  }>;
}

// Form field mapping: which profile fields go to which forms
export const formFieldMappings: Record<string, { label: string; fields: string[] }> = {
  "I-130": {
    label: "Petition for Alien Relative",
    fields: ["Full Name", "Date of Birth", "Country of Birth", "Passport", "Spouse Info", "Parents", "Address", "Immigration History"],
  },
  "I-485": {
    label: "Adjustment of Status",
    fields: ["Full Name", "Date of Birth", "Country of Birth", "SSN", "A-Number", "Passport", "Address History", "Employment History", "Parents", "Spouse Info", "Children", "Immigration History", "Previous Filings"],
  },
  "I-765": {
    label: "Employment Authorization",
    fields: ["Full Name", "Date of Birth", "Country of Birth", "SSN", "A-Number", "Passport", "Current Address", "Immigration History"],
  },
  "I-131": {
    label: "Travel Document",
    fields: ["Full Name", "Date of Birth", "Country of Birth", "A-Number", "Passport", "Current Address", "Immigration History"],
  },
  "I-140": {
    label: "Immigrant Petition",
    fields: ["Full Name", "Date of Birth", "Country of Birth", "Passport", "Current Address", "Employment History", "Education"],
  },
  "I-539": {
    label: "Extension of Stay",
    fields: ["Full Name", "Date of Birth", "Passport", "Current Address", "Immigration History"],
  },
  "N-400": {
    label: "Naturalization",
    fields: ["Full Name", "Date of Birth", "Country of Birth", "SSN", "Address History", "Employment History", "Parents", "Spouse Info", "Children", "Immigration History", "Travel History"],
  },
  "I-129": {
    label: "Petition for Nonimmigrant Worker",
    fields: ["Full Name", "Date of Birth", "Country of Birth", "Passport", "Current Address", "Employment History"],
  },
};

export const mockClientProfiles: ClientProfile[] = [
  {
    id: "cp1",
    caseId: "1",
    firstName: "Maria",
    middleName: "Elena",
    lastName: "Santos",
    otherNames: [],
    dateOfBirth: "1992-06-15",
    countryOfBirth: "Philippines",
    cityOfBirth: "Manila",
    nationality: "Filipino",
    gender: "Female",
    ssn: "XXX-XX-4589",
    alienNumber: "A-215-789-432",
    passportNumber: "P8827456",
    passportExpiry: "2030-08-20",
    passportCountry: "Philippines",
    email: "maria@email.com",
    phone: "+1 555-0101",
    currentAddress: {
      street: "1425 Oak Valley Drive",
      apt: "Apt 3B",
      city: "Los Angeles",
      state: "CA",
      zip: "90012",
      country: "United States",
      since: "2023-03-01",
    },
    maritalStatus: "Married",
    spouse: {
      firstName: "James",
      lastName: "Santos",
      dateOfBirth: "1990-02-10",
      countryOfBirth: "United States",
      nationality: "American",
    },
    fatherName: "Roberto Santos",
    fatherDOB: "1965-11-03",
    fatherCountryOfBirth: "Philippines",
    motherName: "Carmen Reyes Santos",
    motherDOB: "1968-04-22",
    motherCountryOfBirth: "Philippines",
    children: [
      { firstName: "Sophia", lastName: "Santos", dateOfBirth: "2022-09-10", countryOfBirth: "United States" },
    ],
    immigrationHistory: [
      { visaType: "B-2", status: "Expired", dateOfEntry: "2019-05-10", i94Number: "94-12345678", portOfEntry: "LAX", expiryDate: "2019-11-10" },
      { visaType: "F-1", status: "Changed to AOS", dateOfEntry: "2020-08-15", i94Number: "94-23456789", portOfEntry: "LAX", expiryDate: "2024-05-30" },
    ],
    previousFilings: [
      { formType: "I-20", filingDate: "2020-06-01", result: "Approved", receiptNumber: "EAC-20-XXX-00123" },
    ],
    employmentHistory: [
      { employer: "Pacific Health Systems", jobTitle: "Registered Nurse", startDate: "2023-06-01", endDate: "", address: "200 Medical Center Dr, Los Angeles, CA 90033", current: true },
      { employer: "Manila General Hospital", jobTitle: "Staff Nurse", startDate: "2016-03-01", endDate: "2019-04-30", address: "Taft Ave, Manila, Philippines", current: false },
    ],
    addressHistory: [
      { street: "1425 Oak Valley Drive, Apt 3B", city: "Los Angeles", state: "CA", zip: "90012", country: "United States", from: "2023-03-01", to: "Present" },
      { street: "892 Campus Lane, Unit 5", city: "Los Angeles", state: "CA", zip: "90007", country: "United States", from: "2020-08-15", to: "2023-02-28" },
      { street: "45 Rizal Street", city: "Manila", state: "NCR", zip: "1000", country: "Philippines", from: "1992-06-15", to: "2019-05-10" },
    ],
  },
  {
    id: "cp2",
    caseId: "2",
    firstName: "Ahmed",
    middleName: "Muhammad",
    lastName: "Khan",
    otherNames: [],
    dateOfBirth: "1988-12-05",
    countryOfBirth: "Pakistan",
    cityOfBirth: "Lahore",
    nationality: "Pakistani",
    gender: "Male",
    ssn: "XXX-XX-7821",
    alienNumber: "A-318-456-102",
    passportNumber: "AK4421987",
    passportExpiry: "2029-03-15",
    passportCountry: "Pakistan",
    email: "ahmed@email.com",
    phone: "+1 555-0102",
    currentAddress: {
      street: "780 University Blvd",
      apt: "Suite 12",
      city: "Boston",
      state: "MA",
      zip: "02215",
      country: "United States",
      since: "2021-09-01",
    },
    maritalStatus: "Single",
    fatherName: "Rashid Khan",
    fatherDOB: "1960-07-18",
    fatherCountryOfBirth: "Pakistan",
    motherName: "Fatima Khan",
    motherDOB: "1963-01-30",
    motherCountryOfBirth: "Pakistan",
    children: [],
    immigrationHistory: [
      { visaType: "F-1", status: "Active", dateOfEntry: "2018-08-10", i94Number: "94-98765432", portOfEntry: "JFK", expiryDate: "2026-06-30" },
    ],
    previousFilings: [
      { formType: "I-20", filingDate: "2018-05-15", result: "Approved", receiptNumber: "EAC-18-XXX-04567" },
      { formType: "OPT EAD", filingDate: "2023-04-01", result: "Approved", receiptNumber: "EAC-23-XXX-07890" },
    ],
    employmentHistory: [
      { employer: "MIT Lincoln Laboratory", jobTitle: "Research Scientist", startDate: "2023-06-15", endDate: "", address: "244 Wood St, Lexington, MA 02421", current: true },
      { employer: "Boston University", jobTitle: "Research Assistant", startDate: "2018-09-01", endDate: "2023-05-31", address: "One Silber Way, Boston, MA 02215", current: false },
    ],
    addressHistory: [
      { street: "780 University Blvd, Suite 12", city: "Boston", state: "MA", zip: "02215", country: "United States", from: "2021-09-01", to: "Present" },
      { street: "55 Bay State Rd", city: "Boston", state: "MA", zip: "02215", country: "United States", from: "2018-08-10", to: "2021-08-31" },
    ],
  },
];
