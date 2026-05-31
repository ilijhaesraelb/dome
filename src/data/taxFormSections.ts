/**
 * Tax & Accounting form section definitions for D.O.M.E.
 * Uses the same FormSection / FormFieldDef architecture as immigration forms.
 */
import type { FormSection } from "./formSections";

// ═══════════════════════════════════════════
// NONPROFIT 990 DETERMINATION RULES
// ═══════════════════════════════════════════

export interface NonprofitDetermination {
  likelyForm: string;
  reason: string;
  description: string;
  documentsNeeded: string[];
  sections: string[];
}

export function determineNonprofitFiling(answers: Record<string, string>): NonprofitDetermination {
  const grossReceipts = parseFloat(answers.gross_receipts_range || "0");
  const totalAssets = parseFloat(answers.total_assets_range || "0");
  const isPrivateFoundation = answers.exempt_type === "Private Foundation";
  const hasUBI = answers.has_unrelated_business_income === "Yes";
  const needsExtension = answers.needs_extension === "Yes";

  if (needsExtension) {
    return {
      likelyForm: "Form 8868",
      reason: "You indicated you need a filing extension.",
      description: "Automatic Extension of Time to File an Exempt Organization Return",
      documentsNeeded: ["EIN confirmation", "Prior year filing (if any)", "Organization governing documents"],
      sections: ["organization_identity", "filing_year", "extension_details"],
    };
  }

  if (isPrivateFoundation) {
    return {
      likelyForm: "Form 990-PF",
      reason: "Your organization is classified as a Private Foundation.",
      description: "Return of Private Foundation or Section 4947(a)(1) Trust Treated as Private Foundation",
      documentsNeeded: ["Financial statements", "Investment records", "Grant distribution records", "Governing documents", "Officer/Director compensation records"],
      sections: ["organization_identity", "filing_year", "revenue", "expenses", "governance", "program_activities", "investments", "grants", "review"],
    };
  }

  if (hasUBI) {
    return {
      likelyForm: "Form 990-T",
      reason: "Your organization has unrelated business income.",
      description: "Exempt Organization Business Income Tax Return",
      documentsNeeded: ["Unrelated business income records", "Related expense documentation", "Prior year 990-T (if any)"],
      sections: ["organization_identity", "filing_year", "ubi_income", "ubi_expenses", "review"],
    };
  }

  if (grossReceipts <= 50000) {
    return {
      likelyForm: "Form 990-N (e-Postcard)",
      reason: "Your gross receipts are normally $50,000 or less.",
      description: "Electronic Notice for Tax-Exempt Organizations Not Required to File 990 or 990-EZ",
      documentsNeeded: ["EIN confirmation", "Organization legal name", "Principal officer name and address"],
      sections: ["organization_identity", "filing_year", "review"],
    };
  }

  if (grossReceipts < 200000 && totalAssets < 500000) {
    return {
      likelyForm: "Form 990-EZ",
      reason: "Your gross receipts are under $200,000 and total assets are under $500,000.",
      description: "Short Form Return of Organization Exempt From Income Tax",
      documentsNeeded: ["Financial statements", "Donation/grant records", "Program expense records", "Officer compensation records", "Governing documents"],
      sections: ["organization_identity", "filing_year", "revenue", "expenses", "governance", "program_activities", "review"],
    };
  }

  return {
    likelyForm: "Form 990",
    reason: "Your gross receipts are $200,000 or more, or total assets are $500,000 or more.",
    description: "Return of Organization Exempt From Income Tax",
    documentsNeeded: ["Audited financial statements", "Detailed revenue records", "Functional expense allocation", "Officer/Key employee compensation", "Board governance records", "Program service accomplishments", "Schedules A through R as applicable"],
    sections: ["organization_identity", "filing_year", "revenue", "expenses", "governance", "program_activities", "compensation", "financial_statements", "additional_questions", "review"],
  };
}

// ═══════════════════════════════════════════
// INDIVIDUAL TAX INTAKE SECTIONS
// ═══════════════════════════════════════════
export const INDIVIDUAL_TAX_INTAKE_SECTIONS: FormSection[] = [
  {
    id: "filing_basics",
    title: "Filing Basics",
    purpose: "Tell us about your filing status so we can recommend the right path.",
    fields: [
      { key: "filing_status", label: "What is your filing status?", placeholder: "Select status", type: "select", required: true,
        options: ["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household", "Qualifying Surviving Spouse"],
        help: { what: "Your filing status affects your tax rate and standard deduction." } },
      { key: "state_of_residence", label: "State of Residence", placeholder: "e.g. California", required: true,
        help: { what: "The state where you lived for most of the tax year." } },
      { key: "has_dependents", label: "Do you have dependents?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "Dependents are children or qualifying relatives who live with you." } },
      { key: "num_dependents", label: "How many dependents?", placeholder: "e.g. 2",
        help: { what: "Enter the number of people you claim as dependents." } },
    ],
  },
  {
    id: "income_sources",
    title: "Income Sources",
    purpose: "Help us understand where your income comes from.",
    fields: [
      { key: "employment_type", label: "Primary Employment Type", placeholder: "Select", type: "select", required: true,
        options: ["W-2 Employee", "Self-Employed / 1099", "Both W-2 and 1099", "Unemployed / No Income", "Retired"],
        help: { what: "This determines which forms and schedules you may need." } },
      { key: "has_investment_income", label: "Do you have investment income?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "Interest, dividends, capital gains from stocks or property." } },
      { key: "has_rental_income", label: "Do you have rental income?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "Income from renting out property you own." } },
      { key: "has_foreign_income", label: "Do you have foreign income?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "Income earned in another country." } },
    ],
  },
  {
    id: "prior_filings",
    title: "Prior Filings",
    purpose: "Tell us about your prior tax history.",
    fields: [
      { key: "has_prior_return", label: "Did you file a return last year?", placeholder: "Select", type: "select", options: ["Yes", "No", "Not Sure"],
        help: { what: "If you filed last year, we can use it as a reference." } },
      { key: "has_nonprofit_involvement", label: "Are you involved with a nonprofit?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "If you run or are an officer of a nonprofit, there may be additional filing needs." } },
      { key: "service_preference", label: "What level of support do you need?", placeholder: "Select", type: "select", required: true,
        options: ["Preparation Only (I will file myself)", "Filing Support (help me file)", "Professional Review (have an expert check)"],
        help: { what: "Choose how much help you want from D.O.M.E." } },
    ],
  },
];

// ═══════════════════════════════════════════
// NONPROFIT INTAKE SECTIONS
// ═══════════════════════════════════════════
export const NONPROFIT_INTAKE_SECTIONS: FormSection[] = [
  {
    id: "org_identity",
    title: "Organization Identity",
    purpose: "Basic information about your nonprofit organization.",
    fields: [
      { key: "org_legal_name", label: "Legal Organization Name", placeholder: "e.g. Global Outreach Foundation", required: true,
        help: { what: "The legal name as registered with the IRS." } },
      { key: "ein", label: "Employer Identification Number (EIN)", placeholder: "XX-XXXXXXX", required: true,
        help: { what: "Your 9-digit IRS-issued EIN.", example: "12-3456789" } },
      { key: "org_address", label: "Organization Address", placeholder: "123 Main St", required: true,
        help: { what: "The principal address of the organization." } },
      { key: "org_city", label: "City", placeholder: "e.g. Washington", required: true, help: { what: "City of your organization." } },
      { key: "org_state", label: "State", placeholder: "e.g. DC", required: true, help: { what: "State abbreviation." } },
      { key: "org_zip", label: "ZIP Code", placeholder: "e.g. 20001", required: true, help: { what: "5-digit ZIP code." } },
    ],
  },
  {
    id: "exempt_status",
    title: "Exempt Status",
    purpose: "Help us determine your filing obligations.",
    fields: [
      { key: "exempt_type", label: "Type of Exempt Organization", placeholder: "Select", type: "select", required: true,
        options: ["501(c)(3) Public Charity", "501(c)(3) Religious", "501(c)(4) Social Welfare", "501(c)(6) Business League", "Private Foundation", "Other"],
        help: { what: "The IRS exemption category your organization falls under." } },
      { key: "is_active", label: "Is the organization currently active?", placeholder: "Select", type: "select", required: true, options: ["Yes", "No"],
        help: { what: "Whether the organization is currently operating." } },
      { key: "is_first_filing", label: "Is this the organization's first filing?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "First-time filers may need additional guidance." } },
      { key: "has_prior_990", label: "Were prior Form 990s filed?", placeholder: "Select", type: "select", options: ["Yes", "No", "Not Sure"],
        help: { what: "Knowing whether prior returns exist helps us establish filing history." } },
    ],
  },
  {
    id: "financial_summary",
    title: "Financial Summary",
    purpose: "Key financial figures that determine which form you need to file.",
    fields: [
      { key: "tax_year_start", label: "Tax Year Start Date", placeholder: "MM/DD/YYYY", type: "date", required: true,
        help: { what: "The first day of the tax year for this filing." } },
      { key: "tax_year_end", label: "Tax Year End Date", placeholder: "MM/DD/YYYY", type: "date", required: true,
        help: { what: "The last day of the tax year for this filing." } },
      { key: "gross_receipts_range", label: "Approximate Gross Receipts", placeholder: "Select range", type: "select", required: true,
        options: ["0", "25000", "50000", "100000", "200000", "500000", "1000000", "5000000"],
        help: { what: "Total revenue before expenses. This determines which form you likely need.", example: "Include donations, grants, program fees, and investment income." } },
      { key: "total_assets_range", label: "Approximate Total Assets", placeholder: "Select range", type: "select", required: true,
        options: ["0", "50000", "100000", "250000", "500000", "1000000", "5000000"],
        help: { what: "Total value of everything the organization owns at year-end." } },
      { key: "has_unrelated_business_income", label: "Does the organization have unrelated business income?", placeholder: "Select", type: "select", options: ["Yes", "No", "Not Sure"],
        help: { what: "Income from a trade or business not substantially related to the organization's exempt purpose.", warning: "If yes, you may also need to file Form 990-T." } },
      { key: "needs_extension", label: "Do you need to file an extension?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "If your filing deadline is approaching and you are not ready, an extension (Form 8868) can give you additional time." } },
    ],
  },
];

// ═══════════════════════════════════════════
// NONPROFIT 990 WORKSPACE SECTIONS
// ═══════════════════════════════════════════
export const NONPROFIT_990_WORKSPACE_SECTIONS: FormSection[] = [
  {
    id: "organization_identity",
    title: "Organization Identity",
    purpose: "Legal name, EIN, address, and basic organization information.",
    fields: [
      { key: "org_legal_name", label: "Legal Name of Organization", placeholder: "Full legal name", required: true, help: { what: "As shown on your IRS determination letter." } },
      { key: "ein", label: "Employer Identification Number", placeholder: "XX-XXXXXXX", required: true, help: { what: "9-digit EIN assigned by the IRS.", example: "12-3456789" } },
      { key: "org_dba", label: "Doing Business As (DBA)", placeholder: "If different from legal name", help: { what: "Any other name your organization uses publicly." } },
      { key: "org_phone", label: "Phone Number", placeholder: "(XXX) XXX-XXXX", help: { what: "Organization's main phone number." } },
      { key: "org_website", label: "Website", placeholder: "https://...", help: { what: "Organization's website if any." } },
      { key: "org_formation_year", label: "Year of Formation", placeholder: "e.g. 2015", help: { what: "The year the organization was legally formed." } },
      { key: "org_state_of_domicile", label: "State of Legal Domicile", placeholder: "e.g. NY", help: { what: "The state where the organization is legally domiciled." } },
    ],
  },
  {
    id: "filing_year",
    title: "Filing Year",
    purpose: "Tax period and return type information.",
    fields: [
      { key: "tax_year_start", label: "Tax Year Beginning", placeholder: "MM/DD/YYYY", type: "date", required: true, help: { what: "First day of your organization's fiscal year." } },
      { key: "tax_year_end", label: "Tax Year Ending", placeholder: "MM/DD/YYYY", type: "date", required: true, help: { what: "Last day of your organization's fiscal year." } },
      { key: "amended_return", label: "Is this an amended return?", placeholder: "Select", type: "select", options: ["No", "Yes"], help: { what: "Select Yes only if you are filing to correct a previously filed return." } },
      { key: "group_return", label: "Is this a group return?", placeholder: "Select", type: "select", options: ["No", "Yes"], help: { what: "Group returns are filed by a central organization on behalf of subordinates." } },
    ],
  },
  {
    id: "revenue",
    title: "Revenue",
    purpose: "All sources of income and revenue for the organization.",
    fields: [
      { key: "contributions_grants", label: "Contributions and Grants", placeholder: "$0.00", required: true,
        help: { what: "Total contributions, gifts, and grants received during the tax year.", example: "Include individual donations, foundation grants, and government grants." } },
      { key: "program_service_revenue", label: "Program Service Revenue", placeholder: "$0.00",
        help: { what: "Revenue earned from activities that further your exempt purpose.", example: "Tuition, admission fees, patient service revenue." } },
      { key: "investment_income", label: "Investment Income", placeholder: "$0.00",
        help: { what: "Interest, dividends, and other investment income." } },
      { key: "other_revenue", label: "Other Revenue", placeholder: "$0.00",
        help: { what: "Any revenue not included above.", example: "Fundraising event income, rental income, royalties." } },
      { key: "total_revenue", label: "Total Revenue", placeholder: "$0.00", required: true,
        help: { what: "Sum of all revenue sources. This should equal the total from your financial statements." } },
    ],
  },
  {
    id: "expenses",
    title: "Expenses",
    purpose: "Functional expense breakdown for the organization.",
    fields: [
      { key: "grants_paid", label: "Grants and Similar Amounts Paid", placeholder: "$0.00",
        help: { what: "Total grants and assistance given to individuals or organizations." } },
      { key: "salaries_compensation", label: "Salaries, Compensation, and Employee Benefits", placeholder: "$0.00",
        help: { what: "Total compensation paid to all officers, directors, and employees." } },
      { key: "professional_fees", label: "Professional Fundraising and Other Fees", placeholder: "$0.00",
        help: { what: "Fees paid to professional fundraisers, accountants, lawyers, etc." } },
      { key: "occupancy_expenses", label: "Occupancy, Rent, and Utilities", placeholder: "$0.00",
        help: { what: "Costs of office space, rent, utilities, and similar." } },
      { key: "other_expenses", label: "All Other Expenses", placeholder: "$0.00",
        help: { what: "Any expenses not listed above." } },
      { key: "total_expenses", label: "Total Expenses", placeholder: "$0.00", required: true,
        help: { what: "Total of all functional expenses." } },
    ],
  },
  {
    id: "governance",
    title: "Governance & Officers",
    purpose: "Board members, officers, and key employees.",
    fields: [
      { key: "num_voting_members", label: "Number of Voting Board Members", placeholder: "e.g. 7", required: true,
        help: { what: "Total number of individuals with voting rights on the governing board." } },
      { key: "num_independent_members", label: "Number of Independent Board Members", placeholder: "e.g. 5",
        help: { what: "Board members who are not compensated by the organization and have no family/business relationship." } },
      { key: "principal_officer_name", label: "Principal Officer Name", placeholder: "Full name", required: true,
        help: { what: "The name of the organization's principal officer (President, CEO, Executive Director)." } },
      { key: "principal_officer_title", label: "Principal Officer Title", placeholder: "e.g. Executive Director", required: true,
        help: { what: "The title of the principal officer." } },
      { key: "principal_officer_address", label: "Principal Officer Address", placeholder: "Full address",
        help: { what: "The mailing address of the principal officer." } },
      { key: "highest_compensated_amount", label: "Highest Compensation Paid", placeholder: "$0.00",
        help: { what: "The highest total compensation paid to any single officer, director, or employee." } },
    ],
  },
  {
    id: "program_activities",
    title: "Program Activities",
    purpose: "Describe your organization's mission and program accomplishments.",
    fields: [
      { key: "mission_statement", label: "Mission Statement", placeholder: "Describe your organization's mission...", required: true,
        help: { what: "A brief statement of your organization's mission or most significant activities." } },
      { key: "program_1_description", label: "Program Activity 1", placeholder: "Describe your largest program...", required: true,
        help: { what: "Describe the organization's largest program service accomplishment.", example: "Provided free legal aid to 500 immigrant families..." } },
      { key: "program_1_expenses", label: "Program 1 Expenses", placeholder: "$0.00",
        help: { what: "Total expenses allocated to this program." } },
      { key: "program_2_description", label: "Program Activity 2 (if any)", placeholder: "Describe another program...",
        help: { what: "Describe the second-largest program." } },
      { key: "program_2_expenses", label: "Program 2 Expenses", placeholder: "$0.00",
        help: { what: "Total expenses for this program." } },
    ],
  },
  {
    id: "additional_questions",
    title: "Required Additional Questions",
    purpose: "IRS-required governance and compliance questions.",
    fields: [
      { key: "has_conflict_policy", label: "Does the organization have a written conflict of interest policy?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "A conflict of interest policy helps ensure board decisions are made in the organization's best interest." } },
      { key: "has_whistleblower_policy", label: "Does the organization have a whistleblower policy?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "A policy that protects employees who report misconduct." } },
      { key: "has_document_retention_policy", label: "Does the organization have a document retention policy?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "A policy governing how long different types of records are kept." } },
      { key: "conducts_lobbying", label: "Did the organization engage in lobbying activities?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "Lobbying includes attempting to influence legislation.", warning: "501(c)(3) organizations have limits on lobbying activity." } },
      { key: "had_significant_changes", label: "Were there significant changes to governing documents?", placeholder: "Select", type: "select", options: ["Yes", "No"],
        help: { what: "Changes to articles of incorporation, bylaws, or organizational structure." } },
    ],
  },
];

// ═══════════════════════════════════════════
// TAX DOCUMENT CATEGORIES
// ═══════════════════════════════════════════
export const TAX_DOCUMENT_CATEGORIES = [
  { id: "prior_returns", label: "Prior Year Returns", icon: "FileText" },
  { id: "w2", label: "W-2 (Wages)", icon: "DollarSign" },
  { id: "1099", label: "1099 (Contractor / Other Income)", icon: "Receipt" },
  { id: "1098", label: "1098 (Mortgage Interest)", icon: "Home" },
  { id: "bank_statements", label: "Bank Statements", icon: "Building2" },
  { id: "pnl", label: "Profit & Loss Statement", icon: "TrendingUp" },
  { id: "balance_sheet", label: "Balance Sheet", icon: "BarChart3" },
  { id: "payroll", label: "Payroll Reports", icon: "Users" },
  { id: "donation_reports", label: "Donation / Contribution Reports", icon: "Heart" },
  { id: "grant_income", label: "Grant Income Reports", icon: "Award" },
  { id: "irs_notices", label: "IRS Notices", icon: "AlertTriangle" },
  { id: "governing_docs", label: "Nonprofit Governing Documents", icon: "ScrollText" },
  { id: "financial_statements", label: "Financial Statements", icon: "FileSpreadsheet" },
  { id: "bookkeeping_exports", label: "Bookkeeping Exports", icon: "Database" },
  { id: "other", label: "Other", icon: "File" },
];

// ═══════════════════════════════════════════
// SERVICE CATEGORIES
// ═══════════════════════════════════════════
export const TAX_SERVICE_CATEGORIES = [
  { id: "individual", title: "Individual Tax Help", description: "Guided tax preparation for individuals", icon: "User", to: "/tax/individual" },
  { id: "990n_filing", title: "990-N (e-Postcard) Filing", description: "Fast, affordable filing for small nonprofits", icon: "FileText", to: "/tax/990n" },
  { id: "990ez_filing", title: "990-EZ Guided Filing", description: "Step-by-step filing for growing nonprofits", icon: "FileText", to: "/tax/990ez" },
  { id: "nonprofit_filing", title: "Nonprofit Annual Filing", description: "990-series filing guidance and preparation", icon: "Building2", to: "/tax/nonprofit" },
  { id: "form_990", title: "Form 990 Guidance", description: "990 / 990-EZ / 990-N determination and workspace", icon: "FileText", to: "/tax/nonprofit" },
  { id: "extension", title: "Extension Filing", description: "Form 8868 extension workflow", icon: "Clock", to: "/tax/nonprofit" },
  { id: "doc_organizer", title: "Tax Document Organizer", description: "Upload and classify your tax documents", icon: "FolderOpen", to: "/tax/documents" },
  { id: "readiness", title: "Tax Return Readiness Check", description: "See what's missing before you file", icon: "CheckCircle2", to: "/tax/individual" },
  { id: "bookkeeping", title: "Bookkeeping / Financial Intake", description: "Organize financial records for filing", icon: "Calculator", to: "/tax/documents" },
  { id: "review", title: "Professional Review Request", description: "Request review by a tax professional", icon: "UserCheck", to: "/tax/review" },
];

// ═══════════════════════════════════════════
// PRICING
// ═══════════════════════════════════════════
export const TAX_PRICING = {
  nonprofit_990n: { price: 29, label: "990-N (e-Postcard)", priceId: "price_tax_990n_placeholder" },
  nonprofit_990ez: { price: 75, label: "990-EZ Guided Prep", priceId: "price_tax_990ez_placeholder" },
  nonprofit_990: { price: 149, label: "990 Full Guided Prep", priceId: "price_tax_990_placeholder" },
  extension_8868: { price: 25, label: "Extension Filing", priceId: "price_tax_8868_placeholder" },
  professional_review: { price: 50, label: "Professional Review Add-On", priceId: "price_tax_review_placeholder" },
  individual_filing: { price: 49, label: "Individual Filing Support", priceId: "price_tax_individual_placeholder" },
  individual_readiness: { price: 0, label: "Readiness Check (Free)", priceId: "" },
};
