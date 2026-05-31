import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Globe, ChevronRight, MapPin, Briefcase, GraduationCap,
  Heart, Building2, Plane, Shield, AlertTriangle, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";

interface CountryProgram {
  name: string;
  likelihood: "high" | "moderate" | "possible" | "needs_review";
  description: string;
  category: string;
  requirements: string[];
}

interface Country {
  code: string;
  name: string;
  flag: string;
  description: string;
  programs: CountryProgram[];
  questions: { id: string; question: string; options: string[] }[];
}

const COUNTRIES: Country[] = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    description: "Family, work, study, and humanitarian immigration pathways",
    programs: [
      { name: "Marriage-Based Green Card", likelihood: "high", description: "For spouses of U.S. citizens or permanent residents", category: "Family", requirements: ["Valid marriage certificate", "Proof of bona fide relationship", "Financial sponsorship (I-864)"] },
      { name: "EB-3 Skilled Worker", likelihood: "moderate", description: "Employment-based visa for skilled workers", category: "Work", requirements: ["Job offer from U.S. employer", "Labor certification (PERM)", "Relevant qualifications"] },
      { name: "F-1 Student Visa", likelihood: "possible", description: "For full-time academic study at approved institutions", category: "Study", requirements: ["Acceptance from SEVP-approved school", "Proof of financial support", "Intent to return home"] },
      { name: "Diversity Visa Lottery", likelihood: "possible", description: "Annual lottery for underrepresented countries", category: "Other", requirements: ["Eligible country of birth", "High school education or equivalent", "Selected in annual lottery"] },
    ],
    questions: [
      { id: "us_relationship", question: "Do you have a family member who is a U.S. citizen or permanent resident?", options: ["Yes — Spouse", "Yes — Parent", "Yes — Sibling", "Yes — Child", "No"] },
      { id: "us_job", question: "Do you have a job offer from a U.S. employer?", options: ["Yes", "No, but I'm looking", "No"] },
      { id: "us_education", question: "What is your highest level of education?", options: ["High school", "Bachelor's degree", "Master's degree", "Doctorate", "Other"] },
      { id: "us_entry", question: "Have you previously entered the United States?", options: ["Yes, with a visa", "Yes, without inspection", "No"] },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    description: "Points-based and sponsored immigration programs",
    programs: [
      { name: "Express Entry", likelihood: "high", description: "Points-based system for skilled workers", category: "Work", requirements: ["Language proficiency (IELTS/TEF)", "Work experience", "Education credential assessment"] },
      { name: "Provincial Nominee Program", likelihood: "moderate", description: "Province-specific nomination for permanent residency", category: "Work", requirements: ["Meet provincial criteria", "Job offer or in-demand occupation", "Intent to settle in province"] },
      { name: "Study Permit", likelihood: "possible", description: "Study at a designated learning institution", category: "Study", requirements: ["Letter of acceptance", "Proof of funds", "Clean criminal record"] },
      { name: "Family Sponsorship", likelihood: "moderate", description: "Sponsor spouse, partner, or dependent children", category: "Family", requirements: ["Canadian citizen or PR sponsor", "Meet income requirements", "Genuine relationship proof"] },
    ],
    questions: [
      { id: "ca_language", question: "What is your English/French proficiency level?", options: ["Native speaker", "Advanced (CLB 9+)", "Intermediate (CLB 7-8)", "Beginner (CLB 5-6)", "None"] },
      { id: "ca_work", question: "Do you have skilled work experience?", options: ["3+ years", "1-2 years", "Less than 1 year", "None"] },
      { id: "ca_education", question: "What is your highest education level?", options: ["Doctorate", "Master's", "Bachelor's", "Diploma/Certificate", "High school"] },
      { id: "ca_age", question: "What is your age range?", options: ["18-29", "30-35", "36-40", "41-45", "46+"] },
    ],
  },
  {
    code: "UK",
    name: "United Kingdom",
    flag: "🇬🇧",
    description: "Points-based immigration system for work, study, and family",
    programs: [
      { name: "Skilled Worker Visa", likelihood: "high", description: "For workers with a job offer from an approved employer", category: "Work", requirements: ["Certificate of Sponsorship", "Meet salary threshold", "English language proficiency"] },
      { name: "Student Route", likelihood: "moderate", description: "Study at a licensed UK institution", category: "Study", requirements: ["Confirmation of Acceptance for Studies", "Proof of funds", "English language requirement"] },
      { name: "Family Visa", likelihood: "moderate", description: "Join family members settled in the UK", category: "Family", requirements: ["Genuine relationship", "Financial requirement (£18,600+)", "English language test"] },
      { name: "Global Talent Visa", likelihood: "possible", description: "For leaders or potential leaders in academia, arts, or tech", category: "Work", requirements: ["Endorsement from approved body", "Evidence of exceptional talent", "No job offer needed"] },
    ],
    questions: [
      { id: "uk_job", question: "Do you have a job offer from a UK employer?", options: ["Yes, sponsored", "Yes, not sponsored", "No"] },
      { id: "uk_salary", question: "What is the expected annual salary?", options: ["£38,700+", "£26,200-£38,699", "Below £26,200", "Not applicable"] },
      { id: "uk_english", question: "Can you prove English language proficiency?", options: ["Yes — IELTS or equivalent", "Native English speaker", "Not yet"] },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    description: "Skilled migration, employer-sponsored, and family pathways",
    programs: [
      { name: "Skilled Independent (189)", likelihood: "high", description: "Points-based visa, no employer or state sponsorship required", category: "Work", requirements: ["Occupation on skilled list", "Skills assessment", "Points test (65+)"] },
      { name: "Employer Nominated (186)", likelihood: "moderate", description: "Employer-sponsored permanent residency", category: "Work", requirements: ["Nomination from employer", "Skills assessment", "3 years relevant experience"] },
      { name: "Student Visa (500)", likelihood: "possible", description: "Study at a registered Australian institution", category: "Study", requirements: ["Enrollment confirmation (CoE)", "English proficiency", "Financial capacity"] },
      { name: "Partner Visa (820/801)", likelihood: "moderate", description: "For partners of Australian citizens or PR holders", category: "Family", requirements: ["Genuine relationship proof", "Health & character checks", "Sponsor eligibility"] },
    ],
    questions: [
      { id: "au_occupation", question: "Is your occupation on Australia's skilled occupation list?", options: ["Yes", "I'm not sure", "No"] },
      { id: "au_experience", question: "How many years of relevant work experience do you have?", options: ["8+ years", "5-7 years", "3-4 years", "1-2 years", "None"] },
      { id: "au_english", question: "What is your English test score?", options: ["Superior (IELTS 8+)", "Proficient (IELTS 7+)", "Competent (IELTS 6+)", "Not tested"] },
    ],
  },
  {
    code: "PT",
    name: "Portugal",
    flag: "🇵🇹",
    description: "Digital nomad, retirement, and investment-based residency",
    programs: [
      { name: "D7 Passive Income Visa", likelihood: "high", description: "For retirees or those with passive income", category: "Residency", requirements: ["Proof of passive income", "Health insurance", "Portuguese address"] },
      { name: "Digital Nomad Visa", likelihood: "high", description: "Remote work visa for non-EU nationals", category: "Work", requirements: ["Proof of remote employment", "Minimum income threshold", "Health insurance"] },
      { name: "Golden Visa", likelihood: "possible", description: "Investment-based residency permit", category: "Investment", requirements: ["Qualifying investment", "Clean criminal record", "Health insurance"] },
      { name: "Work Visa", likelihood: "moderate", description: "Employment visa with a Portuguese employer", category: "Work", requirements: ["Job contract", "Work permit approval", "Employer sponsorship"] },
    ],
    questions: [
      { id: "pt_income", question: "Do you have passive income or remote employment?", options: ["Yes — passive income", "Yes — remote job", "No"] },
      { id: "pt_investment", question: "Are you considering an investment for residency?", options: ["Yes — €500k+", "Yes — under €500k", "No"] },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    description: "Skilled worker, study, and EU Blue Card programs",
    programs: [
      { name: "EU Blue Card", likelihood: "high", description: "For highly qualified workers with a job offer", category: "Work", requirements: ["University degree", "Job offer meeting salary threshold", "Recognized qualifications"] },
      { name: "Job Seeker Visa", likelihood: "moderate", description: "6-month visa to search for employment in Germany", category: "Work", requirements: ["University degree", "Proof of funds", "Health insurance"] },
      { name: "Student Visa", likelihood: "possible", description: "Study at a German university", category: "Study", requirements: ["University admission", "Blocked account (€11,208/year)", "Health insurance"] },
    ],
    questions: [
      { id: "de_degree", question: "Do you have a recognized university degree?", options: ["Yes", "Equivalent qualification", "No"] },
      { id: "de_job", question: "Do you have a job offer in Germany?", options: ["Yes", "No, but I'm searching", "No"] },
    ],
  },
  {
    code: "ES",
    name: "Spain",
    flag: "🇪🇸",
    description: "Digital nomad, non-lucrative, and work visa programs",
    programs: [
      { name: "Digital Nomad Visa", likelihood: "high", description: "For remote workers employed by non-Spanish companies", category: "Work", requirements: ["Remote employment proof", "Minimum income (€28,800/year)", "Health insurance"] },
      { name: "Non-Lucrative Visa", likelihood: "moderate", description: "Residency without work authorization", category: "Residency", requirements: ["Sufficient financial means", "Health insurance", "No employment in Spain"] },
    ],
    questions: [
      { id: "es_work", question: "Will you work remotely or seek local employment?", options: ["Remote work", "Local employment", "No employment"] },
    ],
  },
  {
    code: "NZ",
    name: "New Zealand",
    flag: "🇳🇿",
    description: "Skilled migration and partnership-based pathways",
    programs: [
      { name: "Skilled Migrant Category", likelihood: "high", description: "Points-based visa for skilled workers", category: "Work", requirements: ["Job offer or skilled employment", "Points assessment (160+)", "Health & character checks"] },
      { name: "Partnership Visa", likelihood: "moderate", description: "For partners of NZ citizens or residents", category: "Family", requirements: ["Genuine relationship (12+ months)", "Partner support", "Character checks"] },
    ],
    questions: [
      { id: "nz_job", question: "Do you have a job offer in New Zealand?", options: ["Yes", "No"] },
      { id: "nz_partner", question: "Is your partner a New Zealand citizen or resident?", options: ["Yes", "No"] },
    ],
  },
  {
    code: "AE",
    name: "UAE",
    flag: "🇦🇪",
    description: "Employment, investor, and freelance visa programs",
    programs: [
      { name: "Employment Visa", likelihood: "high", description: "Employer-sponsored work visa", category: "Work", requirements: ["Job offer from UAE employer", "Valid passport", "Medical fitness test"] },
      { name: "Golden Visa (10-year)", likelihood: "possible", description: "Long-term residency for investors, specialists, and talent", category: "Investment", requirements: ["Investment or specialized skills", "Clean criminal record", "Valid health insurance"] },
      { name: "Freelance Visa", likelihood: "moderate", description: "Self-sponsored visa for freelancers", category: "Work", requirements: ["Freelance permit", "Relevant qualifications", "No sponsoring employer needed"] },
    ],
    questions: [
      { id: "ae_job", question: "Do you have an employer in the UAE?", options: ["Yes", "No — freelance", "No"] },
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    description: "Employment pass and specialist visa programs",
    programs: [
      { name: "Employment Pass", likelihood: "high", description: "For professionals earning S$5,000+/month", category: "Work", requirements: ["Job offer", "Minimum salary S$5,000", "Recognized qualifications"] },
      { name: "EntrePass", likelihood: "moderate", description: "For entrepreneurs starting a business in Singapore", category: "Business", requirements: ["Business plan", "Venture funding or IP", "Track record"] },
      { name: "Student's Pass", likelihood: "possible", description: "For full-time students at approved institutions", category: "Study", requirements: ["Admission to institution", "Sufficient funds", "Student's Pass application"] },
    ],
    questions: [
      { id: "sg_salary", question: "What is your expected monthly salary?", options: ["S$10,000+", "S$5,000-9,999", "Below S$5,000", "Not applicable"] },
    ],
  },
];

const likelihoodConfig = {
  high: { label: "High Likelihood", color: "bg-success text-success-foreground" },
  moderate: { label: "Moderate Likelihood", color: "bg-warning text-warning-foreground" },
  possible: { label: "Possible", color: "bg-accent text-accent-foreground" },
  needs_review: { label: "Needs Attorney Review", color: "bg-destructive text-destructive-foreground" },
};

const categoryIcons: Record<string, typeof Globe> = {
  Family: Heart,
  Work: Briefcase,
  Study: GraduationCap,
  Residency: Building2,
  Investment: Building2,
  Business: Briefcase,
  Other: Globe,
};

const GlobalPathwayFinder = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [step, setStep] = useState<"select" | "questions" | "results">("select");

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setAnswers({});
    setShowResults(false);
    setStep("questions");
  };

  const handleAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleViewResults = () => {
    setShowResults(true);
    setStep("results");
  };

  const handleReset = () => {
    setSelectedCountry(null);
    setAnswers({});
    setShowResults(false);
    setStep("select");
  };

  const answeredAll = selectedCountry
    ? selectedCountry.questions.every((q) => answers[q.id])
    : false;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <BackButton />

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Globe className="w-8 h-8 text-secondary" />
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Global Immigration Explorer
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore possible immigration pathways in 10 countries. Select a destination to discover programs you may be eligible for.
        </p>
      </div>

      {/* Country Selection */}
      {step === "select" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {COUNTRIES.map((country) => (
            <Card
              key={country.code}
              className="cursor-pointer hover:border-secondary transition-colors group"
              onClick={() => handleSelectCountry(country)}
            >
              <CardContent className="p-4 text-center space-y-2">
                <span className="text-4xl">{country.flag}</span>
                <p className="font-display font-semibold text-sm text-foreground group-hover:text-secondary transition-colors">
                  {country.name}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">{country.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Questions */}
      {step === "questions" && selectedCountry && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <ArrowLeft className="w-4 h-4 mr-1" /> All Countries
            </Button>
            <span className="text-3xl">{selectedCountry.flag}</span>
            <h2 className="text-xl font-display font-bold text-foreground">{selectedCountry.name}</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tell us about yourself</CardTitle>
              <CardDescription>Answer a few questions to see which programs may match your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedCountry.questions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <p className="font-medium text-sm text-foreground">
                    {idx + 1}. {q.question}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <Button
                        key={opt}
                        size="sm"
                        variant={answers[q.id] === opt ? "default" : "outline"}
                        className={answers[q.id] === opt ? "bg-secondary text-secondary-foreground" : ""}
                        onClick={() => handleAnswer(q.id, opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 flex gap-3">
                <Button
                  onClick={handleViewResults}
                  disabled={!answeredAll}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  View Possible Pathways <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Change Country
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      {step === "results" && selectedCountry && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setStep("questions")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <span className="text-3xl">{selectedCountry.flag}</span>
            <h2 className="text-xl font-display font-bold text-foreground">
              {selectedCountry.name} — Possible Pathways
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {selectedCountry.programs.map((prog) => {
              const IconComp = categoryIcons[prog.category] || Globe;
              const lc = likelihoodConfig[prog.likelihood];
              return (
                <Card key={prog.name} className="border-l-4 border-l-secondary">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <IconComp className="w-5 h-5 text-secondary" />
                        <h3 className="font-display font-semibold text-foreground">{prog.name}</h3>
                      </div>
                      <Badge className={lc.color}>{lc.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{prog.description}</p>
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Key Requirements:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {prog.requirements.map((r) => (
                          <li key={r} className="flex items-start gap-1">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-secondary shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedCountry.code === "US" && (
            <Card className="bg-secondary/10 border-secondary/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Plane className="w-5 h-5 text-secondary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Ready to start your U.S. immigration journey?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use our detailed U.S. Pathway Finder for a comprehensive eligibility analysis.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="ml-auto bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  onClick={() => navigate("/pathway-finder")}
                >
                  U.S. Pathway Finder
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              Explore Another Country
            </Button>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Important Disclaimer</p>
            <p>
              D.O.M.E. provides educational tools and document organization services. D.O.M.E. does not provide legal advice.
              Results are informational only and do not guarantee eligibility. Immigration laws change frequently.
              Consider review with an attorney or accredited representative before making decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalPathwayFinder;
