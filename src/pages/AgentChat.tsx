import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAgent } from "@/hooks/useAgents";
import AIAssistant from "@/pages/portal/AIAssistant";

const AgentChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useAgent(id);

  if (isLoading) return <div className="p-6">Loading chat...</div>;
  if (!agent) return <div className="p-6 text-muted-foreground">Agent not found.</div>;

  if (agent.id !== "dome-ai-001") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-display text-2xl font-bold">Chat is available for D.O.M.E. AI only</h2>
        </div>
        <p className="text-sm text-muted-foreground">This agent currently does not include a chatbot workflow.</p>
      </div>
    );
  }

  return <AIAssistant />;
};

export default AgentChat;
