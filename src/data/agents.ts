export interface Agent {
  id: string;
  name: string;
  description: string;
  goal: string;
  owner: string;
  createdAt: string;
  lastRun?: string;
}

export const mockAgents: Agent[] = [
  {
    id: "a1",
    name: "Intake Assistant",
    description: "Guides intake collection and ensures required documents are requested from clients.",
    goal: "Collect required intake documents",
    owner: "System",
    createdAt: "2026-03-01",
    lastRun: "2026-04-12",
  },
  {
    id: "a2",
    name: "Evidence Checker",
    description: "Analyzes uploaded evidence and flags missing or low-quality items for practitioner review.",
    goal: "Improve evidence completeness",
    owner: "Sarah Chen",
    createdAt: "2026-03-15",
  },
  {
    id: "a3",
    name: "Filing Timeline Predictor",
    description: "Estimates processing timeline for a case based on historical data and current status.",
    goal: "Predict filing timeline",
    owner: "Analytics",
    createdAt: "2026-04-02",
    lastRun: "2026-04-28",
  },
  {
    id: "dome-ai-001",
    name: "D.O.M.E. AI",
    description: "Unified AI assistant for immigration, tax, nonprofit, business, and community support — guiding users, analyzing documents, recommending forms, and enabling professional review workflows.",
    goal: "Serve as an AI guide, document analyzer, workflow navigator, and compliance-aware support engine across D.O.M.E. services",
    owner: "D.O.M.E. System",
    createdAt: "2026-05-31",
  },
];

export default mockAgents;
