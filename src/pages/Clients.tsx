import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone } from "lucide-react";
import { mockClients } from "@/data/mockData";
import { useT } from "@/hooks/useT";

const Clients = () => {
  const t = useT();
  const [search, setSearch] = useState("");
  const filtered = mockClients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("clients.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("clients.totalClients", { count: mockClients.length })}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t("clients.searchClients")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center font-semibold text-sm text-accent-foreground">
                  {client.avatarInitials}
                </div>
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{t("clients.joined")} {client.joinedDate}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {client.email}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {client.phone}</div>
              </div>
              <Badge variant="outline">
                {client.activeCases} {client.activeCases !== 1 ? t("clients.activeCasesPlural") : t("clients.activeCases")}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Clients;
