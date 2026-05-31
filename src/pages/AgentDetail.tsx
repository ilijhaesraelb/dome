import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/hooks/useAgents";
import type { Agent } from "@/data/agents";

const chatFeatures = [
  "AI Guide",
  "AI Assistant",
  "AI Navigator",
  "AI Document Analyzer",
  "AI Case Organizer",
  "AI Support System",
  "AI Compliance Checker",
  "AI Workflow Engine",
  "AI Translator and Simplifier",
];

const AgentDetail = () => {
  const { id } = useParams();
  const { data: agent, isLoading } = useAgent(id);
  const agentData = agent as Agent | undefined;
  const navigate = useNavigate();

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!agentData) return <div className="p-6 text-muted-foreground">Agent not found.</div>;

  const openChat = () => {
    if (agentData.id === "dome-ai-001") {
      navigate(`/agents/${id}/chat`);
      return;
    }
    alert(`Running agent: ${agentData.name}`);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-bold">{agentData.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={openChat}>{agentData.id === "dome-ai-001" ? "Chat with D.O.M.E. AI" : "Run Agent"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2"><strong>Goal:</strong> {agentData.goal}</p>
          <p className="mb-2"><strong>Owner:</strong> {agentData.owner}</p>
          <p className="mb-2"><strong>Created:</strong> {agentData.createdAt}</p>
          {agentData.lastRun && <p className="mb-2"><strong>Last Run:</strong> {agentData.lastRun}</p>}
          <p className="text-sm text-muted-foreground mt-4">{agentData.description}</p>

          {agentData.id === "dome-ai-001" && (
            <div className="mt-6">
              <p className="mb-4 text-sm text-foreground">
                D.O.M.E. AI is a chatbot built to help customers using the platform's services, including document analysis, case guidance, form recommendations, compliance checks, and more.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {chatFeatures.map((feature) => (
                  <div key={feature} className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-sm font-medium text-foreground">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDetail;
