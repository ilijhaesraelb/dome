/**
 * Centralized tax-field help definitions keyed by field key.
 * Each entry provides beginner & professional content.
 */

export interface TaxFieldHelpEntry {
  type: "info" | "warning" | "tip"; // drives icon: ?, !, ℹ
  beginner: {
    explanation: string;
    why: string;
    howToFind: string;
    example: string;
    warning?: string;
  };
  professional: {
    explanation: string;
    reference?: string; // IRS line reference
    warning?: string;
  };
}

export const TAX_FIELD_HELP: Record<string, TaxFieldHelpEntry> = {
  // ── Individual Income ──
  w2_wages: {
    type: "info",
    beginner: {
      explanation: "This is your total wages earned from your employer before taxes were taken out.",
      why: "This amount is used to calculate your total taxable income for the year.",
      howToFind: "Look at Box 1 on your W-2 form, labeled 'Wages, tips, other compensation'.",
      example: "45,250.00",
      warning: "Do not enter net pay or after-tax income. Use the gross amount from Box 1.",
    },
    professional: {
      explanation: "Gross compensation per W-2 Box 1. Includes wages, tips, and other compensation.",
      reference: "Form 1040, Line 1a",
      warning: "Excludes pre-tax 401(k) elective deferrals already reflected in Box 1.",
    },
  },
  w2_federal_withheld: {
    type: "info",
    beginner: {
      explanation: "This is the total federal income tax your employer already withheld from your paychecks.",
      why: "This reduces the amount of tax you owe or increases your refund.",
      howToFind: "Look at Box 2 on your W-2 form.",
      example: "5,800.00",
    },
    professional: {
      explanation: "Federal income tax withheld per W-2 Box 2.",
      reference: "Form 1040, Line 25a",
    },
  },
  w2_state_withheld: {
    type: "info",
    beginner: {
      explanation: "This is the total state income tax withheld by your employer.",
      why: "It is applied toward your state tax liability.",
      howToFind: "Look at Box 17 on your W-2 form.",
      example: "2,100.00",
    },
    professional: {
      explanation: "State income tax withheld per W-2 Box 17.",
      reference: "State return withholding line",
    },
  },
  nec_1099_income: {
    type: "info",
    beginner: {
      explanation: "This is non-employee compensation income, typically for freelance or contract work.",
      why: "This income is subject to self-employment tax in addition to income tax.",
      howToFind: "Check Box 1 on your 1099-NEC form.",
      example: "12,500.00",
      warning: "Do not combine multiple 1099s unless instructed. Enter each one separately.",
    },
    professional: {
      explanation: "Non-employee compensation reported on 1099-NEC Box 1. Subject to SE tax.",
      reference: "Schedule C / Schedule SE",
      warning: "Aggregate only if same payer; otherwise enter separate Schedule C per activity.",
    },
  },
  interest_income: {
    type: "info",
    beginner: {
      explanation: "This is interest earned from bank accounts, CDs, or savings bonds.",
      why: "Interest income is taxable and must be reported.",
      howToFind: "Check your 1099-INT form from your bank, Box 1.",
      example: "320.50",
    },
    professional: {
      explanation: "Taxable interest per 1099-INT Box 1.",
      reference: "Form 1040, Line 2b / Schedule B if > $1,500",
    },
  },
  dividend_income: {
    type: "info",
    beginner: {
      explanation: "This is income from stock dividends or mutual fund distributions.",
      why: "Dividends are part of your taxable income.",
      howToFind: "Check your 1099-DIV form, Box 1a for ordinary dividends.",
      example: "1,450.00",
    },
    professional: {
      explanation: "Ordinary dividends per 1099-DIV Box 1a. Qualified dividends in Box 1b for preferential rate.",
      reference: "Form 1040, Line 3a/3b",
    },
  },

  // ── Business / Self-Employment ──
  business_expenses: {
    type: "info",
    beginner: {
      explanation: "These are costs related to operating your business, like supplies, software, or rent.",
      why: "Expenses reduce your taxable income, potentially lowering your tax bill.",
      howToFind: "Use your bookkeeping records, bank statements, or expense spreadsheet.",
      example: "Office supplies: 1,200.00",
      warning: "Personal expenses should not be included. Only business-related costs qualify.",
    },
    professional: {
      explanation: "Ordinary and necessary business expenses per IRC §162.",
      reference: "Schedule C, Part II",
      warning: "Ensure proper substantiation under §274 for meals, travel, and entertainment.",
    },
  },
  home_office_sqft: {
    type: "tip",
    beginner: {
      explanation: "If you use a dedicated space in your home exclusively for business, enter the square footage.",
      why: "You may qualify for a home office deduction that reduces your taxable income.",
      howToFind: "Measure the room or area you use exclusively for work.",
      example: "150",
      warning: "The space must be used regularly and exclusively for business.",
    },
    professional: {
      explanation: "Square footage for simplified method ($5/sqft, max 300 sqft) or regular method (Form 8829).",
      reference: "Schedule C, Line 30 / Form 8829",
    },
  },
  vehicle_miles: {
    type: "tip",
    beginner: {
      explanation: "Enter the total business miles driven during the tax year.",
      why: "You may deduct mileage for business travel, which lowers your taxable income.",
      howToFind: "Check your mileage log, GPS app records, or odometer readings.",
      example: "8,500",
      warning: "Commuting miles (home to office) do not count as business miles.",
    },
    professional: {
      explanation: "Business miles for standard mileage rate deduction. Log required per §274(d).",
      reference: "Schedule C, Part IV",
    },
  },

  // ── Deductions ──
  filing_status: {
    type: "info",
    beginner: {
      explanation: "Your filing status determines your tax bracket and standard deduction amount.",
      why: "Choosing the correct status can significantly affect your tax liability.",
      howToFind: "Based on your marital and family situation as of December 31.",
      example: "Single, Married Filing Jointly, Head of Household",
      warning: "If married, filing jointly usually results in a lower combined tax.",
    },
    professional: {
      explanation: "Filing status per §1(a)-(d) and §2. Determines rate schedule and standard deduction.",
      reference: "Form 1040, Filing Status section",
    },
  },
  standard_or_itemized: {
    type: "info",
    beginner: {
      explanation: "You can either take a standard flat deduction or itemize individual deductions.",
      why: "Choose whichever gives you a larger deduction to reduce your taxes.",
      howToFind: "Compare your total itemized deductions (medical, mortgage interest, taxes paid, charity) to the standard deduction for your filing status.",
      example: "Standard deduction for Single (2025): $15,000",
    },
    professional: {
      explanation: "Elect standard deduction or itemize on Schedule A. Compare totals.",
      reference: "Form 1040, Line 12 / Schedule A",
    },
  },
  charitable_donations: {
    type: "info",
    beginner: {
      explanation: "Enter the total amount you donated to qualified charities during the year.",
      why: "Charitable donations can be deducted if you itemize.",
      howToFind: "Gather donation receipts and acknowledgement letters from charities.",
      example: "2,500.00",
      warning: "You must have written acknowledgement for donations over $250.",
    },
    professional: {
      explanation: "Cash and non-cash contributions to §501(c)(3) organizations.",
      reference: "Schedule A, Lines 11-14",
      warning: "Non-cash over $500 requires Form 8283. AGI limitations apply.",
    },
  },

  // ── Nonprofit / 990 ──
  gross_receipts: {
    type: "info",
    beginner: {
      explanation: "This is the total money your organization received from all sources during the tax year.",
      why: "This determines which IRS form your nonprofit must file (990-N, 990-EZ, or full 990).",
      howToFind: "Add up all donations, grants, program revenue, and other income from your financial records.",
      example: "42,000.00",
      warning: "Include all sources: donations, grants, program fees, investment income.",
    },
    professional: {
      explanation: "Total gross receipts per §6033. Determines filing threshold.",
      reference: "Form 990/990-EZ, Part I / 990-N eligibility",
      warning: "≤$50K → 990-N; <$200K receipts AND <$500K assets → 990-EZ; otherwise full 990.",
    },
  },
  total_assets: {
    type: "info",
    beginner: {
      explanation: "This is the total value of everything your organization owns at the end of the year.",
      why: "Combined with gross receipts, this determines your required filing form.",
      howToFind: "Check your balance sheet or financial statements for total assets.",
      example: "125,000.00",
    },
    professional: {
      explanation: "End-of-year total assets per balance sheet. Filing threshold determinant.",
      reference: "Form 990, Part X / 990-EZ, Line 25",
    },
  },
  officer_compensation: {
    type: "warning",
    beginner: {
      explanation: "Enter compensation paid to officers, directors, and key employees.",
      why: "The IRS reviews this to ensure compensation is reasonable for exempt organizations.",
      howToFind: "Check your payroll records and board resolutions for approved compensation.",
      example: "President: 65,000.00",
      warning: "Unreasonable compensation can trigger excise taxes or loss of exempt status.",
    },
    professional: {
      explanation: "Reportable compensation per §4958 intermediate sanctions rules.",
      reference: "Form 990, Part VII / Schedule J",
      warning: "Excess benefit transactions subject to excise tax on disqualified persons.",
    },
  },
  program_expenses: {
    type: "info",
    beginner: {
      explanation: "These are costs directly related to carrying out your organization's mission.",
      why: "A higher ratio of program expenses to total expenses shows efficiency and strengthens donor trust.",
      howToFind: "Separate your expenses into Program, Management, and Fundraising categories.",
      example: "Program services: 85,000.00",
    },
    professional: {
      explanation: "Functional expense allocation for program services.",
      reference: "Form 990, Part IX",
    },
  },

  // ── Entity / Organization ──
  ein: {
    type: "info",
    beginner: {
      explanation: "Your Employer Identification Number is like a Social Security number for your organization.",
      why: "The IRS uses this to identify your organization for tax purposes.",
      howToFind: "Check your IRS determination letter, prior tax returns, or bank records.",
      example: "12-3456789",
      warning: "Make sure this matches your IRS records exactly.",
    },
    professional: {
      explanation: "EIN per CP 575 or SS-4 confirmation.",
      reference: "All forms, header section",
    },
  },
  fiscal_year_end: {
    type: "info",
    beginner: {
      explanation: "This is the last day of your organization's accounting year.",
      why: "Your filing deadline is based on your fiscal year end.",
      howToFind: "Check your articles of incorporation or prior tax returns.",
      example: "12/31 or 06/30",
    },
    professional: {
      explanation: "Fiscal year-end per §441. Determines filing due date (15th day of 5th month after FYE).",
      reference: "Form 990 header / §6072(e)",
    },
  },

  // ── Financial Statements ──
  balance_sheet_total: {
    type: "info",
    beginner: {
      explanation: "This is the total of all assets on your balance sheet.",
      why: "It provides a snapshot of your organization's financial health.",
      howToFind: "Look at the bottom line of the Assets section on your balance sheet.",
      example: "250,000.00",
    },
    professional: {
      explanation: "Total assets per audited or compiled balance sheet.",
      reference: "Form 990, Part X / Financial statement notes",
    },
  },
  profit_loss_net: {
    type: "info",
    beginner: {
      explanation: "This is your net income (or loss) — total revenue minus total expenses.",
      why: "It shows whether your business or organization had a profit or loss for the year.",
      howToFind: "Check the bottom line of your Profit & Loss statement (also called Income Statement).",
      example: "Net Income: 18,500.00",
    },
    professional: {
      explanation: "Net income per P&L / income statement.",
      reference: "Schedule C (sole prop) / Form 1120 (corp) / Form 990 Part I",
    },
  },
};

/**
 * Section-level help panels for major tax workflow sections.
 */
export interface TaxSectionHelpEntry {
  title: string;
  beginner: {
    summary: string;
    checklist: string[];
    commonMistakes: string[];
    tips: string[];
  };
  professional: {
    summary: string;
    references: string[];
  };
}

export const TAX_SECTION_HELP: Record<string, TaxSectionHelpEntry> = {
  income: {
    title: "Income",
    beginner: {
      summary: "This section collects all your income sources including wages (W-2), freelance income (1099), interest, and dividends. Make sure all documents are uploaded before completing this section.",
      checklist: ["W-2 from each employer", "1099-NEC for freelance work", "1099-INT for bank interest", "1099-DIV for dividends", "Any other income documents"],
      commonMistakes: ["Forgetting to include all W-2s if you had multiple jobs", "Mixing up gross pay and net pay", "Not reporting cash income"],
      tips: ["Upload your documents first — fields can be pre-filled", "Enter amounts exactly as shown on your forms"],
    },
    professional: {
      summary: "Aggregate all compensation, SE income, interest, dividends, and other income per applicable schedules.",
      references: ["Form 1040 Lines 1-9", "Schedules B, C, D, E", "IRC §61 gross income"],
    },
  },
  deductions: {
    title: "Deductions",
    beginner: {
      summary: "Deductions reduce your taxable income. You can take the standard deduction or itemize if your individual deductions are higher.",
      checklist: ["Mortgage interest statement (1098)", "Property tax records", "Charitable donation receipts", "Medical expense records", "State/local tax records"],
      commonMistakes: ["Itemizing when the standard deduction is higher", "Including personal expenses as business deductions", "Missing the $250 educator expense deduction"],
      tips: ["Compare your total itemized deductions to the standard deduction", "Keep receipts for all deductions"],
    },
    professional: {
      summary: "Standard deduction vs. itemized (Schedule A). Above-the-line deductions on Schedule 1.",
      references: ["Form 1040 Line 12", "Schedule A", "Schedule 1 Part II", "IRC §63"],
    },
  },
  business: {
    title: "Business Income & Expenses",
    beginner: {
      summary: "If you are self-employed or run a business, this section captures your business revenue and deductible expenses.",
      checklist: ["1099-NEC or 1099-K forms", "Business expense receipts", "Mileage log", "Home office measurements", "Asset purchase records"],
      commonMistakes: ["Deducting personal expenses as business costs", "Not keeping a mileage log", "Forgetting quarterly estimated tax payments"],
      tips: ["Separate personal and business finances", "Track expenses throughout the year"],
    },
    professional: {
      summary: "Schedule C for sole proprietors. SE tax on Schedule SE. QBI deduction §199A analysis.",
      references: ["Schedule C", "Schedule SE", "Form 8995/8995-A", "IRC §162, §179, §280A"],
    },
  },
  nonprofit_overview: {
    title: "Nonprofit Filing Overview",
    beginner: {
      summary: "This section helps determine which IRS form your nonprofit needs to file and collects the required organizational and financial information.",
      checklist: ["EIN confirmation letter", "Articles of incorporation", "Financial statements or records", "Officer and director list", "Prior year filing (if any)"],
      commonMistakes: ["Filing the wrong form for your organization size", "Missing the filing deadline (penalties apply)", "Not reporting all revenue sources"],
      tips: ["Answer the screening questions accurately — they determine your required form", "Gather all financial records before starting"],
    },
    professional: {
      summary: "Filing determination based on §6033 thresholds. 990-N/EZ/990/990-PF per gross receipts and asset levels.",
      references: ["IRC §6033", "Rev. Proc. 2011-15", "Form 990 instructions"],
    },
  },
  payments: {
    title: "Tax Payments & Credits",
    beginner: {
      summary: "This section captures taxes you've already paid (withholding, estimated payments) and any credits you qualify for.",
      checklist: ["W-2 withholding amounts", "Estimated tax payment records (1040-ES)", "Prior year overpayment applied", "Credit documentation (education, child, EV)"],
      commonMistakes: ["Forgetting estimated payments made during the year", "Not claiming eligible credits"],
      tips: ["Check all four quarters of estimated payments", "Research credits you may qualify for"],
    },
    professional: {
      summary: "Withholding (Line 25), estimated payments (Line 26), credits per Schedules 3/8812/8863.",
      references: ["Form 1040 Lines 25-32", "Schedule 3", "IRC §31, §6654"],
    },
  },
  review: {
    title: "Review & Finalization",
    beginner: {
      summary: "Review all entries for accuracy before submitting. Check that uploaded documents match entered values.",
      checklist: ["All income sources entered", "Deductions verified", "Filing status confirmed", "Bank info for direct deposit", "Signature ready"],
      commonMistakes: ["Transposing numbers from forms", "Wrong Social Security number", "Incorrect bank routing number"],
      tips: ["Compare each entry to the source document", "Double-check names and SSNs"],
    },
    professional: {
      summary: "Final review of return accuracy, e-file diagnostics, and signing.",
      references: ["Circular 230 due diligence", "§6694 preparer penalties"],
    },
  },
};
