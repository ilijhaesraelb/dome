/**
 * D.O.M.E. Stripe Plans Configuration
 * Replace placeholder price_id/product_id values with real Stripe IDs.
 */

export interface StripePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceLabel?: string;
  price_id: string;
  product_id: string;
  mode: "payment" | "subscription";
  interval?: "month" | "year";
  category: string;
  features: string[];
  popular?: boolean;
  badge?: string;
  cta?: string;
  includesFrom?: string;
}

export interface ExportPacket {
  id: string;
  name: string;
  price: number;
  price_id: string;
  product_id: string;
}

// ── Immigration: Individual Plans ─────────────────────────────
export const CLIENT_PLANS: StripePlan[] = [
  {
    id: "onboarding",
    name: "Basic Access",
    description: "One-time activation to unlock your D.O.M.E. account",
    price: 1,
    priceLabel: "$1 one-time",
    price_id: "price_1T9CjVBeeH6hPmEX3SFBBWT7",
    product_id: "prod_U7RcdqY6GkQYOU",
    mode: "payment",
    category: "client",
    cta: "Get Started",
    features: [
      "Create your D.O.M.E. account",
      "Immigration Passport profile",
      "Pathway Finder eligibility tool",
      "Document vault",
      "Embassy & USCIS locator",
      "Case readiness score",
      "Upload & organize documents",
    ],
  },
  {
    id: "standard",
    name: "Standard Immigration",
    description: "Full case management while your case is active",
    price: 3,
    priceLabel: "$3/month",
    price_id: "price_1T9CkOBeeH6hPmEXjXnJTeqS",
    product_id: "prod_U7RdkIw3kRtf23",
    mode: "subscription",
    interval: "month",
    category: "client",
    popular: true,
    cta: "Start Subscription",
    includesFrom: "Basic Access",
    features: [
      "Full case dashboard",
      "Immigration timeline tracking",
      "AI immigration assistant",
      "Interview preparation tools",
      "Attorney & accredited rep collaboration",
      "Voice form assistance",
      "Immigration journey history",
    ],
  },
  {
    id: "pro",
    name: "D.O.M.E. Pro",
    description: "Premium AI concierge for your immigration journey",
    price: 12,
    priceLabel: "$12/month",
    price_id: "price_1T9Cl8BeeH6hPmEX2lySaZFY",
    product_id: "prod_U7Re1k8LJx4ruL",
    mode: "subscription",
    interval: "month",
    category: "client",
    badge: "Best Value",
    cta: "Upgrade to Pro",
    includesFrom: "Standard",
    features: [
      "Unlimited export packets",
      "Advanced document scanner",
      "Document intelligence system",
      "Immigration interview simulator",
      "Timeline prediction tools",
      "Priority support",
    ],
  },
];

// ── Business Launch Center ────────────────────────────────────
export const BUSINESS_PLANS: StripePlan[] = [
  {
    id: "biz-starter",
    name: "Business Starter",
    description: "Essential guidance for forming your business",
    price: 19,
    priceLabel: "$19 one-time",
    price_id: "REPLACE_WITH_BIZ_STARTER_PRICE_ID",
    product_id: "REPLACE_WITH_BIZ_STARTER_PRODUCT_ID",
    mode: "payment",
    category: "business",
    cta: "Launch My Business",
    features: [
      "State-by-state formation guidance",
      "Entity type selection",
      "Simple guided intake",
      "Filing instructions",
      "EIN preparation checklist",
      "Startup document checklist",
    ],
  },
  {
    id: "biz-builder",
    name: "Business Builder",
    description: "Complete formation workflow with drafts",
    price: 49,
    priceLabel: "$49 one-time",
    price_id: "REPLACE_WITH_BIZ_BUILDER_PRICE_ID",
    product_id: "REPLACE_WITH_BIZ_BUILDER_PRODUCT_ID",
    mode: "payment",
    category: "business",
    popular: true,
    cta: "Build My Business",
    includesFrom: "Business Starter",
    features: [
      "Guided formation draft package",
      "Operating agreement checklist",
      "Registered agent guidance",
      "Licensing reminders",
      "Business banking preparation checklist",
      "Tax setup readiness",
    ],
  },
  {
    id: "biz-pro",
    name: "Business Pro Assist",
    description: "Expert-assisted formation with professional review",
    price: 99,
    priceLabel: "$99 one-time",
    price_id: "REPLACE_WITH_BIZ_PRO_PRICE_ID",
    product_id: "REPLACE_WITH_BIZ_PRO_PRODUCT_ID",
    mode: "payment",
    category: "business",
    badge: "Expert Help",
    cta: "Get Expert Help",
    includesFrom: "Business Builder",
    features: [
      "Priority professional handoff",
      "Formation summary packet",
      "Advanced guidance",
      "Tax setup handoff",
      "Professional review intake",
    ],
  },
];

// ── Nonprofit Launch Center ───────────────────────────────────
export const NONPROFIT_PLANS: StripePlan[] = [
  {
    id: "np-starter",
    name: "Nonprofit Starter",
    description: "Essential nonprofit formation guidance",
    price: 29,
    priceLabel: "$29 one-time",
    price_id: "REPLACE_WITH_NP_STARTER_PRICE_ID",
    product_id: "REPLACE_WITH_NP_STARTER_PRODUCT_ID",
    mode: "payment",
    category: "nonprofit",
    cta: "Start Nonprofit",
    features: [
      "Nonprofit formation guidance",
      "Board setup checklist",
      "Bylaws preparation checklist",
      "Charitable purpose drafting help",
      "EIN preparation guidance",
    ],
  },
  {
    id: "np-builder",
    name: "Nonprofit Builder",
    description: "Full nonprofit workflow with IRS readiness",
    price: 79,
    priceLabel: "$79 one-time",
    price_id: "REPLACE_WITH_NP_BUILDER_PRICE_ID",
    product_id: "REPLACE_WITH_NP_BUILDER_PRODUCT_ID",
    mode: "payment",
    category: "nonprofit",
    popular: true,
    cta: "Build Nonprofit",
    includesFrom: "Nonprofit Starter",
    features: [
      "Nonprofit formation workflow",
      "IRS 501(c)(3) readiness checklist",
      "Governance guidance",
      "Compliance reminders",
    ],
  },
  {
    id: "np-pro",
    name: "Nonprofit Pro Assist",
    description: "Expert-assisted nonprofit launch",
    price: 149,
    priceLabel: "$149 one-time",
    price_id: "REPLACE_WITH_NP_PRO_PRICE_ID",
    product_id: "REPLACE_WITH_NP_PRO_PRODUCT_ID",
    mode: "payment",
    category: "nonprofit",
    badge: "Expert Help",
    cta: "Get Expert Help",
    includesFrom: "Nonprofit Builder",
    features: [
      "Professional nonprofit review intake",
      "Priority support",
      "Nonprofit launch packet preparation",
    ],
  },
];

// ── EB-5 Investor Center ──────────────────────────────────────
export const EB5_PLANS: StripePlan[] = [
  {
    id: "eb5-readiness",
    name: "EB-5 Readiness",
    description: "Organize your EB-5 documentation",
    price: 49,
    priceLabel: "$49 one-time",
    price_id: "REPLACE_WITH_EB5_READINESS_PRICE_ID",
    product_id: "REPLACE_WITH_EB5_READINESS_PRODUCT_ID",
    mode: "payment",
    category: "eb5",
    cta: "Start Preparation",
    features: [
      "Investor readiness questionnaire",
      "Source-of-funds checklist",
      "EB-5 document vault",
      "Job creation checklist",
      "Risk disclosures",
    ],
  },
  {
    id: "eb5-prep",
    name: "EB-5 Investor Prep",
    description: "Advanced EB-5 document organization",
    price: 149,
    priceLabel: "$149 one-time",
    price_id: "REPLACE_WITH_EB5_PREP_PRICE_ID",
    product_id: "REPLACE_WITH_EB5_PREP_PRODUCT_ID",
    mode: "payment",
    category: "eb5",
    popular: true,
    cta: "Prepare My Case",
    includesFrom: "EB-5 Readiness",
    features: [
      "Advanced document organization",
      "Investor summary profile",
      "Project interest intake",
      "Attorney consultation request",
    ],
  },
  {
    id: "eb5-handoff",
    name: "EB-5 Professional Handoff",
    description: "Full professional review and consultation",
    price: 299,
    priceLabel: "$299 one-time",
    price_id: "REPLACE_WITH_EB5_HANDOFF_PRICE_ID",
    product_id: "REPLACE_WITH_EB5_HANDOFF_PRODUCT_ID",
    mode: "payment",
    category: "eb5",
    badge: "Premium",
    cta: "Get Expert Review",
    includesFrom: "EB-5 Investor Prep",
    features: [
      "Professional review intake",
      "Investor preparation packet",
      "Consultation scheduling",
    ],
  },
];

// ── Business Opportunities Marketplace ────────────────────────
export const MARKETPLACE_PLANS: StripePlan[] = [
  {
    id: "listing-standard",
    name: "Standard Listing",
    description: "One active business opportunity listing",
    price: 10,
    priceLabel: "$10/month",
    price_id: "REPLACE_WITH_LISTING_STD_PRICE_ID",
    product_id: "REPLACE_WITH_LISTING_STD_PRODUCT_ID",
    mode: "subscription",
    interval: "month",
    category: "marketplace",
    cta: "Create Listing",
    features: [
      "One business opportunity listing",
      "Investor inquiry form",
      "Listing analytics",
      "Admin moderation",
    ],
  },
  {
    id: "listing-featured",
    name: "Featured Listing",
    description: "Premium placement and visibility",
    price: 25,
    priceLabel: "$25/month",
    price_id: "REPLACE_WITH_LISTING_FEAT_PRICE_ID",
    product_id: "REPLACE_WITH_LISTING_FEAT_PRODUCT_ID",
    mode: "subscription",
    interval: "month",
    category: "marketplace",
    popular: true,
    cta: "Feature My Listing",
    includesFrom: "Standard Listing",
    features: [
      "Featured placement",
      "Highlighted listing card",
      "Priority visibility",
    ],
  },
  {
    id: "listing-org",
    name: "Organization Multi-Listing",
    description: "Up to 10 listings for organizations",
    price: 75,
    priceLabel: "$75/month",
    price_id: "REPLACE_WITH_LISTING_ORG_PRICE_ID",
    product_id: "REPLACE_WITH_LISTING_ORG_PRODUCT_ID",
    mode: "subscription",
    interval: "month",
    category: "marketplace",
    badge: "Teams",
    cta: "Create Organization Account",
    features: [
      "Up to 10 listings",
      "Organization profile",
      "Listing analytics dashboard",
      "Priority moderation",
    ],
  },
];

// ── Professional & Enterprise Plans ───────────────────────────
export const PROFESSIONAL_PLANS: StripePlan[] = [
  {
    id: "attorney-ar",
    name: "Attorney / A&R Plan",
    description: "Essential tools for immigration professionals",
    price: 79,
    priceLabel: "$79/month",
    price_id: "REPLACE_WITH_ATTORNEY_AR_PRICE_ID",
    product_id: "REPLACE_WITH_ATTORNEY_AR_PRODUCT_ID",
    mode: "subscription",
    interval: "month",
    category: "professional",
    cta: "Start Plan",
    features: [
      "Client case management",
      "Document collaboration",
      "Immigration workflow tools",
      "Business & nonprofit intake routing",
    ],
  },
  {
    id: "professional",
    name: "Professional Plan",
    description: "Full-featured suite for growing practices",
    price: 149,
    priceLabel: "$149/month",
    price_id: "REPLACE_WITH_PROFESSIONAL_PRICE_ID",
    product_id: "REPLACE_WITH_PROFESSIONAL_PRODUCT_ID",
    mode: "subscription",
    interval: "month",
    category: "professional",
    popular: true,
    cta: "Start Professional",
    features: [
      "Unlimited clients",
      "Referral tracking",
      "Analytics dashboard",
      "EB-5 intake routing",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    description: "Complete platform for large teams",
    price: 499,
    priceLabel: "$499–$1,500/month",
    price_id: "REPLACE_WITH_ENTERPRISE_PRICE_ID",
    product_id: "REPLACE_WITH_ENTERPRISE_PRODUCT_ID",
    mode: "subscription",
    interval: "month",
    category: "professional",
    badge: "Custom",
    cta: "Contact Sales",
    features: [
      "Multi-team dashboards",
      "Organization management tools",
      "Advanced analytics",
      "API readiness",
      "Premium support",
    ],
  },
];

// ── Organization Plans (legacy compat) ────────────────────────
export const ORGANIZATION_PLANS: StripePlan[] = [
  {
    id: "nonprofit-org",
    name: "Nonprofit Access",
    description: "Affordable tools for mission-driven organizations",
    price: 25,
    price_id: "REPLACE_WITH_NONPROFIT_PRICE_ID",
    product_id: "REPLACE_WITH_NONPROFIT_PRODUCT_ID",
    mode: "subscription",
    interval: "month",
    category: "organization",
    features: [
      "Client case management",
      "Document vault",
      "Pathway finder",
      "Collaboration tools",
      "Organization dashboard",
      "Referral tracking",
    ],
  },
  {
    id: "large-org",
    name: "Large Organization",
    description: "Scaled access for high-volume organizations",
    price: 150,
    price_id: "REPLACE_WITH_LARGE_ORG_PRICE_ID",
    product_id: "REPLACE_WITH_LARGE_ORG_PRODUCT_ID",
    mode: "subscription",
    interval: "month",
    category: "organization",
    features: [
      "Multiple staff users",
      "Bulk case management",
      "Organization analytics",
      "Advanced case dashboards",
      "Referral system integration",
    ],
  },
];

// ── Export Packets ─────────────────────────────────────────────
export const EXPORT_PACKETS: ExportPacket[] = [
  { id: "marriage-adjustment", name: "Marriage Adjustment Packet", price: 10, price_id: "REPLACE_WITH_MARRIAGE_EXPORT_PRICE_ID", product_id: "REPLACE_WITH_MARRIAGE_EXPORT_PRODUCT_ID" },
  { id: "work-visa", name: "Work Visa Packet", price: 10, price_id: "REPLACE_WITH_WORK_VISA_EXPORT_PRICE_ID", product_id: "REPLACE_WITH_WORK_VISA_EXPORT_PRODUCT_ID" },
  { id: "citizenship", name: "Citizenship Packet", price: 5, price_id: "REPLACE_WITH_CITIZENSHIP_EXPORT_PRICE_ID", product_id: "REPLACE_WITH_CITIZENSHIP_EXPORT_PRODUCT_ID" },
  { id: "family-petition", name: "Family Petition Packet", price: 10, price_id: "REPLACE_WITH_FAMILY_PETITION_EXPORT_PRICE_ID", product_id: "REPLACE_WITH_FAMILY_PETITION_EXPORT_PRODUCT_ID" },
  { id: "student-visa", name: "Student Visa Packet", price: 5, price_id: "REPLACE_WITH_STUDENT_VISA_EXPORT_PRICE_ID", product_id: "REPLACE_WITH_STUDENT_VISA_EXPORT_PRODUCT_ID" },
];

// ── Add-on Services ───────────────────────────────────────────
export const ADDON_SERVICES: StripePlan[] = [
  {
    id: "ai-case-report",
    name: "AI Case Insight Report",
    description: "Premium AI-generated case analysis",
    price: 14,
    price_id: "REPLACE_WITH_AI_REPORT_PRICE_ID",
    product_id: "REPLACE_WITH_AI_REPORT_PRODUCT_ID",
    mode: "payment",
    category: "addon",
    features: [
      "Possible immigration pathways",
      "Missing evidence analysis",
      "Readiness score improvements",
      "Recommended next steps",
    ],
  },
  {
    id: "priority-support",
    name: "Priority Support",
    description: "Faster response times and dedicated support",
    price: 5,
    price_id: "REPLACE_WITH_PRIORITY_SUPPORT_PRICE_ID",
    product_id: "REPLACE_WITH_PRIORITY_SUPPORT_PRODUCT_ID",
    mode: "subscription",
    interval: "month",
    category: "addon",
    features: [
      "Priority chat support",
      "Faster response times",
      "Dedicated support channel",
    ],
  },
];

// ── Consultation Services ─────────────────────────────────────
export const CONSULTATION_TIERS = [
  { name: "Basic Consultation", price: 25, duration: "15 min", commission: 0.20 },
  { name: "Standard Consultation", price: 50, duration: "30 min", commission: 0.20 },
  { name: "Extended Consultation", price: 75, duration: "60 min", commission: 0.20 },
];

// ── Translation Services ──────────────────────────────────────
export const TRANSLATION_SERVICES = [
  { name: "Birth Certificate Translation", priceRange: [25, 40], commission: 0.30 },
  { name: "Marriage Certificate Translation", priceRange: [25, 40], commission: 0.30 },
  { name: "Legal Document Translation", priceRange: [40, 75], commission: 0.30 },
];

// ── Referral Rewards ──────────────────────────────────────────
export const REFERRAL_REWARDS = {
  signupBonus: 5,
  exportCommission: 10,
  subscriptionCommission: 1,
  trialDurations: [7, 21, 30, 60, 90, 180, 365],
};

// ── Helpers ───────────────────────────────────────────────────
export const ALL_PLANS = [...CLIENT_PLANS, ...PROFESSIONAL_PLANS, ...ORGANIZATION_PLANS, ...BUSINESS_PLANS, ...NONPROFIT_PLANS, ...EB5_PLANS, ...MARKETPLACE_PLANS];

export const getPlanByProductId = (productId: string): StripePlan | undefined =>
  ALL_PLANS.find((p) => p.product_id === productId);

export const getPlanById = (id: string): StripePlan | undefined =>
  ALL_PLANS.find((p) => p.id === id);
