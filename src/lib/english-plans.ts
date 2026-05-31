// English Learning Center Stripe plan configuration
export const ENGLISH_PLANS = {
  free: {
    name: "Free",
    price: 0,
    price_id: null,
    product_id: null,
    features: [
      "Placement test",
      "3 daily voice practices",
      "Beginner vocabulary lessons",
      "Sample class preview",
    ],
  },
  basic: {
    name: "Basic English",
    price: 19,
    price_id: "price_1TBGkoBeeH6hPmEXz7b2coc7",
    product_id: "prod_U9ZugXUyfkPSD6",
    features: [
      "Group classes",
      "Weekly speaking practice",
      "Beginner & intermediate lessons",
      "Progress tracking",
      "15 daily voice practices",
    ],
  },
  pro: {
    name: "Pro English",
    price: 39,
    price_id: "price_1TBGkpBeeH6hPmEXYCR7P2f7",
    product_id: "prod_U9ZusFZCrfi8IB",
    features: [
      "Everything in Basic",
      "Unlimited group classes",
      "Advanced AI speaking practice",
      "Immigration interview prep",
      "Citizenship preparation",
      "Unlimited voice practices",
    ],
  },
  premium: {
    name: "Premium English",
    price: 79,
    price_id: "price_1TBGkrBeeH6hPmEXP7yM10xI",
    product_id: "prod_U9ZuBGs3w3y97c",
    features: [
      "Everything in Pro",
      "2 private lessons/month",
      "Personal teacher feedback",
      "Priority support",
      "Advanced speaking reviews",
      "Certificate priority",
    ],
  },
};

export const ENGLISH_COURSES_PRODUCTS = {
  citizenship_prep: {
    name: "Citizenship Preparation Program",
    price: 99,
    price_id: "price_1TBGksBeeH6hPmEX4s8MOnTb",
    product_id: "prod_U9ZufbrcUrt5EN",
  },
  work_intensive: {
    name: "English for Work Intensive",
    price: 69,
    price_id: "price_1TBGkuBeeH6hPmEXamQjSrZ4",
    product_id: "prod_U9ZuJJUJFVwFTy",
  },
  interview_prep: {
    name: "Immigration Interview Preparation",
    price: 69,
    price_id: "price_1TBGkvBeeH6hPmEXwfcOtH42",
    product_id: "prod_U9ZuRw5yyzRtAQ",
  },
};

export const PRIVATE_LESSON_PRODUCTS = {
  "30min": {
    name: "Private Lesson - 30min",
    price: 20,
    price_id: "price_1TBGkwBeeH6hPmEXqwoWdpRq",
    product_id: "prod_U9ZuP4HLawdXFZ",
  },
  "60min": {
    name: "Private Lesson - 60min",
    price: 40,
    price_id: "price_1TBGkxBeeH6hPmEXNmQXdfXL",
    product_id: "prod_U9ZusI2XpEuqRf",
  },
};
