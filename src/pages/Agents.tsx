import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";

const Agents = () => {
  const { data: agents, isLoading } = useAgents();
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Agents</h2>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/agents/new")}>Create Agent</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Available Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : agents && agents.length > 0 ? (
              <div className="grid gap-3">
                {agents.map((a) => (
                  <Link key={a.id} to={`/agents/${a.id}`} className="block p-4 border rounded hover:shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-sm text-muted-foreground">{a.description}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{a.owner}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No agents found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Agents;
