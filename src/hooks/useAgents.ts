import { useQuery } from "@tanstack/react-query";
import mockAgents, { Agent } from "@/data/agents";

export const fetchAgents = async (): Promise<Agent[]> => {
  // For now return mock data; later replace with API call
  return new Promise((res) => setTimeout(() => res(mockAgents), 200));
};

export const fetchAgentById = async (id: string): Promise<Agent | undefined> => {
  const agents = await fetchAgents();
  return agents.find(a => a.id === id);
};

export const useAgents = () => useQuery<Agent[]>(["agents"], fetchAgents);
export const useAgent = (id?: string) => useQuery<Agent | undefined>(["agent", id], () => fetchAgentById(id || ""), { enabled: !!id });

export default useAgents;
