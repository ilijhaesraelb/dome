export type EnglishLevel = "beginner" | "basic" | "workplace" | "advanced";

export interface Lesson {
  id: string;
  number: number;
  title: string;
  voicePrompt?: string;
}

export interface Module {
  id: string;
  number: number;
  title: string;
  voicePrompt?: string;
  lessons: Lesson[];
}

export interface Level {
  id: EnglishLevel;
  number: number;
  title: string;
  subtitle: string;
  goal: string;
  lessonCount: number;
  certificate: string;
  modules: Module[];
}

const L = (mod: number, num: number, title: string): Lesson => ({
  id: `l${mod}-${num}`,
  number: num,
  title,
});

export const CURRICULUM: Level[] = [
  /* ════════════════ LEVEL 1 — BEGINNER ════════════════ */
  {
    id: "beginner",
    number: 1,
    title: "Beginner English",
    subtitle: "Level 1",
    goal: "Help migrants understand and speak basic English phrases used daily.",
    lessonCount: 30,
    certificate: "Beginner English Certificate",
    modules: [
      {
        id: "b1",
        number: 1,
        title: "Basic Introductions",
        voicePrompt: "Hello, my name is __.",
        lessons: [
          L(1, 1, "Hello and Greetings"),
          L(1, 2, "Introducing Yourself"),
          L(1, 3, "Asking Someone's Name"),
          L(1, 4, "Where Are You From?"),
          L(1, 5, "Countries and Nationalities"),
        ],
      },
      {
        id: "b2",
        number: 2,
        title: "Numbers & Time",
        voicePrompt: "What time do you work?",
        lessons: [
          L(2, 6, "Numbers 1–20"),
          L(2, 7, "Numbers 20–100"),
          L(2, 8, "Telling Time"),
          L(2, 9, "Days of the Week"),
          L(2, 10, "Months and Dates"),
        ],
      },
      {
        id: "b3",
        number: 3,
        title: "Everyday Vocabulary",
        voicePrompt: "I need to go to the supermarket.",
        lessons: [
          L(3, 11, "Food Vocabulary"),
          L(3, 12, "Transportation"),
          L(3, 13, "Places in the City"),
          L(3, 14, "Family Members"),
          L(3, 15, "Common Objects"),
        ],
      },
      {
        id: "b4",
        number: 4,
        title: "Simple Questions",
        voicePrompt: "Where do you live?",
        lessons: [
          L(4, 16, "Where Questions"),
          L(4, 17, "What Questions"),
          L(4, 18, "How Questions"),
          L(4, 19, "Yes / No Questions"),
          L(4, 20, "Simple Conversations"),
        ],
      },
      {
        id: "b5",
        number: 5,
        title: "Basic Sentences",
        lessons: [
          L(5, 21, "Subject + Verb"),
          L(5, 22, "Present Simple"),
          L(5, 23, "Talking About Work"),
          L(5, 24, "Talking About Home"),
          L(5, 25, "Talking About Your Day"),
        ],
      },
      {
        id: "b6",
        number: 6,
        title: "Survival English",
        lessons: [
          L(6, 26, "Shopping"),
          L(6, 27, "At the Doctor"),
          L(6, 28, "Asking for Directions"),
          L(6, 29, "Using Public Transportation"),
          L(6, 30, "Emergency Vocabulary"),
        ],
      },
    ],
  },

  /* ════════════════ LEVEL 2 — BASIC COMMUNICATION ════════════════ */
  {
    id: "basic",
    number: 2,
    title: "Basic Communication",
    subtitle: "Level 2",
    goal: "Build confidence in daily conversations and workplace basics.",
    lessonCount: 30,
    certificate: "Communication English Certificate",
    modules: [
      {
        id: "c1",
        number: 1,
        title: "Daily Conversations",
        voicePrompt: "What do you do for work?",
        lessons: [
          L(1, 1, "Talking About Your Day"),
          L(1, 2, "Talking About Work"),
          L(1, 3, "Talking About Family"),
          L(1, 4, "Talking About Hobbies"),
          L(1, 5, "Making Small Talk"),
        ],
      },
      {
        id: "c2",
        number: 2,
        title: "Shopping and Services",
        lessons: [
          L(2, 6, "Ordering Food"),
          L(2, 7, "Buying Groceries"),
          L(2, 8, "Talking to Cashiers"),
          L(2, 9, "Returning Items"),
          L(2, 10, "Making Appointments"),
        ],
      },
      {
        id: "c3",
        number: 3,
        title: "Housing and Transportation",
        lessons: [
          L(3, 11, "Renting an Apartment"),
          L(3, 12, "Talking to a Landlord"),
          L(3, 13, "Public Transportation Conversations"),
          L(3, 14, "Asking for Directions"),
          L(3, 15, "Using Ride Services"),
        ],
      },
      {
        id: "c4",
        number: 4,
        title: "Workplace Basics",
        voicePrompt: "I work from 8 AM to 4 PM.",
        lessons: [
          L(4, 16, "Talking to a Supervisor"),
          L(4, 17, "Understanding Instructions"),
          L(4, 18, "Workplace Safety Vocabulary"),
          L(4, 19, "Schedules and Shifts"),
          L(4, 20, "Customer Service Basics"),
        ],
      },
      {
        id: "c5",
        number: 5,
        title: "Telephone English",
        lessons: [
          L(5, 21, "Answering Phone Calls"),
          L(5, 22, "Leaving a Message"),
          L(5, 23, "Scheduling Meetings"),
          L(5, 24, "Speaking Clearly on the Phone"),
          L(5, 25, "Professional Phone Etiquette"),
        ],
      },
      {
        id: "c6",
        number: 6,
        title: "Problem Solving",
        lessons: [
          L(6, 26, "Explaining a Problem"),
          L(6, 27, "Asking for Help"),
          L(6, 28, "Making Complaints"),
          L(6, 29, "Understanding Instructions"),
          L(6, 30, "Clarifying Information"),
        ],
      },
    ],
  },

  /* ════════════════ LEVEL 3 — WORKPLACE ENGLISH ════════════════ */
  {
    id: "workplace",
    number: 3,
    title: "Workplace English",
    subtitle: "Level 3",
    goal: "Help migrants communicate effectively at work and during interviews.",
    lessonCount: 30,
    certificate: "Workplace English Certificate",
    modules: [
      {
        id: "w1",
        number: 1,
        title: "Job Search English",
        voicePrompt: "I worked as a cook for five years.",
        lessons: [
          L(1, 1, "Understanding Job Listings"),
          L(1, 2, "Talking About Work Experience"),
          L(1, 3, "Resume Vocabulary"),
          L(1, 4, "Professional Introductions"),
          L(1, 5, "Job Application Conversations"),
        ],
      },
      {
        id: "w2",
        number: 2,
        title: "Job Interviews",
        voicePrompt: "Tell me about yourself.",
        lessons: [
          L(2, 6, "Common Interview Questions"),
          L(2, 7, "Talking About Skills"),
          L(2, 8, "Explaining Your Experience"),
          L(2, 9, "Talking About Strengths"),
          L(2, 10, "Asking Questions in Interviews"),
        ],
      },
      {
        id: "w3",
        number: 3,
        title: "Workplace Communication",
        lessons: [
          L(3, 11, "Talking to Managers"),
          L(3, 12, "Understanding Instructions"),
          L(3, 13, "Team Communication"),
          L(3, 14, "Reporting Problems"),
          L(3, 15, "Customer Communication"),
        ],
      },
      {
        id: "w4",
        number: 4,
        title: "Workplace Situations",
        lessons: [
          L(4, 16, "Handling Complaints"),
          L(4, 17, "Solving Workplace Problems"),
          L(4, 18, "Safety Conversations"),
          L(4, 19, "Requesting Time Off"),
          L(4, 20, "Professional Etiquette"),
        ],
      },
      {
        id: "w5",
        number: 5,
        title: "Industry Vocabulary",
        lessons: [
          L(5, 21, "Construction English"),
          L(5, 22, "Hospitality English"),
          L(5, 23, "Healthcare English"),
          L(5, 24, "Retail English"),
          L(5, 25, "Customer Service English"),
        ],
      },
      {
        id: "w6",
        number: 6,
        title: "Professional Communication",
        lessons: [
          L(6, 26, "Writing Simple Emails"),
          L(6, 27, "Explaining Work Processes"),
          L(6, 28, "Meeting Conversations"),
          L(6, 29, "Giving Updates"),
          L(6, 30, "Professional Confidence"),
        ],
      },
    ],
  },

  /* ════════════════ LEVEL 4 — ADVANCED / IMMIGRATION ════════════════ */
  {
    id: "advanced",
    number: 4,
    title: "Advanced / Immigration English",
    subtitle: "Level 4",
    goal: "Prepare students for interviews, citizenship, and professional communication.",
    lessonCount: 30,
    certificate: "Advanced English Certificate",
    modules: [
      {
        id: "a1",
        number: 1,
        title: "Immigration Interview Preparation",
        voicePrompt: "Why did you come to the United States?",
        lessons: [
          L(1, 1, "Explaining Your Background"),
          L(1, 2, "Talking About Your Immigration History"),
          L(1, 3, "Answering Personal Questions"),
          L(1, 4, "Describing Your Work History"),
          L(1, 5, "Confidence in Interviews"),
        ],
      },
      {
        id: "a2",
        number: 2,
        title: "Citizenship Preparation",
        lessons: [
          L(2, 6, "U.S. Civics Questions"),
          L(2, 7, "Government Vocabulary"),
          L(2, 8, "Historical Topics"),
          L(2, 9, "Citizenship Interview Practice"),
          L(2, 10, "Speaking with Confidence"),
        ],
      },
      {
        id: "a3",
        number: 3,
        title: "Advanced Conversation",
        lessons: [
          L(3, 11, "Debating Ideas"),
          L(3, 12, "Discussing Current Events"),
          L(3, 13, "Expressing Opinions"),
          L(3, 14, "Problem Solving Discussions"),
          L(3, 15, "Community Conversations"),
        ],
      },
      {
        id: "a4",
        number: 4,
        title: "Professional Communication",
        lessons: [
          L(4, 16, "Public Speaking"),
          L(4, 17, "Presenting Ideas"),
          L(4, 18, "Negotiating"),
          L(4, 19, "Leadership Conversations"),
          L(4, 20, "Professional Networking"),
        ],
      },
      {
        id: "a5",
        number: 5,
        title: "Business English",
        lessons: [
          L(5, 21, "Business Vocabulary"),
          L(5, 22, "Entrepreneurship English"),
          L(5, 23, "Starting a Business"),
          L(5, 24, "Talking to Investors"),
          L(5, 25, "Customer Relations"),
        ],
      },
      {
        id: "a6",
        number: 6,
        title: "Final Mastery",
        lessons: [
          L(6, 26, "Fluency Conversations"),
          L(6, 27, "Storytelling"),
          L(6, 28, "Complex Grammar"),
          L(6, 29, "Confidence Speaking"),
          L(6, 30, "Final Speaking Assessment"),
        ],
      },
    ],
  },
];

export const TOTAL_LESSONS = CURRICULUM.reduce((a, l) => a + l.lessonCount, 0);
export const TOTAL_MODULES = CURRICULUM.reduce((a, l) => a + l.modules.length, 0);
