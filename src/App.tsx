import { lazy, Suspense } from "react";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import TaxStaffRoute from "@/components/TaxStaffRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageLoader from "@/components/PageLoader";
import DonationBanner from "@/components/DonationBanner";
import EarnWithDomeButton from "@/components/EarnWithDomeButton";
import GlobalAuthBar from "@/components/GlobalAuthBar";
import NetworkStatusBar from "@/components/NetworkStatusBar";
import ChatFloatingWidget from "@/components/ChatFloatingWidget";

// Layouts loaded eagerly (they wrap many routes)
import PractitionerLayout from "@/components/layouts/PractitionerLayout";
import ClientLayout from "@/components/layouts/ClientLayout";

// Lazy-loaded pages — code-split per route
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Agents = lazy(() => import("@/pages/Agents"));
const AgentDetail = lazy(() => import("@/pages/AgentDetail"));
const AgentChat = lazy(() => import("@/pages/AgentChat"));
const Cases = lazy(() => import("@/pages/Cases"));
const CaseDetail = lazy(() => import("@/pages/CaseDetail"));
const Documents = lazy(() => import("@/pages/Documents"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const Clients = lazy(() => import("@/pages/Clients"));
const PortalHome = lazy(() => import("@/pages/portal/PortalHome"));
const PortalDocuments = lazy(() => import("@/pages/portal/PortalDocuments"));
const PortalMessages = lazy(() => import("@/pages/portal/PortalMessages"));
const PortalSubscription = lazy(() => import("@/pages/portal/PortalSubscription"));
const ImmigrationPassport = lazy(() => import("@/pages/portal/ImmigrationPassport"));
const AIAssistant = lazy(() => import("@/pages/portal/AIAssistant"));
const OfficeLocator = lazy(() => import("@/pages/portal/OfficeLocator"));
const PacketBuilder = lazy(() => import("@/pages/portal/PacketBuilder"));
const PortalReferralDashboard = lazy(() => import("@/pages/portal/PortalReferralDashboard"));
const AttorneyCollaboration = lazy(() => import("@/pages/portal/AttorneyCollaboration"));
const InterviewPrep = lazy(() => import("@/pages/portal/InterviewPrep"));
const CaseReadiness = lazy(() => import("@/pages/portal/CaseReadiness"));
const VoiceFormAssistant = lazy(() => import("@/pages/portal/VoiceFormAssistant"));
const TimelinePrediction = lazy(() => import("@/pages/portal/TimelinePrediction"));
const FormSelection = lazy(() => import("@/pages/portal/FormSelection"));
const FormFiller = lazy(() => import("@/pages/portal/FormFiller"));
const FormWorkspace = lazy(() => import("@/pages/portal/FormWorkspace"));
const GuidedPetitionBuilder = lazy(() => import("@/pages/portal/GuidedPetitionBuilder"));
const DocumentIntelligence = lazy(() => import("@/pages/portal/DocumentIntelligence"));
const EmergencyLegalHelp = lazy(() => import("@/pages/portal/EmergencyLegalHelp"));
const GlobalPathwayFinder = lazy(() => import("@/pages/portal/GlobalPathwayFinder"));
const ClientOnboarding = lazy(() => import("@/pages/portal/ClientOnboarding"));
const USCISCaseStatus = lazy(() => import("@/pages/portal/USCISCaseStatus"));
const Contribution = lazy(() => import("@/pages/Contribution"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const PathwayFinder = lazy(() => import("@/pages/PathwayFinder"));
const AdminReferrals = lazy(() => import("@/pages/admin/AdminReferrals"));
const AdminRevenue = lazy(() => import("@/pages/admin/AdminRevenue"));
const AdminPricing = lazy(() => import("@/pages/admin/AdminPricing"));
const CCGVAdminDashboard = lazy(() => import("@/pages/admin/CCGVAdminDashboard"));
const ReferralLanding = lazy(() => import("@/pages/ReferralLanding"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AffiliateProgram = lazy(() => import("@/pages/AffiliateProgram"));
const SponsorParentsQuiz = lazy(() => import("@/pages/SponsorParentsQuiz"));
const CitizenshipQuiz = lazy(() => import("@/pages/CitizenshipQuiz"));
const AffiliateDashboard = lazy(() => import("@/pages/AffiliateDashboard"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const SecurityPolicy = lazy(() => import("@/pages/legal/SecurityPolicy"));
const PlatformPosition = lazy(() => import("@/pages/legal/PlatformPosition"));
const ProfileEdit = lazy(() => import("@/pages/portal/ProfileEdit"));
const VideoCall = lazy(() => import("@/pages/portal/VideoCall"));
const CaseCommunication = lazy(() => import("@/pages/portal/CaseCommunication"));
const LanguageSupportCenter = lazy(() => import("@/pages/portal/LanguageSupportCenter"));
const LanguageSupportRequest = lazy(() => import("@/pages/portal/LanguageSupportRequest"));
const InterpreterDirectory = lazy(() => import("@/pages/portal/InterpreterDirectory"));
const BookLanguageSupport = lazy(() => import("@/pages/portal/BookLanguageSupport"));
const DocumentTranslationRequest = lazy(() => import("@/pages/portal/DocumentTranslationRequest"));
const InstallApp = lazy(() => import("@/pages/InstallApp"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const Contact = lazy(() => import("@/pages/Contact"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TranslationAnalytics = lazy(() => import("@/pages/admin/TranslationAnalytics"));
const AdminLanguageSupport = lazy(() => import("@/pages/admin/AdminLanguageSupport"));
const FormExport = lazy(() => import("@/pages/portal/FormExport"));
const TemplateManager = lazy(() => import("@/pages/admin/TemplateManager"));
const PlatformHealth = lazy(() => import("@/pages/admin/PlatformHealth"));
const AdminAuditDashboard = lazy(() => import("@/pages/admin/AdminAuditDashboard"));
const StyleGuide = lazy(() => import("@/pages/admin/StyleGuide"));
const CasePackageDashboard = lazy(() => import("@/pages/portal/CasePackageDashboard"));
const FirmDashboard = lazy(() => import("@/pages/firm/FirmDashboard"));
const FirmMembers = lazy(() => import("@/pages/firm/FirmMembers"));
const FirmCaseDetail = lazy(() => import("@/pages/firm/FirmCaseDetail"));
const FirmIntakeQueue = lazy(() => import("@/pages/firm/FirmIntakeQueue"));
const FirmReviewCenter = lazy(() => import("@/pages/firm/FirmReviewCenter"));

// English Learning Center
const EnglishHome = lazy(() => import("@/pages/english/EnglishHome"));
const EnglishCourseDetail = lazy(() => import("@/pages/english/EnglishCourseDetail"));
const EnglishLiveClass = lazy(() => import("@/pages/english/EnglishLiveClass"));
const EnglishVoicePractice = lazy(() => import("@/pages/english/EnglishVoicePractice"));
const EnglishPlacementTest = lazy(() => import("@/pages/english/EnglishPlacementTest"));
const TeacherDashboard = lazy(() => import("@/pages/english/TeacherDashboard"));
const EnglishPricing = lazy(() => import("@/pages/english/EnglishPricing"));
const EnglishPrivateLessons = lazy(() => import("@/pages/english/EnglishPrivateLessons"));
const EnglishAdminAnalytics = lazy(() => import("@/pages/english/EnglishAdminAnalytics"));
const EnglishCurriculum = lazy(() => import("@/pages/english/EnglishCurriculum"));
const EnglishStudentDashboard = lazy(() => import("@/pages/english/EnglishStudentDashboard"));
const EnglishEmployerTraining = lazy(() => import("@/pages/english/EnglishEmployerTraining"));
const EnglishNonprofitAccess = lazy(() => import("@/pages/english/EnglishNonprofitAccess"));
const EnglishContentManager = lazy(() => import("@/pages/english/EnglishContentManager"));
const EnglishLessonView = lazy(() => import("@/pages/english/EnglishLessonView"));

// Tax & Accounting Module
const TaxServicesHome = lazy(() => import("@/pages/tax/TaxServicesHome"));
const TaxOnlySignup = lazy(() => import("@/pages/tax/TaxOnlySignup"));
const CCGVSLanding = lazy(() => import("@/pages/tax/CCGVSLanding"));
const TaxClientDashboard = lazy(() => import("@/pages/tax/TaxClientDashboard"));
const TaxServiceStart = lazy(() => import("@/pages/tax/TaxServiceStart"));
const TaxFileDetail = lazy(() => import("@/pages/tax/TaxFileDetail"));
const CCGVSPortal = lazy(() => import("@/pages/tax/CCGVSPortal"));
const CCGVSClientIntake = lazy(() => import("@/pages/tax/CCGVSClientIntake"));
const AccountantDashboard = lazy(() => import("@/pages/tax/AccountantDashboard"));
const ProTaxDashboard = lazy(() => import("@/pages/tax/pro/ProTaxDashboard"));
const ProTaxFileView = lazy(() => import("@/pages/tax/pro/ProTaxFileView"));
const ProTaxFirmAdmin = lazy(() => import("@/pages/tax/pro/ProTaxFirmAdmin"));
const IndividualTaxIntake = lazy(() => import("@/pages/tax/IndividualTaxIntake"));
const NonprofitTaxIntake = lazy(() => import("@/pages/tax/NonprofitTaxIntake"));
const NonprofitFilingWorkspace = lazy(() => import("@/pages/tax/NonprofitFilingWorkspace"));
const TaxDocuments = lazy(() => import("@/pages/tax/TaxDocuments"));
const TaxReviewRequest = lazy(() => import("@/pages/tax/TaxReviewRequest"));
const TaxAdminDashboard = lazy(() => import("@/pages/tax/TaxAdminDashboard"));
const NonprofitLanding = lazy(() => import("@/pages/tax/NonprofitLanding"));
const NonprofitDecisionScreen = lazy(() => import("@/pages/tax/NonprofitDecisionScreen"));
const NonprofitReadiness = lazy(() => import("@/pages/tax/NonprofitReadiness"));
const NonprofitAdminDashboard = lazy(() => import("@/pages/tax/NonprofitAdminDashboard"));
const Filing990NLanding = lazy(() => import("@/pages/tax/Filing990NLanding"));
const Filing990NEligibility = lazy(() => import("@/pages/tax/Filing990NEligibility"));
const Filing990NWorkspace = lazy(() => import("@/pages/tax/Filing990NWorkspace"));
const Filing990EZLanding = lazy(() => import("@/pages/tax/Filing990EZLanding"));
const Filing990EZEligibility = lazy(() => import("@/pages/tax/Filing990EZEligibility"));
const Filing990EZWorkspace = lazy(() => import("@/pages/tax/Filing990EZWorkspace"));
const Filing8868Landing = lazy(() => import("@/pages/tax/Filing8868Landing"));
const Filing8868Eligibility = lazy(() => import("@/pages/tax/Filing8868Eligibility"));
const Filing8868Workspace = lazy(() => import("@/pages/tax/Filing8868Workspace"));
const IrsCallback = lazy(() => import("@/pages/tax/IrsCallback"));
const IrsIntegrationSettingsPage = lazy(() => import("@/pages/admin/IrsIntegrationSettings"));
const TaxDocumentUpload = lazy(() => import("@/pages/tax/TaxDocumentUpload"));
const TaxFilingConfirmation = lazy(() => import("@/pages/tax/TaxFilingConfirmation"));
const TaxProfileSetup = lazy(() => import("@/pages/tax/TaxProfileSetup"));
const TaxFilingRecommendation = lazy(() => import("@/pages/tax/TaxFilingRecommendation"));
const TaxExtractedDataReview = lazy(() => import("@/pages/tax/TaxExtractedDataReview"));
const TaxSpreadsheetMapping = lazy(() => import("@/pages/tax/TaxSpreadsheetMapping"));
const TaxErrorReview = lazy(() => import("@/pages/tax/TaxErrorReview"));
const TaxReviewSummary = lazy(() => import("@/pages/tax/TaxReviewSummary"));
const TaxPaymentSelection = lazy(() => import("@/pages/tax/TaxPaymentSelection"));
const TaxPostPayment = lazy(() => import("@/pages/tax/TaxPostPayment"));
const TaxYearContinuity = lazy(() => import("@/pages/tax/TaxYearContinuity"));

// Business Module
const BusinessLaunchHome = lazy(() => import("@/pages/business/BusinessLaunchHome"));
const BusinessFormation = lazy(() => import("@/pages/business/BusinessFormation"));
const NonprofitCenter = lazy(() => import("@/pages/business/NonprofitCenter"));
const EB5Center = lazy(() => import("@/pages/business/EB5Center"));
const BusinessMarketplace = lazy(() => import("@/pages/business/BusinessMarketplace"));
const CreateListing = lazy(() => import("@/pages/business/CreateListing"));
const ListingDetail = lazy(() => import("@/pages/business/ListingDetail"));
const HireHelp = lazy(() => import("@/pages/business/HireHelp"));
const TaxSetupCenter = lazy(() => import("@/pages/business/TaxSetupCenter"));
const AdminListingModeration = lazy(() => import("@/pages/business/AdminListingModeration"));

// Network Module
const NetworkHome = lazy(() => import("@/pages/network/NetworkHome"));
const NetworkDirectory = lazy(() => import("@/pages/network/NetworkDirectory"));
const NetworkListingDetail = lazy(() => import("@/pages/network/NetworkListingDetail"));
const CreateNetworkListing = lazy(() => import("@/pages/network/CreateNetworkListing"));
const CommunityHub = lazy(() => import("@/pages/network/CommunityHub"));
const SuccessMap = lazy(() => import("@/pages/network/SuccessMap"));
const AdminNetworkModeration = lazy(() => import("@/pages/network/AdminNetworkModeration"));

// Government & Institutional Portal
const GovernmentLayout = lazy(() => import("@/components/layouts/GovernmentLayout"));
const GovernmentDashboard = lazy(() => import("@/pages/government/GovernmentDashboard"));
const CitizenshipPrograms = lazy(() => import("@/pages/government/CitizenshipPrograms"));
const LegalOrientation = lazy(() => import("@/pages/government/LegalOrientation"));
const IntegrationPrograms = lazy(() => import("@/pages/government/IntegrationPrograms"));
const EntrepreneurPrograms = lazy(() => import("@/pages/government/EntrepreneurPrograms"));
const ParticipantManagement = lazy(() => import("@/pages/government/ParticipantManagement"));
const ProgramReporting = lazy(() => import("@/pages/government/ProgramReporting"));
const GovernmentSettings = lazy(() => import("@/pages/government/GovernmentSettings"));
const GovernmentPartnerships = lazy(() => import("@/pages/government/GovernmentPartnerships"));
const DemoWalkthrough = lazy(() => import("@/pages/government/DemoWalkthrough"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const IdleGuard = () => {
  useIdleTimeout();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <IdleGuard />
          <NetworkStatusBar />
          <GlobalAuthBar />
          <DonationBanner />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth & Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/contribution" element={<Contribution />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/pathway-finder" element={<PathwayFinder />} />
                <Route path="/quiz/sponsor-parents" element={<SponsorParentsQuiz />} />
                <Route path="/quiz/citizenship" element={<CitizenshipQuiz />} />
                <Route path="/r/:code" element={<ReferralLanding />} />
                <Route path="/affiliate" element={<AffiliateProgram />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/security" element={<SecurityPolicy />} />
                <Route path="/platform-position" element={<PlatformPosition />} />
                <Route path="/install" element={<InstallApp />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contact" element={<Contact />} />

                {/* Client Onboarding Wizard */}
                <Route path="/onboarding" element={<ProtectedRoute><ClientOnboarding /></ProtectedRoute>} />

{/* Tax & Accounting Module */}
                <Route path="/tax" element={<TaxServicesHome />} />
                <Route path="/tax/ccgvs" element={<CCGVSLanding />} />
                <Route path="/tax/ccgvs/intake" element={<CCGVSClientIntake />} />
                <Route path="/tax/signup" element={<TaxOnlySignup />} />
                <Route path="/tax/start" element={<TaxServiceStart />} />
                <Route path="/tax/dashboard" element={<ProtectedRoute><TaxClientDashboard /></ProtectedRoute>} />
                <Route path="/tax/file/:id" element={<ProtectedRoute><TaxFileDetail /></ProtectedRoute>} />
                <Route path="/tax/staff/portal" element={<TaxStaffRoute><CCGVSPortal /></TaxStaffRoute>} />
                <Route path="/tax/staff/intake" element={<TaxStaffRoute><CCGVSClientIntake /></TaxStaffRoute>} />
                <Route path="/tax/accountant" element={<TaxStaffRoute allowedRoles={["owner_admin", "cpa_reviewer", "accountant", "tax_preparer"]}><AccountantDashboard /></TaxStaffRoute>} />
                <Route path="/tax/pro" element={<TaxStaffRoute><ProTaxDashboard /></TaxStaffRoute>} />
                <Route path="/tax/pro/file/:id" element={<TaxStaffRoute><ProTaxFileView /></TaxStaffRoute>} />
                <Route path="/tax/pro/firm" element={<TaxStaffRoute allowedRoles={["owner_admin", "admin"]}><ProTaxFirmAdmin /></TaxStaffRoute>} />
                <Route path="/tax/individual" element={<IndividualTaxIntake />} />
                <Route path="/tax/nonprofit" element={<NonprofitTaxIntake />} />
                <Route path="/tax/nonprofit/landing" element={<NonprofitLanding />} />
                <Route path="/tax/nonprofit/start" element={<NonprofitDecisionScreen />} />
                <Route path="/tax/nonprofit/readiness" element={<NonprofitReadiness />} />
                <Route path="/tax/nonprofit/workspace" element={<ProtectedRoute><NonprofitFilingWorkspace /></ProtectedRoute>} />
                <Route path="/tax/documents" element={<ProtectedRoute><TaxDocuments /></ProtectedRoute>} />
                <Route path="/tax/documents/upload" element={<ProtectedRoute><TaxDocumentUpload /></ProtectedRoute>} />
                <Route path="/tax/file/:id/confirm" element={<ProtectedRoute><TaxFilingConfirmation /></ProtectedRoute>} />
                <Route path="/tax/profile" element={<ProtectedRoute><TaxProfileSetup /></ProtectedRoute>} />
                <Route path="/tax/file/:id/recommendation" element={<ProtectedRoute><TaxFilingRecommendation /></ProtectedRoute>} />
                <Route path="/tax/file/:id/extracted" element={<ProtectedRoute><TaxExtractedDataReview /></ProtectedRoute>} />
                <Route path="/tax/file/:id/spreadsheet" element={<ProtectedRoute><TaxSpreadsheetMapping /></ProtectedRoute>} />
                <Route path="/tax/file/:id/errors" element={<ProtectedRoute><TaxErrorReview /></ProtectedRoute>} />
                <Route path="/tax/file/:id/review" element={<ProtectedRoute><TaxReviewSummary /></ProtectedRoute>} />
                <Route path="/tax/file/:id/payment" element={<ProtectedRoute><TaxPaymentSelection /></ProtectedRoute>} />
                <Route path="/tax/file/:id/post-payment" element={<ProtectedRoute><TaxPostPayment /></ProtectedRoute>} />
                <Route path="/tax/continuity" element={<ProtectedRoute><TaxYearContinuity /></ProtectedRoute>} />
                <Route path="/tax/review" element={<ProtectedRoute><TaxReviewRequest /></ProtectedRoute>} />
                <Route path="/admin/tax" element={<ProtectedRoute requireRole="admin"><TaxAdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/tax/nonprofit" element={<ProtectedRoute requireRole="admin"><NonprofitAdminDashboard /></ProtectedRoute>} />
                <Route path="/tax/990n" element={<Filing990NLanding />} />
                <Route path="/tax/990n/eligibility" element={<Filing990NEligibility />} />
                <Route path="/tax/990n/workspace" element={<ProtectedRoute><Filing990NWorkspace /></ProtectedRoute>} />
                <Route path="/tax/990ez" element={<Filing990EZLanding />} />
                <Route path="/tax/990ez/eligibility" element={<Filing990EZEligibility />} />
                <Route path="/tax/990ez/workspace" element={<ProtectedRoute><Filing990EZWorkspace /></ProtectedRoute>} />
                <Route path="/tax/8868" element={<Filing8868Landing />} />
                <Route path="/tax/8868/eligibility" element={<Filing8868Eligibility />} />
                <Route path="/tax/8868/workspace" element={<ProtectedRoute><Filing8868Workspace /></ProtectedRoute>} />
                <Route path="/tax/integrations/irs/callback" element={<ProtectedRoute><IrsCallback /></ProtectedRoute>} />
                <Route path="/admin/tax/irs-integration" element={<ProtectedRoute requireRole="admin"><IrsIntegrationSettingsPage /></ProtectedRoute>} />

                {/* Business Module — Hybrid */}
                <Route path="/business" element={<BusinessLaunchHome />} />
                <Route path="/business/formation" element={<BusinessFormation />} />
                <Route path="/business/nonprofit" element={<NonprofitCenter />} />
                <Route path="/business/eb5" element={<EB5Center />} />
                <Route path="/business/marketplace" element={<BusinessMarketplace />} />
                <Route path="/business/marketplace/create" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
                <Route path="/business/marketplace/:id" element={<ListingDetail />} />
                <Route path="/business/hire-help" element={<HireHelp />} />
                <Route path="/business/tax-setup" element={<TaxSetupCenter />} />

                {/* Government & Institutional Portal */}
                <Route path="/gov/partnerships" element={<GovernmentPartnerships />} />
                <Route element={<Suspense fallback={<PageLoader />}><GovernmentLayout /></Suspense>}>
                  <Route path="/gov/dashboard" element={<ProtectedRoute><GovernmentDashboard /></ProtectedRoute>} />
                  <Route path="/gov/citizenship" element={<ProtectedRoute><CitizenshipPrograms /></ProtectedRoute>} />
                  <Route path="/gov/legal-orientation" element={<ProtectedRoute><LegalOrientation /></ProtectedRoute>} />
                  <Route path="/gov/integration" element={<ProtectedRoute><IntegrationPrograms /></ProtectedRoute>} />
                  <Route path="/gov/entrepreneurship" element={<ProtectedRoute><EntrepreneurPrograms /></ProtectedRoute>} />
                  <Route path="/gov/participants" element={<ProtectedRoute><ParticipantManagement /></ProtectedRoute>} />
                  <Route path="/gov/reporting" element={<ProtectedRoute><ProgramReporting /></ProtectedRoute>} />
                  <Route path="/gov/settings" element={<ProtectedRoute><GovernmentSettings /></ProtectedRoute>} />
                  <Route path="/gov/demo-walkthrough" element={<ProtectedRoute><DemoWalkthrough /></ProtectedRoute>} />
                </Route>

                <Route path="/network" element={<NetworkHome />} />
                <Route path="/network/directory" element={<NetworkDirectory />} />
                <Route path="/network/listing/:id" element={<NetworkListingDetail />} />
                <Route path="/network/create" element={<ProtectedRoute><CreateNetworkListing /></ProtectedRoute>} />
                <Route path="/network/community" element={<CommunityHub />} />
                <Route path="/network/map" element={<SuccessMap />} />

                {/* Law Firm Portal */}
                <Route element={<PractitionerLayout />}>
                  <Route path="/firm" element={<ProtectedRoute requireRole="practitioner"><FirmDashboard /></ProtectedRoute>} />
                  <Route path="/firm/members" element={<ProtectedRoute requireRole="practitioner"><FirmMembers /></ProtectedRoute>} />
                  <Route path="/firm/intake" element={<ProtectedRoute requireRole="practitioner"><FirmIntakeQueue /></ProtectedRoute>} />
                  <Route path="/firm/review" element={<ProtectedRoute requireRole="practitioner"><FirmReviewCenter /></ProtectedRoute>} />
                  <Route path="/firm/cases/:id" element={<ProtectedRoute requireRole="practitioner"><FirmCaseDetail /></ProtectedRoute>} />
                </Route>

                {/* Practitioner */}
                <Route element={<PractitionerLayout />}>
                  <Route path="/dashboard" element={<ProtectedRoute requireRole="practitioner"><Dashboard /></ProtectedRoute>} />
                  <Route path="/agents" element={<ProtectedRoute requireRole="practitioner"><Agents /></ProtectedRoute>} />
                  <Route path="/agents/:id" element={<ProtectedRoute requireRole="practitioner"><AgentDetail /></ProtectedRoute>} />
                  <Route path="/agents/:id/chat" element={<ProtectedRoute requireRole="practitioner"><AgentChat /></ProtectedRoute>} />
                  <Route path="/cases" element={<ProtectedRoute requireRole="practitioner"><Cases /></ProtectedRoute>} />
                  <Route path="/cases/:id" element={<ProtectedRoute requireRole="practitioner"><CaseDetail /></ProtectedRoute>} />
                  <Route path="/documents" element={<ProtectedRoute requireRole="practitioner"><Documents /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute requireRole="practitioner"><CalendarPage /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute requireRole="practitioner"><Tasks /></ProtectedRoute>} />
                  <Route path="/clients" element={<ProtectedRoute requireRole="practitioner"><Clients /></ProtectedRoute>} />
                  <Route path="/admin/referrals" element={<ProtectedRoute requireRole="admin"><AdminReferrals /></ProtectedRoute>} />
                  <Route path="/admin/revenue" element={<ProtectedRoute requireRole="admin"><AdminRevenue /></ProtectedRoute>} />
                  <Route path="/admin/pricing" element={<ProtectedRoute requireRole="admin"><AdminPricing /></ProtectedRoute>} />
                  <Route path="/admin/listings" element={<ProtectedRoute requireRole="admin"><AdminListingModeration /></ProtectedRoute>} />
                  <Route path="/admin/network" element={<ProtectedRoute requireRole="admin"><AdminNetworkModeration /></ProtectedRoute>} />
                  <Route path="/worldfoundationdigitalease" element={<ProtectedRoute requireRole="admin"><CCGVAdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/translations" element={<ProtectedRoute requireRole="admin"><TranslationAnalytics /></ProtectedRoute>} />
                  <Route path="/admin/language-support" element={<ProtectedRoute requireRole="admin"><AdminLanguageSupport /></ProtectedRoute>} />
                  <Route path="/admin/templates" element={<ProtectedRoute requireRole="admin"><TemplateManager /></ProtectedRoute>} />
                  <Route path="/admin/health" element={<ProtectedRoute requireRole="admin"><PlatformHealth /></ProtectedRoute>} />
                  <Route path="/admin/audit" element={<ProtectedRoute requireRole="admin"><AdminAuditDashboard /></ProtectedRoute>} />
                  <Route path="/admin/style-guide" element={<StyleGuide />} />
                  <Route path="/affiliate/dashboard" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />
                  <Route path="/english/teach" element={<ProtectedRoute requireRole="practitioner"><TeacherDashboard /></ProtectedRoute>} />
                  <Route path="/english/analytics" element={<ProtectedRoute requireRole="admin"><EnglishAdminAnalytics /></ProtectedRoute>} />
                  <Route path="/english/content" element={<ProtectedRoute requireRole="admin"><EnglishContentManager /></ProtectedRoute>} />
                </Route>

                {/* Client Portal */}
                <Route element={<ClientLayout />}>
                  <Route path="/portal" element={<ProtectedRoute><PortalHome /></ProtectedRoute>} />
                  <Route path="/portal/passport" element={<ProtectedRoute><ImmigrationPassport /></ProtectedRoute>} />
                  <Route path="/portal/documents" element={<ProtectedRoute><PortalDocuments /></ProtectedRoute>} />
                  <Route path="/portal/messages" element={<ProtectedRoute><PortalMessages /></ProtectedRoute>} />
                  <Route path="/portal/subscription" element={<ProtectedRoute><PortalSubscription /></ProtectedRoute>} />
                  <Route path="/portal/assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                  <Route path="/portal/locator" element={<ProtectedRoute><OfficeLocator /></ProtectedRoute>} />
                  <Route path="/portal/referrals" element={<ProtectedRoute><PortalReferralDashboard /></ProtectedRoute>} />
                  <Route path="/portal/packet" element={<ProtectedRoute><PacketBuilder /></ProtectedRoute>} />
                  <Route path="/portal/attorney" element={<ProtectedRoute><AttorneyCollaboration /></ProtectedRoute>} />
                  <Route path="/portal/interview" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
                  <Route path="/portal/readiness" element={<ProtectedRoute><CaseReadiness /></ProtectedRoute>} />
                  <Route path="/portal/voice" element={<ProtectedRoute><VoiceFormAssistant /></ProtectedRoute>} />
                  <Route path="/portal/timeline" element={<ProtectedRoute><TimelinePrediction /></ProtectedRoute>} />
                  <Route path="/portal/forms" element={<ProtectedRoute><FormSelection /></ProtectedRoute>} />
                  <Route path="/portal/case-package" element={<ProtectedRoute><CasePackageDashboard /></ProtectedRoute>} />
                  <Route path="/portal/forms/:id" element={<ProtectedRoute><FormWorkspace /></ProtectedRoute>} />
                  <Route path="/portal/forms/legacy/:id" element={<ProtectedRoute><FormFiller /></ProtectedRoute>} />
                  <Route path="/portal/export/:formCode" element={<ProtectedRoute><FormExport /></ProtectedRoute>} />
                  <Route path="/portal/profile" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
                  <Route path="/portal/video" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
                  <Route path="/portal/petition-builder" element={<ProtectedRoute><GuidedPetitionBuilder /></ProtectedRoute>} />
                  <Route path="/portal/doc-intelligence" element={<ProtectedRoute><DocumentIntelligence /></ProtectedRoute>} />
                  <Route path="/portal/emergency-help" element={<ProtectedRoute><EmergencyLegalHelp /></ProtectedRoute>} />
                  <Route path="/portal/global-explorer" element={<ProtectedRoute><GlobalPathwayFinder /></ProtectedRoute>} />
                  <Route path="/portal/case-status" element={<ProtectedRoute><USCISCaseStatus /></ProtectedRoute>} />
                  <Route path="/portal/communication/:id" element={<ProtectedRoute><CaseCommunication /></ProtectedRoute>} />
                  <Route path="/portal/language-support" element={<ProtectedRoute><LanguageSupportCenter /></ProtectedRoute>} />
                  <Route path="/portal/language-support/request" element={<ProtectedRoute><LanguageSupportRequest /></ProtectedRoute>} />
                  <Route path="/portal/language-support/directory" element={<ProtectedRoute><InterpreterDirectory /></ProtectedRoute>} />
                  <Route path="/portal/language-support/book" element={<ProtectedRoute><BookLanguageSupport /></ProtectedRoute>} />
                  <Route path="/portal/language-support/translate" element={<ProtectedRoute><DocumentTranslationRequest /></ProtectedRoute>} />
                  <Route path="/portal/english" element={<ProtectedRoute><EnglishHome /></ProtectedRoute>} />
                  <Route path="/portal/english/course/:id" element={<ProtectedRoute><EnglishCourseDetail /></ProtectedRoute>} />
                  <Route path="/portal/english/live/:classId" element={<ProtectedRoute><EnglishLiveClass /></ProtectedRoute>} />
                  <Route path="/portal/english/practice" element={<ProtectedRoute><EnglishVoicePractice /></ProtectedRoute>} />
                  <Route path="/portal/english/placement" element={<ProtectedRoute><EnglishPlacementTest /></ProtectedRoute>} />
                  <Route path="/portal/english/pricing" element={<ProtectedRoute><EnglishPricing /></ProtectedRoute>} />
                  <Route path="/portal/english/lessons" element={<ProtectedRoute><EnglishPrivateLessons /></ProtectedRoute>} />
                  <Route path="/portal/english/curriculum" element={<ProtectedRoute><EnglishCurriculum /></ProtectedRoute>} />
                  <Route path="/portal/english/student" element={<ProtectedRoute><EnglishStudentDashboard /></ProtectedRoute>} />
                  <Route path="/portal/english/employer" element={<ProtectedRoute><EnglishEmployerTraining /></ProtectedRoute>} />
                  <Route path="/portal/english/nonprofit" element={<ProtectedRoute><EnglishNonprofitAccess /></ProtectedRoute>} />
                  <Route path="/portal/english/lesson/:lessonId" element={<ProtectedRoute><EnglishLessonView /></ProtectedRoute>} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              <ChatFloatingWidget />
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
